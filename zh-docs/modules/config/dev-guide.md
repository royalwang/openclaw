# 配置系统开发指南

> 如何扩展配置 Schema、添加新配置段、实现配置迁移。

## 1. 项目结构

```
src/config/
├── config.ts           # 主 ConfigType 导出
├── io.ts               # 配置读写核心（1560L）
├── zod-schema.ts       # Zod Schema 定义
├── paths.ts            # 配置文件/状态目录路径解析
├── port-defaults.ts    # 端口默认值派生
├── types.secrets.ts    # Secret 引用类型
├── types.tts.ts        # TTS 配置类型
├── env-substitution.ts # ${VAR} 环境变量替换
├── includes.ts         # $include 文件包含
├── migration.ts        # 配置迁移
└── overrides.ts        # 运行时覆盖
```

## 2. 添加新配置段

### 步骤 1：定义 Zod Schema

```typescript
// zod-schema.ts
const YourFeatureSchema = z.object({
  enabled: z.boolean().default(false),
  timeout: z.number().optional(),
  // ...
});

// 添加到主 Schema
const OpenClawConfigSchema = z.object({
  // ...现有字段...
  yourFeature: YourFeatureSchema.optional(),
});
```

### 步骤 2：更新 TypeScript 类型

```typescript
// config.ts
export type YourFeatureConfig = z.infer<typeof YourFeatureSchema>;
```

### 步骤 3：添加默认值应用

```typescript
// io.ts — applyDefaults() 中
if (!cfg.yourFeature) {
  cfg.yourFeature = { enabled: false };
}
```

## 3. 配置迁移

当 Schema 结构变更时，在 `migration.ts` 添加迁移逻辑：

```typescript
export function migrateConfig(cfg: unknown, fromVersion: string) {
  // 旧路径 → 新路径
  if (cfg.oldPath) {
    cfg.newPath = cfg.oldPath;
    delete cfg.oldPath;
  }
}
```

## 4. 支持 Secret 引用

如果新配置段包含敏感值，使用 `SecretInput` 类型：

```typescript
// 配置文件中：
{ "apiKey": { "$secret": "MY_ENV_VAR" } }

// 类型定义：
apiKey: SecretInputSchema.optional(),

// 运行时解析：
const resolved = normalizeResolvedSecretInputString({
  value: cfg.yourFeature?.apiKey,
  path: "yourFeature.apiKey",
});
```

## 5. 环境变量支持

- `${VAR}` 语法自动被 `resolveConfigEnvVars()` 替换
- 写回时通过 `restoreEnvRefsFromMap()` 恢复原始引用
- 缺失的变量不会崩溃，只生成警告

## 6. 写入审计

每次写入自动记录到 `~/.openclaw/logs/config-audit.jsonl`：
- SHA-256 前后哈希
- 可疑行为检测（size-drop > 50%、gateway-mode-removed）
- PID/PPID 追踪

## 7. 测试

```bash
pnpm test -- src/config/
```
