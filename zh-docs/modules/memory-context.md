# 模块分析：记忆与上下文引擎 (Memory & Context)

## 记忆引擎 — `src/memory/` (102 文件)

为 Agent 提供持久化知识检索和长期记忆能力，是 RAG（检索增强生成）的核心基础设施。

```mermaid
graph TB
  subgraph "索引管理器"
    MGR["manager.ts (28KB)<br/>MemoryIndexManager 入口"]
    SYNC["manager-sync-ops.ts (45KB)<br/>文件/会话同步"]
    EMB_OPS["manager-embedding-ops.ts (30KB)<br/>嵌入向量操作"]
    SEARCH_OPS["manager-search.ts (5KB)<br/>搜索接口"]
  end

  subgraph "多供应商嵌入引擎"
    EMB["embeddings.ts (11KB)<br/>统一嵌入接口"]
    OAI["OpenAI"]
    GEM["Gemini (10KB)"]
    VOY["Voyage"]
    OLL["Ollama"]
    MIS["Mistral"]
    RMT["Remote HTTP"]
  end

  subgraph "QMD 查询管理器"
    QMD["qmd-manager.ts (69KB)<br/>智能查询编排"]
    QMD_P["qmd-process.ts"]
    QMD_Q["qmd-query-parser.ts"]
    QMD_S["qmd-scope.ts"]
  end

  subgraph "检索算法"
    HYB["hybrid.ts<br/>混合检索融合"]
    MMR["mmr.ts (6KB)<br/>最大边际相关性"]
    TD["temporal-decay.ts (4KB)<br/>时间衰减权重"]
    QE["query-expansion.ts (13KB)<br/>查询扩展"]
  end

  subgraph "批量处理"
    BR["batch-runner.ts<br/>批量嵌入调度"]
    BG["batch-gemini.ts (11KB)"]
    BV["batch-voyage.ts (8KB)"]
    BO["batch-openai.ts (7KB)"]
  end

  subgraph "存储层"
    SQL["SQLite + sqlite-vec<br/>向量存储"]
    FTS["SQLite FTS5<br/>全文索引"]
    SCHEMA["memory-schema.ts<br/>数据表结构"]
  end

  MGR --> SYNC & EMB_OPS & SEARCH_OPS
  EMB_OPS --> EMB
  EMB --> OAI & GEM & VOY & OLL & MIS & RMT
  SEARCH_OPS --> HYB
  HYB --> MMR & TD
  SEARCH_OPS --> QE
  MGR --> QMD
  QMD --> QMD_P & QMD_Q & QMD_S
  EMB_OPS --> BR
  BR --> BG & BV & BO
  MGR --> SQL & FTS & SCHEMA
```

### 混合检索策略

```mermaid
flowchart LR
    QUERY["用户查询"] --> EXPAND["query-expansion.ts<br/>查询扩展"]
    EXPAND --> VEC["向量语义搜索<br/>sqlite-vec"]
    EXPAND --> FTS["关键词搜索<br/>FTS5"]
    VEC --> MERGE["hybrid.ts<br/>结果融合"]
    FTS --> MERGE
    MERGE --> MMR_F["mmr.ts<br/>最大边际相关性<br/>去重多样化"]
    MMR_F --> DECAY["temporal-decay.ts<br/>时间衰减加权"]
    DECAY --> RESULT["排序后的记忆片段"]
```

### 嵌入模型支持矩阵

| 供应商  | 文件                          | 特性                |
| ------- | ----------------------------- | ------------------- |
| OpenAI  | `embeddings-openai.ts`        | text-embedding-3-\* |
| Gemini  | `embeddings-gemini.ts` (10KB) | 批量 API 支持       |
| Voyage  | `embeddings-voyage.ts`        | 高质量代码嵌入      |
| Ollama  | `embeddings-ollama.ts`        | 本地运行            |
| Mistral | `embeddings-mistral.ts`       | 多语言支持          |
| Remote  | `embeddings-remote-*.ts`      | 自定义 HTTP 端点    |

### QMD 查询管理器

`qmd-manager.ts`（69KB）是记忆系统的高级查询编排器：

- 支持复杂的多条件查询
- 查询范围控制（全局/工作区/会话级）
- 智能分页与结果缓存
- 会话文件索引管理（`session-files.ts`）

### 自动同步机制

`manager-sync-ops.ts`（45KB）负责：

- 工作区 Markdown 文件变更监控
- 会话 Transcript 自动切片索引
- 文件内容增量更新
- 嵌入向量去重（`vector-dedupe`）

---

## 上下文引擎 — `src/context-engine/` (7 文件)

动态注入上下文到 Agent Prompt 的核心框架。

```mermaid
flowchart LR
    subgraph "注入器注册"
        REG["registry.ts (10KB)<br/>ContextInjectorRegistry"]
        TIME["时间注入器"]
        USER["用户信息注入器"]
        FILE["文件内容注入器"]
        MEM_INJ["记忆检索注入器"]
        PLUG["插件自定义注入器"]
    end

    subgraph "注入流程"
        DELEGATE["delegate.ts<br/>注入委托"]
        TYPES["types.ts (5KB)<br/>上下文类型"]
    end

    REG --> TIME & USER & FILE & MEM_INJ & PLUG
    REG --> DELEGATE
    DELEGATE --> TYPES
```

### 注册器模式

`registry.ts` 实现了注入器注册中心：

1. 系统启动时各模块注册自己的上下文注入器
2. Agent 构建 Prompt 前，按优先级调用所有注入器
3. 注入器返回结构化上下文片段
4. 框架将片段合并到 System Prompt 中

### 注入内容类型

| 注入器 | 内容                     | 来源        |
| ------ | ------------------------ | ----------- |
| 时间   | 当前日期、时区、时间格式 | 系统        |
| 用户   | 发送者身份、权限级别     | Channel     |
| 文件   | 当前工作区关键文件内容   | 文件系统    |
| 记忆   | RAG 检索到的相关历史     | Memory 引擎 |
| 插件   | 自定义业务上下文         | Plugin Hook |
