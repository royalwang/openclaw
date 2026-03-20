# ACP 开发指南

> 如何集成外部 Agent、管理持久绑定、扩展控制平面。

## 1. 注册 ACP Provider

```typescript
// 通过插件注册
export default {
  register(api) {
    api.registerAcpProvider({
      id: "your-agent",
      name: "Your External Agent",
      
      connect: async (config) => {
        // 建立与外部 Agent 的连接
        return new YourAgentConnection(config);
      },
      
      runTurn: async ({ text, mode, onEvent }) => {
        // 执行一轮对话
        const response = await connection.send(text);
        onEvent({ type: "text_delta", text: response.delta });
        return { text: response.fullText };
      },
    });
  },
};
```

## 2. 持久绑定管理

```typescript
// 创建持久绑定
const binding = await createPersistentBinding({
  sessionKey: "agent:main:direct:user123",
  acpProvider: "your-agent",
  config: { ... },
});

// 解析绑定
const resolved = await resolvePersistentBinding(sessionKey);
if (resolved) {
  // 使用已有绑定
}
```

## 3. 控制平面扩展

```typescript
// 添加运行时控制
manager.registerControl("your-control", async (params) => {
  // 自定义运行时操作
  return { result: "ok" };
});
```

## 4. Silent Reply 过滤

ACP Agent 回复以 `SILENT_REPLY_TOKEN` 开头的内容会被自动抑制，不发送给用户。

## 5. 测试

```bash
pnpm test -- src/acp/
```
