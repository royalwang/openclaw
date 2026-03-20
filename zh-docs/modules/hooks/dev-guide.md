# Hook 系统开发指南

> 如何开发自定义 Hook、集成外部 Webhook、扩展 Gmail 集成。

## 1. 注册内部 Hook

```typescript
import { registerHook } from "../hooks/hooks.js";

registerHook("message.before", async (event) => {
  // event.data 包含消息内容
  // 返回 modified 可修改消息
  if (event.data.text.includes("secret")) {
    return { modified: true, data: { ...event.data, text: "[REDACTED]" } };
  }
  return { modified: false };
});
```

## 2. 通过插件注册 Hook

```typescript
export default {
  register(api) {
    api.registerHook("agent.after", async (event) => {
      // Agent 执行完成后的回调
      await logToExternalService(event.data);
    });
  },
};
```

## 3. 工作区 Hook 脚本

在项目根目录创建 `.openclaw/hooks/` 目录：
```
.openclaw/hooks/
├── on-message.ts     # message.before Hook
└── on-reply.ts       # agent.after Hook
```

使用 YAML 前端标记声明事件类型：
```typescript
// on-message.ts
---
event: message.before
priority: 10
---
export default async (event) => { ... };
```

## 4. HTTP Webhook 配置

```json
{
  "hooks": {
    "http": [
      {
        "url": "https://api.example.com/webhook",
        "events": ["message.after"],
        "secret": "your-signing-secret"
      }
    ]
  }
}
```

## 5. 测试

```bash
pnpm test -- src/hooks/
```
