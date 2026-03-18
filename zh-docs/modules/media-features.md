# 模块分析：Media & Features

## 多媒体处理 (Media) - `src/media/`

Media 模块为 OpenClaw 提供了强大的多媒体文件处理能力，支持图像、音频和文档的深度操作。

### 核心功能

-   **图像处理 (`image-ops.ts`)**:
    -   **双后端支持**: 根据运行环境自动切换 `sharp` (高性能 Node.js 库) 或 `sips` (macOS 原生命令)。
    -   **自动化处理**: 支持自动缩放、格式转换（JPEG/PNG）、EXIF 方向校正以及针对大模型的图像压缩优化。
-   **音视频支持**: 通过 `ffmpeg-exec.ts` 调用 FFmpeg 进行音频转码和处理，常用于语音消息的处理。
-   **文档解析**: `pdf-extract.ts` 支持从 PDF 文件中提取文本内容，供 Agent 阅读。
-   **媒体存储 (`store.ts`)**: 统一管理会话中涉及的多媒体资源，确保文件在多个回合间的一致性。

---

## 图像生成 (Image Generation) - `src/image-generation/`

该模块允许 Agent 根据文字描述生成图像。

### 设计亮点

-   **多模型回退策略 (`runtime.ts`)**: 在生成图像时，可以配置多个候选模型。如果首选模型（如 DALL-E 3）调用失败，系统会自动尝试备选模型，确保生成的可靠性。
-   **提供商模型**: 通过插件系统支持多种图像生成服务。

---

## 浏览器自动化 (Browser) - `src/browser/`

这是 OpenClaw 最强大的功能之一，提供了一个完整的、可观测的自动化浏览器环境。

### 技术架构

-   **深度集成 (CDP)**: 通过 Chrome DevTools Protocol (`cdp.ts`) 实现对浏览器的底层控制，能够捕获精确的页面状态。
-   **自动化引擎**: 结合了 Playwright (`pw-session.ts`)，提供了稳定的点击、输入、导航等高级交互功能。
-   **可观测性**: 支持实时截图、页面快照（Snapshot）以及将复杂网页结构简化为 AI 可理解的提示词。
-   **MCP 集成**: 浏览器能力被封装为 MCP (Model Context Protocol) 工具，使 Agent 能够像使用普通工具一样操作浏览器。

---

## 网络搜索 (Web Search) - `src/web-search/`

一个轻量级的搜索模块，为 Agent 提供实时联网搜索能力，支持多种搜索接口。
