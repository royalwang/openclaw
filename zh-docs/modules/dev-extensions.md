# 二次开发与扩展点指北 (Secondary Development)

OpenClaw 提供了强大的内部防腐层与隔离沙箱架构，几乎所有的核心能力（包含所有内置的通讯渠道与模型提供商）都是通过标准化的 SDK 注入的。本文档为希望进行二次开发的工程师提供基础架构扩展指南。

## 1. 核心扩展生态位

OpenClaw 主要通过提供 `src/plugin-sdk/core.ts` 导出的高阶类型约束来编写以下几类外挂模块：

-   **模型提供商 (Provider Plugins)**: 对应实现 `ProviderPlugin` 接口。
-   **通讯渠道代理 (Channel Plugins)**: 对应实现 `ChannelPlugin` 接口。
-   **代理挂载技能 (Agent Skills)**: 对应实现 `AgentSkill` / 工具工厂机制。
-   **多模态或领域组件**: 如视觉理解扩展 (`MediaUnderstandingProviderPlugin`) 与语音生成抽象 (`SpeechProviderPlugin`)。
-   **系统钩子 (Lifecycle Hooks)**: 全局系统生命周期监听拦截网。

## 2. 深入探究：Provider Plugin

在 `src/plugins/types.ts` 定义的 `ProviderPlugin` 是 OpenClaw 极其庞大且能力强大的扩展接口。一个完备的 Provider 可以渗透影响系统的方方面面：

-   **交互向导设计 (`auth` 与 `wizard`)**:
    -   可定义极度友好的终端命令行提示（Prompter），支持 OAuth2 鉴权授权跳转，或是传统的受掩码保护的 API Key 录入（`ProviderAuthKind`）。
-   **模型目录管理 (`catalog` / `augmentModelCatalog`)**:
    -   能够拦截 `models list` 指令，动态地从云端 API 获取该账户当前可享用的最新模型权限树，并自动合并注册到系统内。
-   **运行时挂载与劫持 (`prepareExtraParams`, `wrapStreamFn`)**:
    -   当模型生成实际调用即将发生前，通过拦截并改写传向底层的配置项，解决各家大模型关于 API 的魔改（如混杂在 Headers 内的强制前缀标识、特殊参数格式）、增加特定鉴权，甚至接管处理 Token 消耗统计抛出。
-   **特定高级策略支持 (`isBinaryThinking`, `isCacheTtlEligible`)**:
    -   无需修改系统底座，仅通过暴露钩子接口向下层宣布该特定的模型提供商是否支持 Prompt Cache 技术，或是开启高级推理行为开关 (Reasoning Toggle)。

## 3. 深入探究：Agent Skill (代理工具/动作)

当赋予代理额外的本地执行资源与远程跨域访问能力，便形成了代理工具。

-   **沙盘工具工厂 (`OpenClawPluginToolFactory`)**: 
    -   由插件导出一个工厂闭包。执行时接收并解析系统提供的包含了工作上下文配置、发信人权限校验令牌（如区分超级管理员与普通用户），以及当前沙箱隔离状态的数据模型 `OpenClawPluginToolContext`。
    -   该工厂向上层透明返回一个兼容 OpenAI 乃至广泛流派的 JSON Schema 抽象动作指令集（`AnyAgentTool`）。
-   通过底座架构内置的并发队列控制拦截器，严防多工具循环调用发生死锁。

## 4. 全局拦截 Hook 体系

伴随 `src/hooks/` 和通道抽象共同构建的网络。

-   **上下文数据篡改栈**: 允许在进图 LLM 会话上下文之前，以中间件的形式横插一刀，修改 System Prompt 甚至是利用额外的 RAG 策略去召回外部数据源充实用户消息的前置关联文本。
-   **事件总线挂载**: 实现对网络链接断开、渠道鉴权丢失等特殊生命周期事件的捕获响应。

## 5. 开发实践

建议将所有的独立领域功能包存放在系统的 `extensions/` 目录下（配合工程现有的 Mono-repo 进行包管理）：
  
1.  在根内创建 `extensions/your-plugin` 包路径，并在其 `package.json` 内配置特定于所需要的依赖。
2.  严格通过 `@openclaw/plugin-sdk/core` 中引入诸如 `definePluginEntry` 或 `defineChannelPluginEntry` 的安全出口装箱功能闭包，确保版本升级强类型安全。
3.  通过 `openclaw.json` (或系统指定运行时注入配置) 在 `plugins` 下拉起对应工作区注册即可。
