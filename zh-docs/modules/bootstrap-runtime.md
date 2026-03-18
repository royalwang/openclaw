# 模块分析：启动引导与运行时核心 (Bootstrap & Runtime)

本文档深入解析 OpenClaw 从命令行被唤醒到进入核心系统事件循环期间所经历的底层初始化与运行时架构。

## 启动引导 (Bootstrap) - `src/entry.ts`

作为整个应用的绝对物理入口，`entry.ts` 肩负着处理 Node.js 底层环境准备、跨平台差异抹平以及进程安全衍生的重任。

### 核心机制

-   **防依赖复用执行**:
    -   利用 `isMainModule` 校验，拦截打包器（Bundler）作为依赖引入时意外触发的执行逻辑，防止网关端口冲突与数据库锁竞争。
-   **运行时环境归一化**:
    -   统一 Windows 与 POSIX 的 CLI 参数差异 (`normalizeWindowsArgv`)。
    -   配置 V8 编译缓存以加速冷启动 (`enableCompileCache`)。
    -   强制注入全局 Fetch 的代理兼容层支持 (`installGaxiosFetchCompat`)。
-   **重启隔离 (Respawn) 与子进程桥接**:
    -   由于 Node.js 的某些核心参数（如 `--disable-warning=ExperimentalWarning`）限制通过 `NODE_OPTIONS` 传递，系统识别出需要静默警告时，利用**自身派生（Respawn）**机制，附带该参数后重新启动本体。
    -   在此分离过程中，通过 `attachChildProcessBridge` 建立了主父进程与克隆子进程的信号通道（Signal Bridge），确保诸如 `SIGTERM` / `SIGINT` 等终止信号能立刻渗透透传到底层服务，避免发生僵尸进程泄漏。
-   **延迟加载与极速路径 (Fast Path)**:
    -   一旦命令解析察觉到简单的请求（如 `--version` 探针或根 `--help`），系统将绕过庞大的 CLI 甚至网关架构直接给出反馈，实现毫秒级提速。

## 全局上下文与运行时抽象 - `src/globals.ts`, `src/runtime.ts`

-   **全局状态控制 (Globals)**:
    -   安全地存储贯穿全系统周期的 `verbose` 以及交互式免越权（`yes`）标识位，并集中暴露出可适配终端的主题（`theme`）色彩对象。
-   **运行时解耦拦截 (Runtime Context)**:
    -   通过抽象 `RuntimeEnv` 接口全面拦截取代直接原生调用（重写包裹 `console.log`、`console.error`、`process.exit`）。
    -   此举不仅确保发生 Error 退出时终端能恢复游标（避免由于 TUI 或进度条留置导致的破坏），更便于在测试沙箱中安全验证退出码而无需使得主测试栈崩塌。

## IPC 与内部事件通讯抽象

除了顶层高度松耦合的 WebSocket 和基于 HTTP 的 RPC 网关协议之外，在低级别的底层调用中，应用重度依赖于 Node 内置 `EventEmitter` 和基于二进制的 IPC 来维系生命与通讯：
-   Agent 与内部嵌套子代理环境模型之间的无缝内存级状态反馈。
-   看门狗（Supervisor）监控及进程级状态回收。
