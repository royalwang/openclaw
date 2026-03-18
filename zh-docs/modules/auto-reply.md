# 模块分析：Auto-Reply & Dispatch

## 自动回复与分发 (Auto-Reply) - `src/auto-reply/`

`auto-reply` 是 OpenClaw 处理对话流入、状态机流转、指令解析及模型回复生成的核心枢纽模块。它负责连接渠道层（Channels）和代理逻辑层（Agents）。

### 核心功能

-   **状态与调度 (`status.ts`, `dispatch.ts`)**:
    -   维护对话的生命周期状态（例如：等待中、思考中、回复中）。
    -   管理消息队列，处理防抖（Debounce）和并发限制，确保消息按序严格处理。
-   **指令与触发器 (`reply.directive.*`, `reply.triggers.*`)**:
    -   提供细粒度的回复控制策略（Directives），如内联推理（Inline Reasoning）、模糊匹配（Fuzzy Selection）和冗长级别控制（Verbose Level）。
    -   通过触发器（Triggers）系统，智能处理不同类型的入站媒体（如将图片存入沙盒）、动态过滤系统提示词，以及向特定 Agent 路由请求。
-   **心跳与思考状态 (`heartbeat.ts`, `thinking.ts`)**:
    -   在 LLM 处理耗时任务时，向用户发送心跳包（如 "正在输入..." 或周期性状态更新）。
    -   暴露思考过程（Thinking），支持在界面上实时流式输出 Agent 的推理过程。
-   **模型与介质 (`model.ts`, `media-note.ts`)**:
    -   封装底层模型调用，处理模型的流式输出（Block Streaming）和格式化。
    -   对媒体附件（音频、图像、文件）进行标准化处理，以便模型理解。
-   **命令鉴权与注册 (`command-auth.ts`, `commands-registry.ts`)**:
    -   将自然语言或斜杠命令映射为具体的系统操作。
    -   提供细粒度的权限校验，确保只有授权用户或应用所有者可以执行特定命令。
