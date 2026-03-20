# Gateway 开发指南

> 如何扩展 Gateway 功能、添加中间件、自定义网络行为。

## 1. 项目结构

```
src/gateway/
├── server.impl.ts       # 启动入口（startGatewayServer）
├── server-reload.ts     # 配置热重载
├── call.ts              # RPC 客户端调用
├── net.ts               # 网络工具（绑定/安全/IP）
├── auth.ts              # 认证解析
├── probe.ts             # Gateway 健康探测
├── probe-auth.ts        # 探测认证
├── hooks-mapping.ts     # Hook 事件映射
├── ws-handlers.ts       # WebSocket RPC 处理器
└── config-reload.ts     # 配置重载协调
```

## 2. 添加新的 RPC 方法

### 步骤

1. 在 `ws-handlers.ts` 中注册新方法：
```typescript
// 注册 Gateway RPC 方法
gatewayMethods.set("your.method.name", async (params, ctx) => {
  // ctx 包含认证信息、配置等
  return { result: "..." };
});
```

2. 在客户端 `call.ts` 添加对应调用：
```typescript
export async function yourMethod(opts) {
  return callGateway({ method: "your.method.name", params: { ... }, ...opts });
}
```

### 认证要求
- 所有 RPC 调用必须携带 Token 或 Password
- 使用 `resolveGatewayCredentials()` 获取凭据
- URL 覆盖模式下必须显式指定凭据

## 3. 自定义绑定模式

在 `net.ts` 的 `resolveGatewayBindHost()` 中添加：

```typescript
case "your-mode":
  const host = await resolveYourCustomHost();
  return { host, source: "your-mode" };
```

## 4. 配置热重载扩展

在 `config-reload.ts` 的重载回调中添加新模块的刷新逻辑：

```typescript
onConfigReloaded(async (newConfig) => {
  // 刷新你的子系统
  await yourSubsystem.reload(newConfig);
});
```

## 5. 安全注意事项

- **CWE-319**：非回环连接必须使用 `wss://`
- **凭据激活锁**：使用 `runWithSecretsActivationLock()` 确保串行
- **客户端 IP**：通过 `resolveClientIp()` 获取，信任代理使用 CIDR 匹配
- **媒体清理**：TTL 最大 168 小时，由 `resolveMediaCleanupTtlMs()` 控制

## 6. 测试

```bash
# 运行 Gateway 相关测试
pnpm test -- src/gateway/
```
