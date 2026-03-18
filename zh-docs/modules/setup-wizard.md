# 模块分析：配置向导与交互逻辑 (Setup & Wizard)

## 配置向导 (Wizard) - `src/wizard/`

`wizard` 模块主要用于在命令行中为用户提供开箱即用、友好的首次运行和系统配置体验，与日常的高频操作无缝集成。

### 核心功能

-   **交互式表单提示 (`clack-prompter.ts`, `prompts.ts`)**:
    -   封装第三方命令行交互库（如 `@clack/prompts`），提供高度一致、美观且响应式的 CLI 表单交互界面。
    -   支持复杂的步骤状态机跳转（如：当用户勾选特定的大语言模型提供商后，能够动态追问特定格式的 API 接入密钥）。
-   **全局引导与初始化 (`setup.ts`, `setup.finalize.ts`)**:
    -   统筹整个 `openclaw onboard`（开箱引导）和 `openclaw setup` 流程。指引用户完成从网关网络端点暴露、渠道参数填充到代理初始能力挂载的全闭环。
    -   在此过程中结合 `setup.gateway-config.ts` 高效安全地读写本地环境变量和全局的 `openclaw.json` 配置文档。
-   **安全输入挂载 (`setup.secret-input.ts`)**:
    -   深度定制命令行接口的密码输入掩码显示逻辑，进行前后缀预截断安全过滤，防止在控制面板或系统日志中被录屏程序捕捉。

## 交互载体逻辑 (Interactive) - `src/interactive/`

处理诸如特定动作卡片的 Payload 序列化，配合交互式消息格式为不同渠道的消息模板构建提供支撑平台。
