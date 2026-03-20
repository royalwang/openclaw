# 记忆与上下文引擎开发指南

> 如何添加嵌入 Provider、自定义检索策略、扩展记忆源。

## 1. 项目结构

```
src/memory/
├── manager.ts           # MemoryIndexManager 核心（859L）
├── search.ts            # 检索接口
├── embedding-ops.ts     # 嵌入操作基类
├── sync.ts              # 数据同步
├── schema.ts            # SQLite Schema
├── providers/           # 嵌入 Provider 实现
│   ├── openai.ts
│   ├── gemini.ts
│   ├── voyage.ts
│   ├── mistral.ts
│   ├── ollama.ts
│   └── local.ts
└── hybrid-merge.ts      # 混合结果合并

src/context-engine/
├── registry.ts          # ContextInjectorRegistry
├── injectors/           # 上下文注入器
└── types.ts             # 接口定义
```

## 2. 添加新的嵌入 Provider

### 步骤 1：实现 EmbeddingProvider 接口

```typescript
// providers/your-provider.ts
export class YourEmbeddingClient implements EmbeddingProvider {
  async embed(texts: string[]): Promise<number[][]> {
    // 调用 API 获取嵌入向量
    const response = await fetch(this.baseUrl, {
      body: JSON.stringify({ input: texts }),
    });
    return response.embeddings;
  }

  get dimensions(): number {
    return 1536; // 向量维度
  }
}
```

### 步骤 2：注册到 Provider 工厂

```typescript
// manager.ts — createEmbeddingProvider()
case "your-provider":
  return new YourEmbeddingClient({
    apiKey: settings.apiKey,
    model: settings.model,
  });
```

### Provider 回退

如果 Provider 初始化失败，系统自动降级到 FTS-Only 模式（仅全文检索）。

## 3. 自定义检索策略

### 修改混合权重

```typescript
// hybrid-merge.ts
const DEFAULT_HYBRID_CONFIG = {
  vectorWeight: 0.7,   // 向量检索权重
  textWeight: 0.3,     // 全文检索权重
  mmr: { lambda: 0.5 }, // 最大边际相关性
  temporalDecay: { halfLifeDays: 30 }, // 时间衰减半衰期
};
```

### 添加新的检索方法

在 `MemoryIndexManager` 中添加：
```typescript
async searchCustom(query: string, opts): Promise<SearchResult[]> {
  const keywords = extractKeywords(query);
  // 自定义检索逻辑
}
```

## 4. 扩展记忆源

当前 3 种源：`memory`（MEMORY.md）、`session`（历史会话）、`extra`（额外路径）。

添加新源：
```typescript
// sync.ts — collectSources()
sources.push({
  type: "your-source",
  paths: resolveYourPaths(settings),
  reader: yourFileReader,
});
```

## 5. 上下文注入器

```typescript
// context-engine/injectors/your-injector.ts
export class YourContextInjector implements ContextInjector {
  priority = 50; // 执行优先级（越小越先）

  async inject(ctx: InjectorContext): Promise<string | null> {
    // 返回要注入系统提示的文本
    return `当前状态: ${await fetchState()}`;
  }
}

// 注册到 Registry
registry.register(new YourContextInjector());
```

## 6. SQLite 操作注意事项

- **Readonly 恢复**：遇到 `SQLITE_READONLY` 自动重建连接
- **WAL 模式**：使用 WAL 日志以支持并发读写
- **Schema 迁移**：在 `ensureSchema()` 中使用 `user_version` 版本化

## 7. 测试

```bash
pnpm test -- src/memory/
pnpm test -- src/context-engine/
```
