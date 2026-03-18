# 模块分析：Agents, Context & Memory

## 代理核心 (Agents) - `src/agents/`

Agents 模块是 OpenClaw 的“灵魂”，负责处理复杂的 AI 推理、工具调用和会话管理。

### 核心组件

-   **执行控制器 (`agent-command.ts`)**:
    -   作为单次“代理回合”的编排者。它解析会话背景、准备工作空间、处理模型覆盖（Overrides）并分发执行任务。
-   **嵌入式运行环境 (`pi-embedded-runner/`)**:
    -   实现了内部的 AI 认知循环。它负责维护对话历史、应用系统提示词（System Prompt）、处理流式响应，并在接收到 LLM 的工具调用请求时执行相应的代码。
-   **认证配置文件 (`auth-profiles/`)**:
    -   管理不同 LLM 供应商的 API 密钥。支持多密钥轮换、故障冷却机制，确保代理在调用大模型时的稳定性。
-   **工具集 (Tools)**:
    -   定义了 Agent 可以使用的能力，如 `bash-tools.ts` (终端执行)、文件读写工具等。

---

## 上下文引擎 (Context Engine) - `src/context-engine/`

上下文引擎负责在 Agent 运行时动态地将相关信息注入到提示词中。

### 工作机制

-   **注册器 (`registry.ts`)**: 允许系统各处注册“上下文注入器”。
-   **信息注入**: 注入的信息包括当前时间、用户信息、当前文件内容以及从存储模块检索到的相关记忆。这确保了 Agent 始终拥有最新的、与任务相关的背景信息。

---

## 记忆存储 (Memory) - `src/memory/`

Memory 模块为 OpenClaw 提供了持久化记忆和知识检索能力，基于 SQLite 和 `sqlite-vec` 扩展实现。

### 核心特性

-   **混合检索 (`MemoryIndexManager`)**:
    -   **向量搜索**: 基于 Embeddings 实现语义相似度匹配。
    -   **全文搜索 (FTS)**: 传统的关键词匹配，用于精确查找。
    -   **混合模式**: 自动合并并调整向量和 FTS 的结果权重。
-   **自动索引**:
    -   监控工作空间中的 Markdown 文件并自动更新索引。
    -   自动对历史会话记录（Transcripts）进行切片和索引，使 Agent 能引用之前的对话内容。
-   **高级算法**: 支持时间衰减（Temporal Decay，优先推荐较新的记忆）和 MMR（Maximal Marginal Relevance，确保检索结果的多样性）。
