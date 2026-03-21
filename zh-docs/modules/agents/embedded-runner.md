# 嵌入式运行器核心

> 深度剖析 `pi-embedded-runner/run.ts` (1708L, 71KB) 的完整运行循环业务逻辑。

## 1. 双通道队列架构

```mermaid
flowchart TD
    REQUEST["runEmbeddedPiAgent()"] --> SESSION_LANE["enqueueSession()<br/>会话级别串行队列"]
    SESSION_LANE --> GLOBAL_LANE["enqueueGlobal()<br/>全局并发控制"]
    GLOBAL_LANE --> RUN_LOOP["运行循环"]
```

- **Session Lane**: 基于 sessionKey/sessionId 的串行队列，防止同一会话并发执行
- **Global Lane**: 全局并发控制，限制同时活跃的运行数

---

## 2. 运行时认证生命周期

### 2.1 认证定时刷新

```mermaid
sequenceDiagram
    participant Run as 运行循环
    participant Auth as RuntimeAuthState
    participant Plugin as providerRuntimeAuth
    participant Store as AuthStorage

    Run->>Auth: prepareProviderRuntimeAuth()
    Auth-->>Run: {apiKey, expiresAt, baseUrl}
    Run->>Store: setRuntimeApiKey()

    Note over Run: 定时刷新调度
    Run->>Auth: scheduleRuntimeAuth()<br/>expiresAt - 5min margin

    loop 定时刷新
        Auth->>Plugin: refreshRuntimeAuth("scheduled")
        Plugin-->>Auth: 新 apiKey+expiresAt
        Auth->>Store: setRuntimeApiKey()
        Auth->>Auth: reschedule()
    end

    Run->>Auth: stopRuntimeAuthRefreshTimer()
```

### 2.2 认证刷新常量

| 常量                 | 值     | 说明                 |
| -------------------- | ------ | -------------------- |
| REFRESH_MARGIN_MS    | 5 分钟 | 提前于过期的刷新窗口 |
| REFRESH_RETRY_MS     | 1 分钟 | 刷新失败后重试间隔   |
| REFRESH_MIN_DELAY_MS | 5 秒   | 最小刷新延迟         |

---

## 3. Profile 轮换链

```mermaid
flowchart TD
    START["初始 profile 选择"] --> LOCKED{"lockedProfileId?<br/>(用户指定)"}
    LOCKED -->|是| USE_LOCKED["仅使用指定 profile"]
    LOCKED -->|否| ORDER["resolveAuthProfileOrder()<br/>按配置排序"]

    ORDER --> LOOP["遍历候选"]
    LOOP --> COOLDOWN{"在冷却中?"}
    COOLDOWN -->|是| PROBE{"允许冷却探测?<br/>(transient + 全部冷却)"}
    PROBE -->|是| USE["使用此 profile (探测)"]
    PROBE -->|否| SKIP["跳过 → 下一个"]
    COOLDOWN -->|否| USE

    USE --> RUN["API 调用"]
    RUN -->|失败| ADVANCE["advanceAuthProfile()"]
    ADVANCE --> NEXT_LOOP["跳过冷却中的 profile"]
    ADVANCE -->|全部耗尽| FAILOVER["throwAuthProfileFailover()"]
```

### 3.1 Profile 轮换重置

轮换 profile 时重置:

- `thinkLevel` → 初始值
- `attemptedThinking` → 清空
- **不重置**: `overflowCompactionAttempts`, `toolResultTruncationAttempted`

---

## 4. 运行循环重试机制

### 4.1 重试上限

```typescript
BASE_RUN_RETRY_ITERATIONS = 24;
RUN_RETRY_ITERATIONS_PER_PROFILE = 8;
MIN_RUN_RETRY_ITERATIONS = 32;
MAX_RUN_RETRY_ITERATIONS = 160;

// 公式: max(32, min(160, 24 + profileCount × 8))
// 1 profile → 32, 5 profiles → 64, 17 profiles → 160
```

### 4.2 完整错误决策树

```mermaid
flowchart TD
    ERROR["错误发生"] --> ABORT{"已取消?"}
    ABORT -->|是| RETURN["返回已有 payload"]
    ABORT -->|否| OVERFLOW{"上下文溢出?"}

    OVERFLOW -->|是| OVF_BRANCH["上下文溢出恢复<br/>(见 §5)"]
    OVERFLOW -->|否| PROMPT_ERR{"promptError?"}

    PROMPT_ERR -->|是| AUTH_REFRESH{"运行时认证刷新?"}
    AUTH_REFRESH -->|成功| RETRY["重试 (authRetryPending)"]
    AUTH_REFRESH -->|否| ROLE_ERR{"角色排序错误?"}
    ROLE_ERR -->|是| ROLE_MSG["'Message ordering conflict...'"]
    ROLE_ERR -->|否| IMAGE_ERR{"图像过大?"}
    IMAGE_ERR -->|是| IMAGE_MSG["'Image too large...'"]
    IMAGE_ERR -->|否| MARK_FAIL["markAuthProfileFailure()"]
    MARK_FAIL --> TRY_ROTATE["尝试轮换 profile"]
    TRY_ROTATE -->|成功| RETRY2["重试 + 退避"]
    TRY_ROTATE -->|否| THINK_FB{"thinking 降级?"}
    THINK_FB -->|是| THINK_RETRY["降级 thinking + 重试"]
    THINK_FB -->|否| HAS_FB{"有 model fallback?"}
    HAS_FB -->|是| FAILOVER_ERR["throw FailoverError"]
    HAS_FB -->|否| SURFACE["throw 原始错误"]

    PROMPT_ERR -->|否| ASSISTANT_ERR["检查 assistant 错误"]
    ASSISTANT_ERR --> SHOULD_ROTATE{"shouldRotate?<br/>(failover || timeout)"}
    SHOULD_ROTATE -->|是| SAME_FLOW["同上轮换链"]
    SHOULD_ROTATE -->|否| SUCCESS["正常返回"]
```

### 4.3 Overload 退避

```typescript
OVERLOAD_FAILOVER_BACKOFF_POLICY = {
  initialMs: 250,
  maxMs: 1500,
  factor: 2,
  jitter: 0.2,
};
// 250ms → 500ms → 1000ms → 1500ms (上限)
```

---

## 5. 上下文溢出三阶段恢复

```mermaid
flowchart TD
    OVERFLOW["上下文溢出检测"] --> HAD_AUTO{"这次 attempt<br/>已自动 compact?"}

    HAD_AUTO -->|是| RETRY1["直接重试 (SDK 已 compact)<br/>overflowCompactionAttempts++"]
    HAD_AUTO -->|否| EXPLICIT["显式 contextEngine.compact()<br/>target=budget, force=true"]

    RETRY1 --> STILL_OVERFLOW{"仍然溢出?"}
    STILL_OVERFLOW -->|是| CHECK_LIMIT{"< 3 次?"}
    CHECK_LIMIT -->|是| EXPLICIT
    CHECK_LIMIT -->|否| TOOL_TRUNC{"工具结果截断?"}

    EXPLICIT --> COMPACT_OK{"compact 成功?"}
    COMPACT_OK -->|是| RETRY2["重试"]
    COMPACT_OK -->|否| TOOL_TRUNC

    TOOL_TRUNC --> HAS_OVERSIZED{"有超大工具结果?"}
    HAS_OVERSIZED -->|是| TRUNCATE["truncateOversizedToolResults()<br/>仅尝试一次"]
    TRUNCATE --> TRUNC_OK{"截断成功?"}
    TRUNC_OK -->|是| RETRY3["重试"]
    TRUNC_OK -->|否| GIVE_UP["'Context overflow...'"]
    HAS_OVERSIZED -->|否| GIVE_UP
```

### 5.1 Compaction 钩子

```
overflow 恢复时的 hook 生命周期:
  1. before_compaction (仅 engineOwnsCompaction=true)
  2. contextEngine.compact()
  3. after_compaction (仅成功时)
```

---

## 6. 使用量累计器

### 6.1 Last-Call 修正

```typescript
// 问题: 多次 API 调用 (tool-use loop) 时
//   累计 cacheRead = N × context_size → 膨胀
//
// 修正: 仅使用最后一次 API 调用的 cache 字段
//   lastCacheRead, lastCacheWrite, lastInput
//   total = lastPromptTokens + accumulated output
```

### 6.2 错误路径使用量保留

```
即使运行失败, agentMeta 也包含使用量数据:
  → session totalTokens 反映实际上下文大小
  → 不因错误而丢失使用量追踪
```

---

## 7. 安全措施

### 7.1 Anthropic 魔术字符串清理

```typescript
// "ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL"
// → 被替换为 "ANTHROPIC MAGIC STRING TRIGGER REFUSAL (redacted)"
// 防止拒绝测试 token 污染会话转录
```

### 7.2 Timeout vs Profile 冷却

```
Timeout 不标记 profile 冷却:
  → timeout 是模型/网络问题, 不是认证问题
  → 标记 profile 会毒化同 provider 其他模型的 fallback
  → 例: gpt-5.3 超时 → 不应阻止 gpt-5.2
```

### 7.3 Probe Session 检测

```typescript
isProbeSession = sessionId?.startsWith("probe-") ?? false;
// 探测 session 的 timeout 不产生 warn 日志
```
