# 模块深度分析：密钥管理系统

> 基于 `src/secrets/`（53 个文件）源码逐行分析，覆盖 3 种 Secret Provider、引用解析、安全路径、运行时收集器。

## 1. 架构概览

```mermaid
flowchart TD
    CONFIG["openclaw.json<br/>Secret 引用"] --> RESOLVE["resolve.ts (960L)<br/>引用解析"]
    RESOLVE --> GROUP["按 Provider 分组<br/>并行解析"]
    
    GROUP --> ENV["resolveEnvRefs()<br/>环境变量 Provider"]
    GROUP --> FILE["resolveFileRefs()<br/>文件 Provider"]
    GROUP --> EXEC["resolveExecRefs()<br/>外部命令 Provider"]
    
    ENV --> ALLOWLIST["白名单校验"]
    FILE --> SECURE_PATH["assertSecurePath()<br/>路径安全验证"]
    FILE --> JSON_POINTER["readJsonPointer()<br/>JSON 路径读取"]
    EXEC --> SECURE_CMD["assertSecurePath()<br/>命令安全验证"]
    EXEC --> EXEC_RUN["runExecResolver()<br/>子进程执行"]
    EXEC_RUN --> PARSE["parseExecValues()<br/>协议解析"]
    
    RUNTIME["runtime.ts<br/>运行时快照"] --> AUTH_COLLECT["runtime-auth-collectors.ts"]
    RUNTIME --> CONFIG_COLLECT["runtime-config-collectors-*.ts"]
    
    AUDIT["audit.ts<br/>凭据审计"] --> SCAN["auth-profiles-scan.ts"]
    SCAN --> MATRIX["credential-matrix.ts<br/>凭据矩阵"]
```

## 2. 引用解析核心（`resolve.ts` — 960L）

### 2.1 三种 Secret Provider

```mermaid
flowchart LR
    subgraph ENV["环境变量 Provider"]
        ENV_REF["$env:OPENAI_API_KEY"] --> ENV_RESOLVE["process.env 查找"]
        ENV_RESOLVE --> ALLOW{"在白名单中?"}
    end
    
    subgraph FILE["文件 Provider"]
        FILE_REF["$file:vault/keys.json#apiKey"] --> SECURE["安全路径验证"]
        SECURE --> READ["读取文件"]
        READ --> MODE{"模式"}
        MODE -->|json| POINTER["JSON Pointer 解析"]
        MODE -->|singleValue| TRIM["读取纯文本（删尾换行）"]
    end
    
    subgraph EXEC["外部命令 Provider"]
        EXEC_REF["$exec:vault-cli#secret-id"] --> VALIDATE["命令路径安全验证"]
        VALIDATE --> SPAWN["spawn 子进程"]
        SPAWN --> STDIN["stdin 写入请求"]
        STDIN --> STDOUT["stdout 解析响应"]
    end
```

### 2.2 环境变量 Provider

```typescript
async function resolveEnvRefs(params): Promise<ProviderResolutionOutput> {
  // 1. 白名单校验: providerConfig.allowlist 非空时强制匹配
  // 2. process.env[ref.id] 查找
  // 3. 缺失或空值 → SecretRefResolutionError
}
```

### 2.3 文件 Provider

两种模式：
- **json**（默认）：读取 JSON 文件 → `readJsonPointer(payload, ref.id)` 深层取值
- **singleValue**：读取整文件为一个字符串值（去除尾换行）

安全验证：
```typescript
await assertSecurePath({
  targetPath,
  label: "secrets.providers.xxx.path",
  // 验证: 绝对路径、非 symlink、权限收紧、属主匹配
});
```

### 2.4 外部命令 Provider（Exec Protocol v1）

```typescript
// 请求（写入 stdin）
{ protocolVersion: 1, provider: "vault", ids: ["key1", "key2"] }

// 响应（从 stdout 读取）
{
  protocolVersion: 1,
  values: { key1: "secret-value-1", key2: "secret-value-2" },
  errors: { key3: { message: "not found" } }  // 可选
}
```

安全约束：
- 命令路径必须绝对路径
- 可配置 `trustedDirs`（限制可执行命令目录）
- 可配置 `allowInsecurePath`（跳过权限检查）
- 环境变量白名单 `passEnv`（仅传递指定变量）
- 超时保护：`timeoutMs`（默认 5s）+ `noOutputTimeoutMs`
- 输出限制：`maxOutputBytes`（默认 1MB）

---

## 3. 安全路径验证（`assertSecurePath()`）

```mermaid
flowchart TD
    PATH["输入路径"] --> ABS{"绝对路径?"}
    ABS -->|否| ERROR1["错误"]
    ABS -->|是| STAT["readFileStatOrThrow()"]
    STAT --> SYMLINK{"是 symlink?"}
    SYMLINK -->|是 + 不允许| ERROR2["错误"]
    SYMLINK -->|是 + 允许| REALPATH["fs.realpath() 解析"]
    REALPATH --> STAT2["再次 stat 验证"]
    SYMLINK -->|否| TRUSTED{"在 trustedDirs 内?"}
    
    TRUSTED --> PERMS["inspectPathPermissions()"]
    PERMS --> WRITABLE{"worldWritable<br/>或 groupWritable?"}
    WRITABLE -->|是| ERROR3["权限过宽"]
    WRITABLE -->|否| READABLE{"worldReadable<br/>但不允许?"}
    READABLE -->|是| ERROR4["权限过宽"]
    READABLE -->|否| OWNER{"文件属主 = 当前 uid?"}
    OWNER -->|否| ERROR5["属主不匹配"]
    OWNER -->|是| OK["路径安全 ✓"]
```

---

## 4. 运行时收集器

6 组收集器，按关注域分离：

| 收集器 | 文件 | 职责 |
|--------|------|------|
| Auth | `runtime-auth-collectors.ts` | AI Provider 凭据（OpenAI/Anthropic/...） |
| Core | `runtime-config-collectors-core.ts` | 核心配置凭据 |
| Channels | `runtime-config-collectors-channels.ts` | 渠道 Bot Token |
| TTS | `runtime-config-collectors-tts.ts` | TTS API Key |
| Web Tools | `runtime-web-tools.ts` | Web 工具凭据 |
| Gateway Auth | `runtime-gateway-auth-surfaces.ts` | Gateway 认证面 |

## 5. Auth Profile 系统

```json
{
  "secrets": {
    "profiles": {
      "production": {
        "OPENAI_API_KEY": { "$env": "PROD_OPENAI_KEY" },
        "ANTHROPIC_API_KEY": { "$secret": "prod-anthropic" }
      }
    }
  }
}
```

## 6. 凭据矩阵

`credential-matrix.ts` — 生成所有已配置凭据的表格视图（用于 `openclaw config` 命令）。

## 7. 错误体系

两级错误类型：
```typescript
class SecretProviderResolutionError extends Error {
  scope = "provider";  // Provider 级别错误（配置缺失、超时）
}

class SecretRefResolutionError extends Error {
  scope = "ref";       // 引用级别错误（缺失、白名单外）
}
```

## 8. 解析限制

```typescript
const DEFAULTS = {
  maxProviderConcurrency: 4,    // 并行 Provider 数
  maxRefsPerProvider: 512,      // 每 Provider 最大引用数
  maxBatchBytes: 256 KB,        // 批次请求最大字节
  fileMaxBytes: 1 MB,           // 文件 Provider 最大文件
  execTimeoutMs: 5_000,         // Exec 超时
  execMaxOutputBytes: 1 MB,     // Exec 输出限制
};
```

## 9. 关键文件清单

| 文件 | 行数 | 职责 |
|------|------|------|
| `resolve.ts` | 960 | 三种 Provider 解析核心 |
| `runtime.ts` | ~600 | 运行时 Secret 快照 |
| `configure.ts` | ~300 | 交互式配置向导 |
| `configure-plan.ts` | ~250 | 配置变更计划 |
| `apply.ts` | ~200 | 凭据应用 |
| `audit.ts` | ~200 | 凭据健康审计 |
| `ref-contract.ts` | ~150 | Secret 引用契约 |
| `json-pointer.ts` | ~80 | JSON Pointer 实现 |
| `credential-matrix.ts` | ~200 | 凭据矩阵生成 |
| `auth-profiles-scan.ts` | ~150 | Profile 扫描 |
