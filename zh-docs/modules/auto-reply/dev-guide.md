# 自动回复开发指南

> 如何添加新指令、扩展状态输出、自定义发送策略。

## 1. 添加新的 Chat 指令

```typescript
// commands-registry.ts
registerCommand({
  name: "your-cmd",
  aliases: ["yc"],
  category: "tools",
  description: "命令描述",
  usage: "/your-cmd <arg>",
  execute: async (args, ctx) => {
    // args: 用户输入参数
    // ctx: 包含 config, sessionEntry, agentId 等
    return { text: "执行结果", silent: false };
  },
});
```

## 2. 扩展状态消息

在 `status.ts` 的 `buildStatusMessage()` 中添加新行：
```typescript
lines.push(`🔧 YourFeature: ${resolveYourFeatureStatus(cfg, entry)}`);
```

## 3. 发送策略扩展

```typescript
// sessions/send-policy.ts
export function resolveSendPolicy(params): "allow" | "deny" {
  // 根据渠道类型、会话配置、安全策略决定是否发送
}
```

## 4. 测试

```bash
pnpm test -- src/auto-reply/
```
