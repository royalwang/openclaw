# 模块分析：Channels & Routing

## 消息路由 (Routing) - `src/routing/`

路由模块是 OpenClaw 消息处理的核心，负责将来自不同平台的输入准确分发给对应的 Agent。

### 路由解析机制 (`resolve-route.ts`)

-   **绑定系统 (Bindings)**: 用户可以通过配置文件自定义消息来源与 Agent 的绑定关系。支持多种维度的匹配：
    -   **直接匹配**: 特定用户 (Peer) 或群组 (Group/Channel)。
    -   **线程继承**: 子线程自动继承父级的绑定关系。
    -   **权限/角色匹配**: 基于 Guild (服务器) 或角色 (Roles) 进行分发（常见于 Discord）。
    -   **账号/频道匹配**: 为特定平台账号或整个频道设置默认 Agent。
-   **分级匹配引擎**: 路由解析器会按优先级（从细粒度到粗粒度）逐级查找匹配项，直到找到合适的 Agent 或回退到全局默认 Agent。
-   **会话键 (Session Keys)**: 为每一个独立的对话流生成稳定的唯一标识符，确保消息在不同回合间能够正确关联到同一个会话上下文。

---

## 频道框架 (Channels) - `src/channels/`

Channels 模块定义了插件化消息平台的通用接口。

### 核心设计

-   **插件化实现**: 具体的平台（如 Telegram, Discord, Slack）均作为 **Extensions** 实现。这保证了核心代码的简洁性，并方便社区扩展新平台。
-   **统一接口**: 无论是何种平台，在核心层都抽象为统一的 `ChannelPlugin` 接口，屏蔽了各平台 API（如 Telegram Bot API, Discord.js）的差异。
-   **状态反馈 (`status-reactions.ts`)**: 提供通用的 Agent 状态反馈机制。例如，当 Agent 正在思考时，会自动在原消息上添加 👀 反应；任务完成后添加 ✅。

---

## 平台扩展 (Channel Extensions) - `extensions/`

具体的平台实现（如 `@openclaw/telegram`）位于 `extensions/` 目录下。

### 典型结构 (以 Telegram 为例)

-   **入口 (`index.ts`)**: 使用 `defineChannelPluginEntry` 定义插件元数据和运行环境。
-   **Bot 逻辑 (`src/bot-handlers.ts`)**: 处理平台特定的消息解析、媒体下载、按钮交互等任务。
-   **适配器 (`src/outbound-adapter.ts`)**: 将 Agent 生成的通用响应（文字、图片、按钮）转换为 Telegram 特定的 API 调用。
