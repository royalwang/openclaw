# 模块分析：Auto-Reply & Dispatch

## 自动回复引擎 — `src/auto-reply/` (67 文件)

自动回复是消息从渠道进入到 Agent 执行的核心调度层，实现了状态机驱动的消息分发。

```mermaid
stateDiagram-v2
    [*] --> Idle: 等待消息
    Idle --> InboundReceived: 收到消息
    InboundReceived --> CommandDetect: 指令检测
    CommandDetect --> CommandExec: 匹配到指令
    CommandDetect --> TriggerMatch: 非指令消息
    TriggerMatch --> Debounce: 触发器匹配成功
    Debounce --> AgentDispatch: 去抖完成
    AgentDispatch --> Processing: Agent 执行中
    Processing --> StreamReply: 流式回复
    StreamReply --> HeartbeatReply: 心跳回复
    HeartbeatReply --> Idle: 回复完成
    CommandExec --> Idle: 指令执行完毕
```

### 核心组件

| 文件                        | 大小 | 功能                                      |
| --------------------------- | ---- | ----------------------------------------- |
| `status.ts`                 | 28KB | 状态机总控，管理全局回复状态              |
| `reply.ts`                  | 入口 | 回复分发路由                              |
| `chunk.ts`                  | 14KB | 回复文本智能分块（按段落/代码块边界切分） |
| `command-auth.ts`           | 12KB | 指令权限校验                              |
| `commands-registry.ts`      | 15KB | 指令注册中心                              |
| `commands-registry.data.ts` | 23KB | 内置指令定义数据                          |
| `envelope.ts`               | 8KB  | 消息信封解析/构造                         |
| `dispatch.ts`               | 3KB  | 消息分发路由                              |
| `inbound-debounce.ts`       | 3KB  | 入站消息去抖                              |
| `templating.ts`             | 8KB  | 回复模板引擎                              |
| `thinking.ts`               | 3KB  | 推理展示控制                              |
| `skill-commands.ts`         | 6KB  | 技能指令处理                              |

### 指令系统

```mermaid
flowchart TD
    MSG["收到消息"] --> DETECT["command-detection.ts<br/>指令检测"]
    DETECT --> AUTH["command-auth.ts (12KB)<br/>权限校验：Owner/Admin/User"]
    AUTH --> REGISTRY["commands-registry.ts (15KB)<br/>查找指令处理器"]
    REGISTRY --> EXEC["执行指令"]

    subgraph "内置指令 (commands-registry.data.ts)"
        STOP["/stop — 终止当前任务"]
        MODEL["/model — 切换模型"]
        THINK["/think — 切换推理模式"]
        VERBOSE["/verbose — 日志级别"]
        RESET["/reset — 重置会话"]
        STATUS_CMD["/status — 查看状态"]
        HELP["/help — 帮助"]
    end
```

### 回复分发流

```mermaid
flowchart LR
    AGENT["Agent 输出"] --> CHUNK["chunk.ts (14KB)<br/>智能分块"]
    CHUNK --> TEMPLATE["templating.ts (8KB)<br/>模板渲染"]
    TEMPLATE --> STREAM["流式发送<br/>按段落/代码块边界"]
    STREAM --> TYPING["typing 状态管理"]
    STREAM --> REACTIONS["状态反应<br/>👀→✅/❌"]

    AGENT --> HEARTBEAT["heartbeat.ts (5KB)<br/>心跳回复"]
    HEARTBEAT --> SCHEDULE["定时检查<br/>长任务心跳反馈"]
```

### 消息去抖

`inbound-debounce.ts` 实现入站消息去抖，防止用户快速连发多条消息触发多次 Agent 执行。策略包括：

- 时间窗口合并
- 相同会话键去重
- 配置化去抖间隔

### 回复智能分块

`chunk.ts`（14KB）实现了基于语义边界的文本分块：

- 优先在段落分隔处切分
- 尊重 Markdown 代码块边界（不在代码块中间切断）
- 缩进级别保持
- 列表项不拆分
- 长单行代码块特殊处理
