# 模块分析：扩展生态 (Extensions Ecosystem)

OpenClaw 的强大之处在于其极其丰富的扩展（Extensions）系统。这些扩展通常位于项目根目录的 `extensions/` 文件夹下。

## 扩展类型

### 1. 通讯渠道 (Channels)
负责与各种社交软件或通讯协议对接。
-   **示例**: `extensions/telegram`, `extensions/discord`, `extensions/slack`, `extensions/msteams`, `extensions/feishu` 等。
-   **功能**: 消息收发、媒体分块、按钮交互、Webhook 处理。

### 2. AI 模型提供商 (Providers)
将不同厂商的 LLM 或工具集成到 OpenClaw。
-   **示例**: `extensions/openai`, `extensions/anthropic`, `extensions/google`, `extensions/ollama` (本地模型), `extensions/mistral` 等。
-   **功能**: 统一的 Chat Completion 接口、Function Calling 适配、Token 计数。

### 3. 工具与技能 (Skills)
为 Agent 提供具体的功能。
-   **示例**: `extensions/browser` (浏览器操作), `extensions/brave` (搜索), `extensions/github` (代码库操作)。
-   **功能**: 定义工具 Schema 并执行具体逻辑。

### 4. 存储与增强 (Memory & Knowledge)
-   **示例**: `extensions/memory-lancedb` (使用 Vector DB 加强记忆)。

## 扩展包结构

每个扩展通常是一个独立的 npm 包 (Workspace Package)，包含自己的 `package.json`、`index.ts`（入口点）和 `src/` 目录。它们通过 `openclaw/plugin-sdk` 与核心层通信，确保了代码的解耦和安全性。
