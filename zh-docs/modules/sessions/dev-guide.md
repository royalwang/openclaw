# 会话管理开发指南

> 如何扩展会话能力、添加覆盖字段、自定义发送策略。

## 1. 添加会话覆盖字段

1. 在 `SessionEntry` 类型中添加新字段
2. 在 `clearSessionOverrides()` 中添加清理逻辑
3. 在 `buildStatusMessage()` 中显示

```typescript
// 示例: 添加 sandboxOverride
type SessionEntry = {
  // ...existing
  sandboxOverride?: "all" | "off" | "untrusted";
};
```

## 2. 自定义发送策略

```typescript
// send-policy.ts
function yourCustomPolicy(params): SendPolicyResult {
  if (params.sessionEntry?.blocked) {
    return { action: "deny", reason: "session blocked" };
  }
  return { action: "allow" };
}
```

## 3. 会话生命周期 Hook

```typescript
import { onSessionLifecycleEvent } from "../sessions/session-lifecycle-events.js";

onSessionLifecycleEvent("session.created", (event) => {
  console.log(`New session: ${event.sessionKey}`);
});
```

## 4. 测试

```bash
pnpm test -- src/sessions/
```
