# 模块深度分析：Agent Client Protocol (ACP)

> 基于 `src/acp/`（55 个文件）源码逐行分析，覆盖客户端、控制平面、持久绑定、会话身份、权限系统。

## 1. 架构概览

```mermaid
flowchart TD
    GATEWAY["Gateway Server"] --> SERVER["acp/server.ts<br/>ACP 服务端"]
    SERVER --> CONTROL["control-plane/manager.ts<br/>控制平面管理器"]
    
    CONTROL --> CORE["manager.core.ts<br/>核心逻辑"]
    CONTROL --> IDENTITY["manager.identity-reconcile.ts<br/>身份协调"]
    CONTROL --> RUNTIME_CTRL["manager.runtime-controls.ts<br/>运行时控制"]
    
    CLIENT["acp/client.ts (639L)<br/>ACP 客户端"] --> SPAWN["spawn ChildProcess<br/>stdio: pipe"]
    SPAWN --> NDJSON["ndJsonStream<br/>@agentclientprotocol/sdk"]
    NDJSON --> CONNECTION["ClientSideConnection<br/>双向 RPC"]
    
    CONNECTION --> PERM["resolvePermissionRequest()<br/>工具权限管理"]
    CONNECTION --> SESSION_UPDATE["printSessionUpdate()<br/>会话事件输出"]
    
    BINDING["persistent-bindings.lifecycle.ts<br/>持久绑定"] --> RESOLVE["persistent-bindings.resolve.ts<br/>绑定解析"]
    
    CLEANUP["spawn.ts (78L)<br/>失败清理"] --> MANAGER["AcpSessionManager"]
    CLEANUP --> BINDING_SVC["SessionBindingService"]
    CLEANUP --> GW_API["Gateway sessions.delete"]
```

## 2. ACP 客户端（`client.ts` — 639L）

### 2.1 客户端创建流程

```mermaid
sequenceDiagram
    participant Caller as 调用方
    participant Client as createAcpClient()
    participant Spawn as ChildProcess
    participant ACP as ACP Server
    
    Caller->>Client: createAcpClient(opts)
    Client->>Client: ensureOpenClawCliOnPath()
    Client->>Client: resolveAcpClientSpawnEnv()<br/>（剥离敏感 envvar）
    Client->>Client: resolveAcpClientSpawnInvocation()<br/>（跨平台命令解析）
    Client->>Spawn: spawn(command, args, {stdio: pipe})
    Spawn->>ACP: stdin/stdout 管道
    Client->>Client: ndJsonStream(stdin, stdout)
    Client->>ACP: client.initialize({protocolVersion, capabilities})
    ACP-->>Client: 初始化确认
    Client->>ACP: client.newSession({cwd, mcpServers})
    ACP-->>Client: {sessionId}
    Client-->>Caller: {client, agent, sessionId}
```

### 2.2 工具权限自动审批

```typescript
// 安全自动批准的工具列表
const SAFE_AUTO_APPROVE_TOOL_IDS = new Set(["read", "search", "web_search", "memory_search"]);

// read 工具额外约束: 必须在 cwd 范围内
function isReadToolCallScopedToCwd(params, toolName, toolTitle, cwd): boolean {
  if (toolName !== "read") return false;
  const absolutePath = resolveAbsoluteScopedPath(rawPath, cwd);
  return isPathWithinRoot(absolutePath, path.resolve(cwd));
}

// 危险工具始终需要人工批准
import { DANGEROUS_ACP_TOOLS } from "../security/dangerous-tools.js";
```

### 2.3 权限解析流程

```mermaid
flowchart TD
    REQ["RequestPermissionRequest"] --> RESOLVE_NAME["resolveToolNameForPermission()"]
    RESOLVE_NAME --> SOURCES{"从 3 个来源提取工具名"}
    SOURCES --> META["_meta.toolName"]
    SOURCES --> INPUT["rawInput.tool"]
    SOURCES --> TITLE["title 解析"]
    
    META & INPUT & TITLE --> VALIDATE["normalizeToolName()<br/>校验: a-z0-9._-, ≤128字符"]
    VALIDATE --> CROSS_CHECK{"交叉验证<br/>多源一致性"}
    CROSS_CHECK -->|不一致| DENY["返回 undefined → 需要人工"]
    CROSS_CHECK -->|一致| AUTO_CHECK{"shouldAutoApproveToolCall()"}
    
    AUTO_CHECK -->|SAFE_ID + 范围内| AUTO_APPROVE["自动批准"]
    AUTO_CHECK -->|DANGEROUS 或未知| PROMPT["promptUserPermission()<br/>30 秒超时"]
```

### 2.4 环境变量安全

```typescript
// 自动剥离 Provider Auth 环境变量（防止凭据泄露到 ACP 子进程）
function shouldStripProviderAuthEnvVarsForAcpServer(params): boolean;
// 仅当 ACP 使用默认 openclaw 命令时才剥离
// 自定义 serverCommand 保留原始环境

// 还须剥离: activeSkillEnvKeys（技能环境变量）
const stripKeys = buildAcpClientStripKeys({
  stripProviderAuthEnvVars: true,
  activeSkillEnvKeys: getActiveSkillEnvKeys(),
});
```

### 2.5 会话事件输出

```typescript
// printSessionUpdate() — 4 种事件类型
switch (update.sessionUpdate) {
  case "agent_message_chunk":  // 流式文本输出
  case "tool_call":            // 工具调用
  case "tool_call_update":     // 工具状态更新
  case "available_commands_update": // 可用命令更新
}
```

---

## 3. Spawn 失败清理（`spawn.ts` — 78L）

```mermaid
sequenceDiagram
    participant Cleanup as cleanupFailedAcpSpawn()
    participant Runtime as ACP Runtime
    participant Manager as AcpSessionManager
    participant Binding as SessionBindingService
    participant Gateway as Gateway API
    
    Cleanup->>Runtime: runtime.close({reason: "spawn-failed"})
    Note right of Runtime: 最佳努力，错误仅日志
    Cleanup->>Manager: closeSession({allowBackendUnavailable: true})
    Note right of Manager: 最佳努力
    Cleanup->>Binding: unbind({reason: "spawn-failed"})
    Note right of Binding: 最佳努力
    alt shouldDeleteSession
        Cleanup->>Gateway: sessions.delete({emitLifecycleHooks: false})
    end
```

4 层资源清理，每层独立 catch（不中断后续清理）。

---

## 4. 控制平面管理器

### 管理器组件

| 文件 | 行数 | 职责 |
|------|------|------|
| `manager.core.ts` | ~400 | Agent 生命周期、spawn/stop |
| `manager.identity-reconcile.ts` | ~200 | 身份链接与解除关联 |
| `manager.runtime-controls.ts` | ~150 | 运行时参数控制 |
| `manager.types.ts` | ~100 | 管理器类型定义 |
| `manager.utils.ts` | ~80 | 工具函数 |

### 运行时缓存

```typescript
// runtime-cache.ts
type RuntimeCache = Map<string, {
  runtimeId: string;
  sessionKey: string;
  lastActivity: number;
}>;
```

---

## 5. 持久绑定（Persistent Bindings）

```typescript
// persistent-bindings.types.ts
type PersistentBinding = {
  sessionKey: string;       // 绑定的会话键
  runtimeSessionName: string; // ACP 运行时会话名
  backend: string;          // ACP Provider 名
  createdAt: number;        // 创建时间
};
```

## 6. 会话身份系统

```typescript
// runtime/session-identity.ts — 会话唯一标识
// runtime/session-identifiers.ts — 多标识符解析
// runtime/session-meta.ts — 创建时间、活动时间、turn计数、token用量
```

## 7. ACP 策略

```typescript
// policy.ts
type AcpPolicy = {
  enabled: boolean;
  allowSpawn: boolean;
  maxConcurrent: number;
  timeoutMs: number;
};
```

## 8. 关键文件清单

| 目录/文件 | 文件数 | 职责 |
|-----------|--------|------|
| `client.ts` | 1 (639L) | ACP 客户端、权限、spawn |
| `server.ts` | 1 | ACP 服务端 |
| `control-plane/` | 12 | 管理器、缓存、spawn 清理 |
| `runtime/` | 10 | 注册表、会话身份、错误 |
| `persistent-bindings*` | 5 | 持久绑定生命周期 |
| `event-mapper.ts` | 1 | ACP↔OpenClaw 事件映射 |
| `policy.ts` | 1 | ACP 策略 |
| `session*.ts` | 3 | 会话管理 |
| `translator*.ts` | 5 | 协议翻译 |
