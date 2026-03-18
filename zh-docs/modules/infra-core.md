# 模块分析：Infrastructure & Core

## 基础设施 (Infrastructure) - `src/infra/`

Infra 模块是 OpenClaw 的基石，提供了支撑整个系统运行的底层服务和安全保障。

### 核心子系统

-   **安全边界 (`exec-safety.ts`, `boundary-path.ts`)**: 设置了严格的执行安全策略。包括可执行文件白名单、路径访问限制（防止 Agent 读写工作区以外的敏感文件）以及各种沙箱保护。
-   **心跳任务 (`heartbeat-runner.ts`)**: 一个后台调度系统，负责处理定时提醒、会话清理、状态同步等维护任务。
-   **备份与同步**: 提供完整的会话和配置备份 (`backup-create.ts`) 与归档 (`archive.ts`) 功能。
-   **网络发现 (`bonjour.ts`)**: 支持通过 Bonjour 协议在局域网内自动发现 OpenClaw 网关。
-   **自动更新 (`update-runner.ts`)**: 实现了 CLI 的版本检查和在线更新逻辑。

---

## 配置文件管理 (Config) - `src/config/`

OpenClaw 的配置系统极其严谨，确保了高度的可自定义性和稳定性。

### 关键技术

-   **Zod 强类型校验 (`zod-schema.ts`)**: 使用 Zod 定义了极其详尽的配置 Schema。所有的 `openclaw.json` 配置在加载时都会经过严格的类型检查和验证。
-   **平滑迁移 (`legacy-migrate.ts`)**: 由于项目迭代快，配置项经常变动。系统内置了复杂的迁移逻辑，能够自动将旧版本的配置文件升级到最新格式，保证了向后兼容性。
-   **安全读写 (`io.ts`)**: 负责配置文件的原子性读写，防止因异常导致配置损坏。

---

## 通用工具 (Utils) - `src/utils/`

存放各类非业务相关的工具函数，如消息队列辅助类、JSON 安全解析、超时控制等，供全工程调用。
