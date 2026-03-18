# OpenClaw 架构设计文档

本文档旨在从整体设计角度，阐述 OpenClaw 的核心架构哲学、组件交互流程以及关键的技术实现选择。

## 设计目标

1.  **高可用性**: 通过 Gateway/Daemon 模式支持持久化的后台运行。
2.  **极度可扩展**: 所有的通讯平台、AI 提供商、技能和生命周期事件均可通过插件扩展。
3.  **安全性**: 严格的本地执行安全边界和敏感信息管理。
4.  **性能**: 命令延迟加载、高效的混合搜索记忆方案以及并发控制。

---

## 核心架构视图

OpenClaw 采用分层且模块化的架构。

### 1. 外部接入层 (Transport & Delivery)
-   **输入处理**: 各种 Channel 插件（Telegram, Discord 等）负责接收原始消息并转换为通用的 `InboundEnvelope`。
-   **路由解析**: `Routing` 模块根据 `openclaw.json` 中的绑定关系，将消息分发给目标 Agent。

### 2. 网关控制层 (Control & Gateway)
-   **核心中枢**: Gateway 服务器负责协调各模块，提供统一的 RPC 接口。
-   **会话管理**: 维护跨平台的会话状态和稳定的会话键。
-   **配置中心**: 负责配置文件的验证、合并与实时热加载。

### 3. Agent 执行核心 (Agentic Logic)
-   **思维循环**: `Agents` 模块驱动 LMM (Large Multimodal Models) 进行思考与决策。
-   **上下文管理**: `Context Engine` 通过 RAG (检索增强生成) 将记忆、文件内容和实时状态注入 Prompt。
-   **工具执行**: Agent 可以安全地调用本地工具（Shell, Browser, Media Ops）。

### 4. 基础设施与保障层 (Core Infrastructure)
-   **存储引擎**: 使用混合存储（SQLite for FTS, LanceDB for Vector）实现高效记忆索引。
-   **安全沙箱**: 执行安全策略确保代码运行受到严格限制。
-   **自动化运维**: 心跳任务系统、自动备份、自动更新。

---

## 关键数据流

### 典型消息处理流程
1.  **接收**: 用户在 Telegram 发送消息。
2.  **解析**: Telegram 插件获取消息，下载图片/音频，并构造 `InboundEnvelope`。
3.  **路由**: `Routing` 模块锁定该会话绑定的 `agent-01`。
4.  **召回**: `Context Engine` 从记忆库中搜索相关的历史对话。
5.  **构建**: 构造完整的 Prompt（系统设定 + 背景知识 + 当前消息 + 媒体 metadata）。
6.  **推理**: 调用 LLM 获得回复指令。
7.  **执行**: Agent 根据指令调用具体工具（如 `generate_image`）。
8.  **反馈**: 后台自动在 Telegram 消息上添加 👀 反应，任务完成后回复文字或图片。

---

## 技术栈选择

-   **语言**: TypeScript (ESM)，追求严谨的类型和现代标准。
-   **运行时**: 优先支持 Node.js (22+) 和 Bun，利用 Bun 进行脚本加速。
-   **校验**: Zod，作为配置和数据交换的唯一真相来源。
-   **图像**: Sharp + macOS Sips，平衡性能与兼容性。
-   **内存数据库**: 集成高性能检索方案。

---

## 插件模型

OpenClaw 认为一切皆插件。
-   **Channel Plugins**: 负责“听”和“说”。
-   **Provider Plugins**: 负责“思考”（LLM 各大厂商）。
-   **Skill Plugins**: 负责“做”（特定领域的工具包）。
-   **Hook Plugins**: 负责“切入”（生命周期点）。

这种模型使得 OpenClaw 的核心非常精简，而生态非常丰富。
