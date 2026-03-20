# OpenClaw 模块开发文档索引

> 每个模块目录包含 `README.md`（架构分析）和 `dev-guide.md`（开发指南）。

## 核心引擎

| 模块 | 说明 | 源码 |
|------|------|------|
| [gateway/](gateway/) | Gateway 服务器、启动流程、RPC、网络安全 | `src/gateway/` |
| [agents/](agents/) | Agent 执行引擎、模型选择、Fallback、ACP | `src/agents/` |
| [config/](config/) | 配置 IO、Schema 验证、环境变量、审计 | `src/config/` |
| [memory/](memory/) | 记忆检索、嵌入向量、SQLite 存储、同步 | `src/memory/` |
| [sessions/](sessions/) | 会话管理、ID 解析、生命周期事件 | `src/sessions/` |
| [secrets/](secrets/) | 密钥管理、Auth Profile、凭据矩阵 | `src/secrets/` |

## 消息处理

| 模块 | 说明 | 源码 |
|------|------|------|
| [channels/](channels/) | 渠道路由、Session Key、适配器体系 | `src/channels/` `src/routing/` |
| [auto-reply/](auto-reply/) | 自动回复、状态构建、指令系统 | `src/auto-reply/` |
| [cron/](cron/) | 定时任务、调度引擎、隔离 Agent | `src/cron/` |
| [hooks/](hooks/) | Hook/Webhook、Gmail 集成、事件触发 | `src/hooks/` |

## 扩展能力

| 模块 | 说明 | 源码 |
|------|------|------|
| [plugins/](plugins/) | 插件加载、Jiti、Registry、溯源安全 | `src/plugins/` |
| [browser/](browser/) | 浏览器控制、CDP 协议、Profile 管理 | `src/browser/` |
| [tts/](tts/) | 语音合成、3 Provider、Telephony | `src/tts/` |
| [acp/](acp/) | Agent Client Protocol、控制平面 | `src/acp/` |
| [media/](media/) | 媒体处理、图片/音频/文档理解 | `src/media/` |

## 基础设施

| 模块 | 说明 | 源码 |
|------|------|------|
| [infra/](infra/) | 执行安全、网络、临时文件、进程管理 | `src/infra/` |
| [security/](security/) | 安全审计、35 检查项、DM 策略 | `src/security/` |
| [cli/](cli/) | CLI 命令、Progress UI、Onboarding | `src/cli/` `src/commands/` |
