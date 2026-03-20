# Cron 定时任务开发指南

> 如何定义定时任务、自定义投递目标、扩展调度策略。

## 1. 定义 Cron 任务

在 `openclaw.json` 中：
```json
{
  "cron": [
    {
      "id": "daily-summary",
      "schedule": "0 9 * * *",
      "message": "生成每日摘要报告",
      "agentId": "main",
      "delivery": {
        "channel": "telegram",
        "target": "chat_id_123"
      }
    }
  ]
}
```

## 2. 调度表达式

| 格式 | 示例 | 说明 |
|------|------|------|
| 标准 cron | `0 9 * * *` | 每天 9:00 |
| `@daily` | - | 每天午夜 |
| `@hourly` | - | 每小时整点 |
| `every 30m` | - | 每 30 分钟 |
| `at 14:30` | - | 每天 14:30 |

## 3. 投递开发

```typescript
// delivery.ts
export async function deliverCronResult(params) {
  // 1. 解析投递目标（渠道 + recipient）
  // 2. 格式化 Agent 响应文本
  // 3. 调用渠道 outbound.send()
  // 4. 记录执行日志
}
```

## 4. 测试

```bash
pnpm test -- src/cron/
# 50+ 测试文件覆盖调度、投递、回归修复
```
