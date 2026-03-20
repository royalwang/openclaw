# 模块分析：Agents, Context & Memory

## 代理核心 — `src/agents/` (579 文件) ⭐ 最大模块

Agents 模块是 OpenClaw 的"灵魂"，驱动 AI 推理、工具调用、子代理编排和会话管理。

```mermaid
graph TB
  subgraph "Agent 执行层"
    CMD["agent-command.ts (43KB)<br/>执行编排器"]
    SCOPE["agent-scope.ts (11KB)<br/>作用域管理"]
    WS_RUN["workspace-run.ts<br/>工作区执行"]
  end

  subgraph "认知循环 Pi Runner"
    PIR["pi-embedded-runner/<br/>嵌入式认知引擎"]
    SUB_PI["pi-embedded-subscribe.ts (26KB)<br/>流式订阅处理"]
    HELPER["pi-embedded-helpers/<br/>辅助工具集"]
    HANDLERS["subscribe.handlers/<br/>消息/工具/生命周期处理器"]
  end

  subgraph "模型与供应商"
    SEL["model-selection.ts (20KB)<br/>模型选择算法"]
    FALL["model-fallback.ts (26KB)<br/>故障降级链"]
    CAT["model-catalog.ts (9KB)<br/>模型目录"]
    COMPAT["model-compat.ts (5KB)<br/>兼容层"]
    PROVIDERS["models-config.providers.ts (26KB)<br/>供应商配置"]
  end

  subgraph "子代理系统"
    REG["subagent-registry.ts (44KB)<br/>子代理注册中心"]
    SPAWN["subagent-spawn.ts (25KB)<br/>子代理孵化"]
    CTRL["subagent-control.ts (24KB)<br/>子代理控制"]
    ANN["subagent-announce.ts (52KB)<br/>结果发布"]
    DEPTH["subagent-depth.ts<br/>嵌套深度控制"]
  end

  subgraph "工具系统"
    BASH["bash-tools.exec.ts (21KB)<br/>Shell 执行"]
    PROC["bash-tools.process.ts (22KB)<br/>进程管理"]
    PI_TOOLS["pi-tools.ts (24KB)<br/>工具注册"]
    READ["pi-tools.read.ts (26KB)<br/>文件读取工具"]
    POLICY["tool-policy-pipeline.ts<br/>工具策略管道"]
    LOOP["tool-loop-detection.ts (18KB)<br/>循环检测"]
  end

  CMD --> PIR
  CMD --> SEL & FALL
  PIR --> SUB_PI --> HANDLERS
  PIR --> HELPER
  CMD --> REG
  REG --> SPAWN & CTRL & ANN
  PIR --> BASH & PI_TOOLS
  PI_TOOLS --> POLICY & LOOP
```

### Agent Command — 执行编排器

`agent-command.ts`（43KB）是单次"代理回合"的总指挥：

1. 解析会话背景、Agent 配置
2. 准备工作空间（沙箱路径、引导文件）
3. 选择模型（`model-selection.ts`）并处理 Auth Profile 轮换
4. 构建 System Prompt（`system-prompt.ts` 32KB）
5. 启动 Pi Runner 认知循环
6. 处理子代理孵化请求

### Pi Embedded Runner — 认知循环

核心 AI 推理引擎，负责：

- 维护对话历史（含压缩 `compaction.ts` 15KB）
- 应用 System Prompt + 上下文注入
- 流式响应处理（`pi-embedded-subscribe.ts` 26KB）
- 工具调用执行与结果注入
- 会话写锁（`session-write-lock.ts` 16KB）防止并发冲突

### Model Fallback — 故障降级

```mermaid
flowchart LR
    REQ["模型请求"] --> PRIMARY["主模型"]
    PRIMARY -->|成功| OK["返回结果"]
    PRIMARY -->|失败| OBSERVE["model-fallback-observation.ts<br/>记录失败"]
    OBSERVE --> FALLBACK["降级链中下一个模型"]
    FALLBACK -->|成功| OK
    FALLBACK -->|全部失败| ERR["failover-error.ts<br/>报告错误"]
```

### Subagent 系统

支持层级式子代理编排：

- **注册中心** (`subagent-registry.ts` 44KB)：管理子代理生命周期
- **孵化器** (`subagent-spawn.ts` 25KB)：创建子代理实例，传递工作上下文
- **控制器** (`subagent-control.ts` 24KB)：暂停/恢复/终止子代理
- **发布器** (`subagent-announce.ts` 52KB)：子代理完成后向父级汇报结果
- **深度控制** (`subagent-depth.ts`)：防止无限递归嵌套

### Auth Profiles — 认证配置

管理 LLM 供应商 API 密钥的核心模块：

- 多密钥轮换（Round Robin）
- 故障冷却机制（Cooldown + Auto-expiry）
- 运行时快照保存
- CLI 外部同步

---

## 上下文引擎 — `src/context-engine/` (7 文件)

动态上下文注入的核心模块。

| 文件                 | 用途                 |
| -------------------- | -------------------- |
| `registry.ts` (10KB) | 上下文注入器注册中心 |
| `delegate.ts`        | 注入委托器           |
| `types.ts` (5KB)     | 上下文类型定义       |
| `init.ts`            | 初始化               |
| `legacy.ts`          | 兼容层               |

### 注入内容

注入到 Agent Prompt 的上下文包括：

- 当前时间与时区
- 用户/发送者信息
- 工作区文件内容
- Memory 检索结果（RAG）
- 插件注入的自定义上下文

---

## 记忆引擎 — `src/memory/` (102 文件)

为 Agent 提供持久化记忆和知识检索能力。

```mermaid
graph TB
  subgraph "索引管理"
    MGR["manager.ts (28KB)<br/>MemoryIndexManager"]
    SYNC["manager-sync-ops.ts (45KB)<br/>同步操作"]
    EMB_OPS["manager-embedding-ops.ts (30KB)<br/>嵌入操作"]
    SEARCH["manager-search.ts (5KB)<br/>搜索操作"]
  end

  subgraph "嵌入引擎"
    EMB_MAIN["embeddings.ts (11KB)<br/>统一接口"]
    OPENAI["embeddings-openai.ts"]
    GEMINI["embeddings-gemini.ts (10KB)"]
    VOYAGE["embeddings-voyage.ts"]
    OLLAMA["embeddings-ollama.ts"]
    MISTRAL["embeddings-mistral.ts"]
  end

  subgraph "QMD 查询管理"
    QMD["qmd-manager.ts (69KB)<br/>智能查询管理器"]
    QMD_P["qmd-process.ts<br/>查询处理"]
    QMD_Q["qmd-query-parser.ts<br/>查询解析"]
    QMD_S["qmd-scope.ts<br/>查询范围"]
  end

  subgraph "检索算法"
    HYBRID["hybrid.ts<br/>混合检索"]
    MMR["mmr.ts (6KB)<br/>最大边际相关性"]
    DECAY["temporal-decay.ts (4KB)<br/>时间衰减"]
    EXPAND["query-expansion.ts (13KB)<br/>查询扩展"]
  end

  MGR --> SYNC & EMB_OPS & SEARCH
  EMB_OPS --> EMB_MAIN
  EMB_MAIN --> OPENAI & GEMINI & VOYAGE & OLLAMA & MISTRAL
  SEARCH --> HYBRID --> MMR & DECAY
  MGR --> QMD
```

### 核心特性

- **混合检索**：向量语义搜索 + FTS5 关键词搜索，自动合并权重
- **MMR 算法**：确保搜索结果多样性，避免信息冗余
- **时间衰减**：优先推荐较新的记忆
- **查询扩展**：自动扩展用户查询以提高召回率
- **批量嵌入**：支持 Gemini/Voyage 等供应商的批量处理 API
- **自动索引**：监控工作区 Markdown 文件，自动更新索引
- **QMD 智能管理**：69KB 的查询管理器，支持复杂的记忆检索场景

### 存储后端

- **SQLite + sqlite-vec**：向量存储与检索
- **SQLite FTS5**：全文搜索索引
- 支持远程 embedding 服务 (`embeddings-remote-*.ts`)
