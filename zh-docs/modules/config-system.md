# 模块分析：配置系统 (Config System)

## 概览 — `src/config/` (215 文件)

配置系统是 OpenClaw 的"宪法"，通过 Zod Schema 定义一切可配置项，并提供验证、合并、热重载、环境变量替换等完整能力。

```mermaid
graph TB
  subgraph "Schema 定义层"
    ZOD["zod-schema.ts (32KB)<br/>主 Schema 入口"]
    CORE["zod-schema.core.ts (23KB)<br/>核心字段"]
    AGENTS_Z["zod-schema.agents.ts<br/>Agent 配置"]
    PROVIDERS_Z["zod-schema.providers-core.ts (57KB)<br/>供应商配置"]
    RUNTIME_Z["zod-schema.agent-runtime.ts (25KB)<br/>运行时配置"]
    HOOKS_Z["zod-schema.hooks.ts (4KB)"]
    SESSION_Z["zod-schema.session.ts (7KB)"]
  end

  subgraph "Schema 辅助"
    LABELS["schema.labels.ts (51KB)<br/>字段标签"]
    HELP["schema.help.ts (162KB)<br/>帮助文本"]
    HINTS["schema.hints.ts (7KB)<br/>智能提示"]
    TAGS["schema.tags.ts (5KB)<br/>字段标签"]
  end

  subgraph "IO 层"
    IO["io.ts (51KB)<br/>配置读写引擎"]
    PATHS["paths.ts (8KB)<br/>路径解析"]
    INCL["includes.ts (10KB)<br/>配置包含解析"]
    ENV_SUB["env-substitution.ts (5KB)<br/>环境变量替换"]
    MERGE["merge-patch.ts<br/>配置合并"]
  end

  subgraph "验证与迁移"
    VALID["validation.ts (20KB)<br/>配置验证引擎"]
    LEGACY["legacy.migrations.ts<br/>遗留迁移 (3 部分)"]
    WARN["allowed-values.ts<br/>允许值约束"]
    DOC["doc-baseline.ts (16KB)<br/>文档基线"]
  end

  subgraph "运行时"
    DEFAULTS["defaults.ts (14KB)<br/>默认值"]
    ENV_VARS["env-vars.ts<br/>环境变量映射"]
    REDACT["redact-snapshot.ts (22KB)<br/>敏感信息脱敏"]
    GROUPS["group-policy.ts (12KB)<br/>群组策略"]
    AUTO_EN["plugin-auto-enable.ts (15KB)<br/>插件自动启用"]
  end

  ZOD --> CORE & AGENTS_Z & PROVIDERS_Z & RUNTIME_Z & HOOKS_Z & SESSION_Z
  ZOD --> LABELS & HELP & HINTS & TAGS
  IO --> PATHS & INCL & ENV_SUB & MERGE
  IO --> VALID
  VALID --> LEGACY
```

### Zod Schema 体系

配置 Schema 总计超过 **300KB**，定义了系统所有可配置项：

| 文件                           | 大小  | 覆盖范围           |
| ------------------------------ | ----- | ------------------ |
| `schema.help.ts`               | 162KB | 每个字段的帮助文本 |
| `zod-schema.providers-core.ts` | 57KB  | 供应商核心配置     |
| `schema.labels.ts`             | 51KB  | 字段中文/英文标签  |
| `zod-schema.ts`                | 32KB  | 主 Schema 定义     |
| `zod-schema.agent-runtime.ts`  | 25KB  | Agent 运行时       |
| `zod-schema.core.ts`           | 23KB  | 核心字段           |

### 配置 IO 引擎

`io.ts`（51KB）是配置读写的核心，负责：

- 配置文件查找与加载（支持多路径）
- Zod 验证并附带友好错误信息
- 环境变量 `${VAR}` 替换
- `includes` 指令解析（配置组合）
- 写回配置文件（保留注释和格式）
- 运行时快照写入
- 敏感信息自动脱敏

### 环境变量替换

`env-substitution.ts` 支持在配置中使用 `${ENV_VAR}` 语法：

- 支持默认值：`${VAR:-default}`
- 递归替换
- 安全性：禁止替换敏感路径

### 遗留配置迁移

`legacy.migrations.*.ts`（共 3 个文件，46KB）处理从旧版配置格式到新版的自动迁移：

- 字段重命名
- 结构重组
- 默认值补充
- 废弃字段清理

### 敏感信息脱敏

`redact-snapshot.ts`（22KB）确保配置快照中不泄露：

- API Key
- Token
- 密码
- Secret 引用
