# 密钥管理开发指南

> 如何添加新的 Secret 类型、扩展 Auth Profile、开发运行时收集器。

## 1. 添加新的 Secret 源

```typescript
// resolve.ts
case "$your-source":
  return resolveYourSecretSource(input.$yourSource, context);
```

## 2. 添加运行时收集器

```typescript
// runtime-config-collectors-core.ts
export function collectYourSecrets(cfg: OpenClawConfig): SecretCollectorResult[] {
  return [{
    path: "yourFeature.apiKey",
    label: "Your Feature API Key",
    required: cfg.yourFeature?.enabled === true,
    value: cfg.yourFeature?.apiKey,
  }];
}
```

## 3. 开发 Auth Profile

在 `configure.ts` 添加交互式配置：
```typescript
const plan = buildConfigurePlan(cfg, {
  includeYourFeature: true,
  // 向导会自动检测缺失的凭据
});
```

## 4. 测试

```bash
pnpm test -- src/secrets/
```
