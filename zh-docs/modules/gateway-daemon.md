# 模块分析：Gateway & Daemon

## 网关 (Gateway) — `src/gateway/` (250 文件)

网关是 OpenClaw 的核心中枢，协调 Agent、渠道、插件、会话等所有模块的运行。

```mermaid
graph TB
  subgraph "Gateway Server (server.impl.ts 41KB)"
    HTTP_SRV["HTTP Server"]
    WS_SRV["WebSocket Server"]
    RPC_REG["RPC Method Registry<br/>server-methods.ts"]

    subgraph "HTTP Endpoints"
      OPENAI["OpenAI 兼容 API<br/>openai-http.ts (17KB)"]
      ORES["Open Responses API<br/>openresponses-http.ts (25KB)"]
      CUI["Control UI<br/>control-ui.ts (13KB)"]
      PROBE["Health Probe<br/>probe.ts"]
    end

    subgraph "Core Services"
      CHAT["Chat Engine<br/>server-chat.ts (19KB)"]
      CHAN["Channel Manager<br/>server-channels.ts (18KB)"]
      CRON_S["Cron Scheduler<br/>server-cron.ts (17KB)"]
      PLG_S["Plugin Manager<br/>server-plugins.ts (15KB)"]
      NODE_E["Node Events<br/>server-node-events.ts (21KB)"]
    end

    subgraph "Security"
      AUTH["Auth System<br/>auth.ts (15KB)"]
      RATE["Rate Limiting<br/>auth-rate-limit.ts (7KB)"]
      ORIGIN["Origin Check<br/>origin-check.ts"]
      ROLE["Role Policy<br/>role-policy.ts"]
    end
  end

  HTTP_SRV --> OPENAI & ORES & CUI & PROBE
  WS_SRV --> CHAT & NODE_E
  RPC_REG --> CHAN & CRON_S & PLG_S
  HTTP_SRV & WS_SRV --> AUTH & RATE & ORIGIN
```

### 核心功能

#### RPC 方法注册

`server-methods.ts` 将核心方法、渠道方法和插件方法统一注册为 RPC 接口。方法分为多个作用域（`method-scopes.ts`）：

- **Core**：chat、config、sessions
- **Channel**：各渠道特有操作
- **Plugin**：插件定义的自定义方法
- **Control Plane**：管理面板 API

#### 配置热重载

```mermaid
flowchart LR
    CHANGE["配置文件变更"] --> PLAN["config-reload-plan.ts<br/>计算变更差异"]
    PLAN --> HANDLER["server-reload-handlers.ts<br/>分类处理各项变更"]
    HANDLER --> RESTART{"需要重启?"}
    RESTART -->|Yes| SENTINEL["server-restart-sentinel.ts<br/>延迟重启"]
    RESTART -->|No| APPLY["原地应用<br/>server-runtime-config.ts"]
```

#### OpenAI 兼容层

`openai-http.ts` 提供完整的 `/v1/chat/completions` 兼容接口，支持：

- 流式与非流式响应
- 图像预算控制
- 消息渠道映射

#### 会话管理

- `session-utils.ts` (32KB) — 会话 CRUD、历史记录、状态持久化
- `session-reset-service.ts` — 会话重置与清理
- `sessions-patch.ts` (15KB) — 会话配置实时修改
- `server-session-key.ts` — 稳定会话键生成

### 设计模式

| 模式     | 应用                                    |
| -------- | --------------------------------------- |
| Facade   | `GatewayServer` 为复杂后端提供统一接口  |
| 依赖注入 | `createDefaultDeps` 传入底层依赖        |
| 观察者   | 事件驱动处理 Agent 事件、心跳、渠道状态 |
| 策略模式 | Auth Mode 策略、Channel Health 策略     |

---

## 守护进程 (Daemon) — `src/daemon/`

解决 OpenClaw 在不同操作系统上作为后台服务运行的一致性问题。

### 平台适配

| 平台    | 实现          | 服务管理器                 |
| ------- | ------------- | -------------------------- |
| macOS   | `launchd.ts`  | launchd Plist              |
| Linux   | `systemd.ts`  | systemd Unit + Linger      |
| Windows | `schtasks.ts` | 计划任务 (Scheduled Tasks) |

### 服务接口 (`service.ts`)

统一的 `GatewayService` 抽象：

- `install()` — 安装系统服务
- `uninstall()` — 卸载
- `stop()` — 停止
- `restart()` — 重启
- `isLoaded()` — 状态查询

用户通过简单的 `openclaw daemon install` 即可完成复杂的后台服务配置。
