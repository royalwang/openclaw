# 记忆搜索系统

> 深度剖析 `memory-search.ts` (407L) 的完整记忆搜索配置与查询业务逻辑。

## 1. Embedding Provider 体系

### 1.1 七种 Provider

| Provider | 默认模型 | 说明 |
|----------|---------|------|
| `openai` | text-embedding-3-small | OpenAI Embeddings API |
| `gemini` | gemini-embedding-001 | Google Gemini |
| `voyage` | voyage-4-large | Voyage AI |
| `mistral` | mistral-embed | Mistral AI |
| `ollama` | nomic-embed-text | 本地 Ollama |
| `local` | (自定义) | 本地模型文件 |
| `auto` | (自动选择) | 根据密钥可用性选择 |

### 1.2 Provider 降级

```
fallback 配置: "openai" | "gemini" | "local" | "voyage" | "mistral" | "ollama" | "none"
→ 主 provider 不可用时使用 fallback
→ 默认 "none" (不降级)
```

---

## 2. 混合搜索引擎

### 2.1 参数矩阵

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `hybrid.enabled` | true | 启用混合搜索 |
| `hybrid.vectorWeight` | 0.7 | 向量搜索权重 |
| `hybrid.textWeight` | 0.3 | 文本搜索权重 |
| `hybrid.candidateMultiplier` | 4 | 候选扩大因子 (1-20) |

### 2.2 权重标准化

```typescript
// 确保 vectorWeight + textWeight = 1.0
const sum = vectorWeight + textWeight;
normalizedVectorWeight = sum > 0 ? vectorWeight / sum : 0.7;
normalizedTextWeight = sum > 0 ? textWeight / sum : 0.3;
```

### 2.3 MMR（最大边际相关性）

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `mmr.enabled` | false | 启用 MMR 重排序 |
| `mmr.lambda` | 0.7 | 相关性 vs 多样性平衡 (0=纯多样性, 1=纯相关性) |

### 2.4 时间衰减

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `temporalDecay.enabled` | false | 启用时间衰减 |
| `temporalDecay.halfLifeDays` | 30 | 衰减半衰期 (天) |

---

## 3. 存储层

### 3.1 SQLite 向量存储

```typescript
store = {
  driver: "sqlite",
  path: resolveStorePath(agentId, raw),  // ~/.openclaw/state/memory/{agentId}.sqlite
  vector: {
    enabled: true,             // 启用向量扩展
    extensionPath?: string,    // 自定义 sqlite-vec 扩展路径
  },
}

// 路径模板: 支持 {agentId} 占位符
// 例: "/data/memory/{agentId}.sqlite" → "/data/memory/bot.sqlite"
```

### 3.2 Chunking 配置

| 参数 | 默认值 | 约束 |
|------|--------|------|
| `chunking.tokens` | 400 | 最小 1 |
| `chunking.overlap` | 80 | clamp(0, tokens-1) |

---

## 4. 同步机制

### 4.1 触发条件

| 触发器 | 默认 | 说明 |
|--------|------|------|
| `sync.onSessionStart` | true | 会话开始时同步 |
| `sync.onSearch` | true | 搜索前同步 |
| `sync.watch` | true | 文件监控 (fswatch) |
| `sync.watchDebounceMs` | 1500 | 监控去抖 |
| `sync.intervalMinutes` | 0 | 定期同步间隔 (0=禁用) |

### 4.2 Session 同步阈值

| 阈值 | 默认值 | 说明 |
|------|--------|------|
| `sessions.deltaBytes` | 100,000 | 字节变化阈值 |
| `sessions.deltaMessages` | 50 | 消息数变化阈值 |
| `sessions.postCompactionForce` | true | 压缩后强制同步 |

---

## 5. 查询参数

| 参数 | 默认值 | 约束 |
|------|--------|------|
| `query.maxResults` | 6 | 最大返回数 |
| `query.minScore` | 0.35 | 最低相关性分数 (0-1) |

---

## 6. 数据源

```typescript
sources: ["memory"] | ["sessions"] | ["memory", "sessions"]

// "memory"   → 工作区 memory/ 目录和 MEMORY.md 文件
// "sessions" → 会话历史 (需 experimental.sessionMemory=true)
// 默认仅 "memory"
// sessions 禁用时, 即使配置也不会加入
```

---

## 7. 多模态支持

```typescript
multimodal = normalizeMemoryMultimodalSettings({
  enabled: boolean,
  modalities: string[],     // 支持的模态类型
  maxFileBytes: number,     // 最大文件大小
});

// 约束:
// - 仅 provider="gemini" + model="gemini-embedding-2-preview" 支持
// - multimodal 启用时 fallback 必须为 "none"
```

---

## 8. 批处理 Embeddings

```typescript
remote.batch = {
  enabled: false,           // 启用批处理
  wait: true,               // 等待批处理完成
  concurrency: 2,           // 并发数
  pollIntervalMs: 2000,     // 轮询间隔
  timeoutMinutes: 60,       // 超时时间
};
```

---

## 9. 缓存

```typescript
cache = {
  enabled: true,             // 启用查询缓存
  maxEntries?: number,       // 最大缓存条数 (最小 1)
};
```

---

## 10. 配置合并优先级

```
1. agents.list[agentId].memorySearch  (agent 级别覆盖)
2. agents.defaults.memorySearch       (全局默认)
3. 代码硬编码默认值
```
