# 模块分析：Gateway & Daemon

## 网关 (Gateway) - `src/gateway/`

网关是 OpenClaw 的核心中枢，负责协调整个系统的运行。它不仅是一个服务器，还是各个模块（如 Agent、渠道、插件）之间互动的桥梁。

### 核心功能

-   **服务器实现 (`server.impl.ts`)**:
    -   **多协议支持**: 同时支持 WebSocket (用于实时双向通讯) 和 HTTP (用于 OpenAI 兼容接口和其他 REST API)。
    -   **统一 RPC 逻辑**: 将核心方法、各渠道特有方法及插件方法统一注册为 RPC 接口，供客户端调用。
    -   **生命周期管理**: 负责网关的启动引导、配置热重载、平滑关闭以及重启策略。
    -   **安全与授权**: 集成了基于 Token 的认证机制、速率限制（Rate Limiting）以及跨域检查（CORS/Origins）。
    -   **状态监控**: 包含渠道健康检查、系统心跳跳动及维护任务（如多媒体文件定时清理）。
-   **启动引导 (`boot.ts`)**:
    -   引入了 `BOOT.md` 机制。在系统启动时，可以自动运行一个 Agent 任务，验证环境是否准备就绪（如发送一条测试消息）。

### 设计模式

-   **外观模式 (Facade)**: `GatewayServer` 为复杂的后端逻辑提供了一个统一的接口。
-   **依赖注入**: 通过 `createDefaultDeps` 传入底层依赖。
-   **观察者模式**: 通过事件驱动机制处理 Agent 事件、心跳事件等。

---

## 守护进程 (Daemon) - `src/daemon/`

守护进程模块解决了 OpenClaw 在不同操作系统上作为后台服务运行的一致性问题。

### 核心功能

-   **服务抽象 (`service.ts`)**:
    -   定义了 `GatewayService` 接口，屏蔽了平台差异。
    -   支持的操作包括：安装 (`install`)、卸载 (`uninstall`)、停止 (`stop`)、重启 (`restart`) 和 状态查询 (`isLoaded`)。
-   **多平台支持**:
    -   **macOS**: 使用 `launchd` (`launchd.ts`)。
    -   **Linux**: 使用 `systemd` (`systemd.ts`)。
    -   **Windows**: 使用 `schtasks` (计划任务) (`schtasks.ts`)。

### 架构优势

-   **易用性**: 用户可以通过简单的 CLI 命令（如 `openclaw daemon install`）完成复杂的后台服务配置。
-   **健壮性**: 针对各平台的特性（如 systemd 的 Linger 模式，macOS 的 Plist 配置）进行了深度适配。
