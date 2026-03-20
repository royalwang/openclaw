# 模块分析：定时任务与调度 (Cron & Background)

## 定时任务 — `src/cron/`

```mermaid
flowchart TD
    CONFIG["openclaw.json<br/>cron 配置"] --> PARSE["解析 cron 表达式"]
    PARSE --> SCHEDULER["调度引擎"]
    SCHEDULER --> QUEUE["防并发队列<br/>串行执行"]
    QUEUE --> AGENT["独立 Agent 执行"]
    AGENT --> PERSIST["持久化结果"]

    SCHEDULER --> RECOVER["任务恢复<br/>重启后续接"]
    SCHEDULER --> CLEANUP["会话清理<br/>过期任务回收"]
```

### 核心特性

- **防并发**：同一 cron 任务不会重叠执行，通过队列串行化
- **独立 Agent**：每个 cron 任务以独立 Agent 身份运行，有自己的会话和上下文
- **持久化恢复**：系统重启后自动恢复未完成的定时任务
- **会话清理**：过期的 cron 会话自动清理，防止存储膨胀

### Gateway 集成

`src/gateway/server-cron.ts`（17KB）将 cron 引擎集成到 Gateway：

- 启动时加载 cron 配置
- 配置热重载时更新调度
- 任务执行状态上报
- 失败重试策略
