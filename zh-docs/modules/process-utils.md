# 模块分析：进程与基础工具 (Process & Utilities)

## 进程管理 (Process) - `src/process/`

负责系统底层命令执行、子进程安全控制与看门狗回收策略，是诸如插件外挂执行以及服务健康维持的基石。

### 核心组件

-   **跨平台执行控制 (`exec.ts`, `windows-command.ts`, `spawn-utils.ts`)**:
    -   对 Node.js 的原生 `child_process.spawn` / `exec` 进行企业级加固层封装，支持跨平台（Windows CMD/PowerShell 适配）一致的 API 返回形态及实时流捕获。
-   **排队与通信桥接 (`command-queue.ts`, `child-process-bridge.ts`)**:
    -   实现了主进程与 Daemon 进程或一次性短时作业进程之间可靠的数据管线（Pipes/IPC）通信机制。
    -   处理密集型外部命令防爆内存的问题，具备完善的操作队列积压管控。
-   **级联清理器 (`kill-tree.ts`)**:
    -   确保子进程及其所衍生的所有背景孙进程在发生超时被强杀时不遗漏，规避资源与端口被孤立进程死锁。
-   **进程看门狗 (`supervisor/`)**:
    -   负责启动代理进程的心跳健康检测、失败即时重试退避系统（Restart Recovery）。

## 基础工具集 (Utils) - `src/utils/` & 测试包

存放系统中高度可复用的底层通用逻辑集合以及单元验证辅助组件。

### 通用模块

-   **限流与并发锁 (`queue-helpers.ts`, `run-with-concurrency.ts`)**: 限制过热的重试回路并锁定数据库事务接口。
-   **敏感词脱敏 (`mask-api-key.ts`, `normalize-secret-input.ts`)**: 全局日志和远程告警输出之前的密钥自动加星掩码切除。
-   **结构化通讯数据解析 (`directive-tags.ts`, `transcript-tools.ts`)**: 高效辅助系统解析提取内联思维标签 `<think>` 以及文本边界块。
-   **测试夹具辅助 (`src/test-helpers/`, `src/test-utils/`)**: 建立隔离沙箱、桩模型（Stubs）、以及虚拟时间流控制套件，保证核心单元测试稳定执行不依赖外部真实接口及时间差。
