# OpenClaw 架构设计文档

本文档从整体设计角度阐述 OpenClaw 的核心架构、组件交互和关键技术选型。

## 设计目标

| 目标           | 实现手段                                                  |
| -------------- | --------------------------------------------------------- |
| **高可用**     | Gateway/Daemon 后台持久运行，心跳监控，看门狗自动恢复     |
| **极度可扩展** | 一切皆插件：Channel / Provider / Skill / Hook 四大扩展轴  |
| **安全**       | 执行审批系统、沙箱隔离、配置安全审计、DM 策略守卫         |
| **高性能**     | CLI 命令延迟加载、V8 编译缓存、混合搜索记忆、并发控制     |
| **跨平台**     | macOS launchd / Linux systemd / Windows schtasks 三端统一 |

---

## 系统分层架构

```mermaid
graph TB
  subgraph "外部接入层 Transport"
    TG["Telegram"]
    DC["Discord"]
    SL["Slack"]
    WA["WhatsApp"]
    SIG["Signal"]
    WEB["Web Provider"]
    EXT["Extension Channels<br/>MSTeams / Matrix / Zalo / IRC"]
  end

  subgraph "CLI 与交互层"
    CLI["CLI Program<br/>src/cli/"]
    TUI["TUI 终端界面<br/>src/tui/"]
    CANVAS["Canvas Host<br/>src/canvas-host/"]
    ACP["ACP 协议层<br/>src/acp/"]
  end

  subgraph "网关控制层 Gateway"
    GW["Gateway Server<br/>server.impl.ts (41KB)"]
    RPC["RPC Method Registry"]
    HTTP["OpenAI 兼容 HTTP<br/>openai-http.ts"]
    ORES["Open Responses HTTP<br/>openresponses-http.ts"]
    WS["WebSocket Log/Stream"]
    CUI["Control UI<br/>Web 管理面板"]
  end

  subgraph "代理执行核心 Agent Core"
    AGT["Agent Command<br/>agent-command.ts (43KB)"]
    PIR["Pi Embedded Runner<br/>认知循环引擎"]
    SUB["Subagent Registry<br/>subagent-registry.ts (44KB)"]
    TOOLS["Tool Policy Pipeline"]
    SP["System Prompt<br/>system-prompt.ts (32KB)"]
  end

  subgraph "智能与记忆层"
    CTX["Context Engine<br/>src/context-engine/"]
    MEM["Memory Index Manager<br/>src/memory/ (102 files)"]
    EMB["Embedding Engines<br/>OpenAI/Gemini/Voyage/Ollama"]
    QMD["QMD Query Manager<br/>qmd-manager.ts (69KB)"]
  end

  subgraph "基础设施层 Infrastructure"
    CFG["Config System<br/>src/config/ (215 files)"]
    SEC["Security & Audit<br/>src/security/ (35 files)"]
    INFRA["Infra Core<br/>src/infra/ (393 files)"]
    PLG["Plugin System<br/>src/plugins/ (138 files)"]
    HOOK["Hook System<br/>src/hooks/"]
    CRON["Cron Scheduler<br/>src/cron/"]
  end

  TG & DC & SL & WA & SIG & WEB & EXT --> GW
  CLI & TUI & CANVAS & ACP --> GW
  GW --> AGT
  GW --> RPC & HTTP & ORES & WS & CUI
  AGT --> PIR & SUB & TOOLS & SP
  PIR --> CTX & MEM
  CTX --> MEM
  MEM --> EMB & QMD
  GW --> CFG & PLG & HOOK & CRON
  AGT --> SEC & INFRA
```

---

## 消息处理全生命周期

```mermaid
sequenceDiagram
    participant User as 用户
    participant CH as Channel Plugin
    participant RT as Routing Engine
    participant GW as Gateway Server
    participant AR as Auto-Reply Engine
    participant AGT as Agent Command
    participant PIR as Pi Runner
    participant CTX as Context Engine
    participant LLM as LLM Provider
    participant TOOL as Tool Executor

    User->>CH: 发送消息（文本/图片/语音）
    CH->>CH: 下载媒体、构造 InboundEnvelope
    CH->>GW: 提交 Envelope
    GW->>RT: 路由解析（session-key 生成）
    RT->>GW: 返回目标 Agent + Session
    GW->>AR: 进入 Auto-Reply 状态机
    AR->>AR: 指令检测 → 触发器匹配 → Debounce
    AR->>AGT: 分发执行任务
    AGT->>AGT: 准备工作区、选择模型、Auth Profile 轮换
    AGT->>CTX: 请求上下文注入
    CTX->>CTX: 时间/用户/Memory RAG 检索
    CTX->>AGT: 返回丰富的上下文
    AGT->>PIR: 启动认知循环
    PIR->>LLM: 流式调用 LLM（含 System Prompt + History + Context）
    LLM-->>PIR: 流式响应（文本 + 工具调用）

    opt 工具调用
        PIR->>TOOL: 执行工具（bash/file/browser/image...）
        TOOL-->>PIR: 返回结果
        PIR->>LLM: 携带结果继续推理
    end

    PIR-->>AR: 流式回复文本
    AR->>CH: 分块发送回复 + 状态反应（👀→✅）
    CH->>User: 展示响应
```

---

## 插件生态模型

```mermaid
graph LR
  subgraph "Plugin Types"
    CP["Channel Plugin<br/>负责 听 和 说"]
    PP["Provider Plugin<br/>负责 思考"]
    SK["Skill Plugin<br/>负责 做"]
    HP["Hook Plugin<br/>负责 切入"]
  end

  subgraph "Plugin Lifecycle"
    DISC["Discovery<br/>扫描 extensions/"]
    LOAD["Loader<br/>loader.ts 45KB"]
    VALID["Validation<br/>schema-validator.ts"]
    REG["Registration<br/>registry.ts 31KB"]
    BIND["Binding<br/>conversation-binding.ts"]
  end

  subgraph "Plugin SDK"
    SDK["plugin-sdk/core.ts<br/>类型契约"]
    TYPES["types.ts 61KB<br/>完整接口定义"]
  end

  DISC --> LOAD --> VALID --> REG --> BIND
  SDK --> CP & PP & SK & HP
```

---

## 技术栈

| 类别     | 选型                 | 说明                              |
| -------- | -------------------- | --------------------------------- |
| 语言     | TypeScript (ESM)     | 严格类型，Node 22+ & Bun 双运行时 |
| 配置校验 | Zod                  | Schema 即文档，162KB 配置 Schema  |
| 图像处理 | Sharp + macOS Sips   | 平衡性能与平台兼容                |
| 音频处理 | FFmpeg               | 转码、格式转换                    |
| 向量存储 | SQLite + sqlite-vec  | 本地高性能向量搜索                |
| 全文搜索 | SQLite FTS5          | 关键词匹配                        |
| 打包     | tsdown               | 生产构建                          |
| 测试     | Vitest + V8 Coverage | 70% 覆盖率门槛                    |
| Lint     | Oxlint + Oxfmt       | 高性能格式化/检查                 |
| 包管理   | pnpm (Bun 兼容)      | Monorepo workspace                |

---

## 关键目录结构

```
src/
├── entry.ts              # 物理入口（Respawn、Fast Path）
├── index.ts              # Library 导出
├── cli/                  # CLI 命令层（176 文件）
├── commands/             # 业务命令实现（295 文件）
├── gateway/              # 网关服务器（250 文件）
├── agents/               # Agent 核心（579 文件）⭐ 最大模块
├── auto-reply/           # 自动回复状态机（67 文件）
├── channels/             # 渠道抽象（67 文件）
├── routing/              # 路由引擎（11 文件）
├── config/               # 配置系统（215 文件）
├── plugins/              # 插件系统（141 文件）
├── hooks/                # 生命周期钩子（38 文件）
├── memory/               # 记忆引擎（103 文件）
├── context-engine/       # 上下文注入（7 文件）
├── infra/                # 基础设施（397 文件）
├── security/             # 安全审计（35 文件）
├── sessions/             # 会话管理（13 文件）
├── media/                # 媒体处理（41 文件）
├── cron/                 # 定时任务
├── daemon/               # 守护进程
├── tui/                  # 终端 UI
├── acp/                  # Agent Client Protocol
├── browser/              # 浏览器自动化
├── tts/                  # 语音合成
└── ...                   # 更多子模块
```
