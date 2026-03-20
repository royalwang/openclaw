# 浏览器控制开发指南

> 如何扩展浏览器能力、添加自动化操作、开发 Profile。

## 1. 添加新的浏览器操作

```typescript
// client-actions-core.ts
export async function yourAction(page: Page, params: YourParams) {
  // 使用 CDP 协议执行自定义操作
  await page.evaluate(() => {
    // 注入 JavaScript
  });
}
```

## 2. 添加新的 Profile 类型

```typescript
// profiles-service.ts
export function resolveCustomProfile(cfg): ResolvedBrowserProfile {
  return {
    name: "custom",
    cdpPort: 9223,
    driver: "openclaw",  // 或 "existing-session"
    // ...
  };
}
```

## 3. SSRF 策略配置

```json
{
  "browser": {
    "ssrfPolicy": {
      "allowPrivateNetwork": false,
      "allowedHostnames": ["api.example.com"]
    }
  }
}
```

## 4. CDP 超时调优

```json
{
  "browser": {
    "remoteCdpTimeoutMs": 3000,
    "remoteCdpHandshakeTimeoutMs": 6000
  }
}
```

## 5. 测试

```bash
pnpm test -- src/browser/
```
