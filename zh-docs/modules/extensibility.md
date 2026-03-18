# 模块分析：Extensibility (扩展性)

## 插件系统 (Plugins) - `src/plugins/`

OpenClaw 的高度可扩展性源于其精心设计的插件架构。几乎所有非核心功能（如特定的聊天平台、AI 模型提供商）都是通过插件实现的。

### 核心机制

-   **插件加载器 (`loader.ts`)**: 负责扫描、加载和初始化 `extensions/` 目录下的插件。它处理复杂的依赖注入，并确保插件在受限的运行时边界内执行。
-   **Hook 系统 (`hooks.ts`)**: 这是一套功能强大的生命周期钩子。插件可以监听并介入 Agent 的各个环节，例如：
    -   `before-agent-start`: 在 Agent 启动前修改配置。
    -   `after-tool-call`: 在工具调用完成后处理结果。
    -   `on-message`: 拦截或修改接收到的消息。
-   **市场与安装**: 支持从远程仓库搜索 (`marketplace.ts`) 并安装 (`install.ts`) 插件。
-   **向导式配置 (`provider-wizard.ts`)**: 为新 AI 提供商的接入提供交互式的引导流程。

---

## 插件 SDK (Plugin SDK) - `src/plugin-sdk/`

这是 OpenClaw 核心与外部扩展之间的通信契约。

-   **底层抽象**: 定义了所有插件类型（Channel, Provider, Skill, Hook）的基类和接口。
-   **运行时接口**: 提供了插件可以直接调用的核心能力，如日志记录、文件访问、秘密信息管理等，同时保证了安全隔离。

---

## 技能 (Skills) - `skills/`

Skills 是预定义的、可重用的 Agent 能力包或指令集。

-   **快速集成**: 通过简单的配置即可让 Agent 掌握特定的专业技能或遵循特定的工作流。
-   **跨平台**: Skill 与具体的频道和模型无关，具有极高的通用性。
