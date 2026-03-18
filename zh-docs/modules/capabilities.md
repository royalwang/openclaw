# 模块分析：高级能力 (Capabilities)

## 代理客户端协议 (ACP) - `src/acp/`

ACP 模块实现了标准化 [Agent Client Protocol](https://github.com/agentclientprotocol/sdk)，允许外部客户端以统一的方式与 OpenClaw 交互。

### 核心设计

-   **协议转换 (`translator.ts`)**: 这是 ACP 的核心，负责将 ACP 的标准请求（初始化、开启会话、提示词发送）翻译为 OpenClaw 内部的 Gateway 调用。
-   **会话映射**: 管理外部 ACP 会话与内部 Gateway 会话之间的映射关系，支持会话持久化和重连。
-   **安全保障**: 内置了分级频率限制 (Rate Limiting) 和输入长度校验，防止恶意调用。

---

## 交互与界面 (Interactions & UI) - `src/interactive/`, `src/tui/`, `src/canvas-host/`

OpenClaw 提供了多种与非即时通讯软件（如 Terminal、Web 界面）交互的方式。

-   **终端 UI (TUI)**: `src/tui/` 包含了一个完整的命令行聊天界面，支持流式输出、OSC8 超链接以及丰富的交互指令。
-   **画布宿主 (Canvas Host)**: `src/canvas-host/` 提供了一个本地服务，用于渲染 Agent 生成的富文本 UI 或交互式“画布” (Canvas)，支持 A2UI (Agent-to-UI) 协议。
-   **交互模式**: `src/interactive/` 支持轻量级的单次交互载荷。

---

## 多模态感知 (AI Perception) - `src/media-understanding/`, `src/link-understanding/`

该模块赋予了 Agent “看”和“听”的能力。

### 理解流

-   **语音转文字 (Transcription)**: 集成了 Deepgram 等提供商，将用户的语音消息实时转换为文本。
-   **视觉与视频分析**: 能够处理用户上传的图片和视频帧，提取关键信息并将其转化为 prompt 的一部分供模型阅读。
-   **链接解析 (Link Understanding)**: `src/link-understanding/` 能够智能识别并抓取网页链接的内容，帮助 Agent 理解上下文中的外部资源。
