# Agent 模块开发指南

> 实践导向的开发指南，帮助你在 `src/agents/` 模块中高效开发。

## 1. 添加新 AI Provider

### 步骤一：创建模型文件

```typescript
// src/agents/my-provider-models.ts
export function listMyProviderModels(): ModelCatalogEntry[] {
  return [
    {
      id: "my-provider/model-a",
      provider: "my-provider",
      displayName: "Model A",
      contextWindow: 128000,
      supportsImages: true,
      supportsTools: true,
    },
  ];
}
```

### 步骤二：注册到 Provider 配置

```typescript
// 在 models-config.providers.ts 中添加
// 在 models-config.providers.discovery.ts 中添加自动发现
```

### 步骤三：添加模型 ID 归一化

```typescript
// 在 model-selection.ts -> normalizeProviderModelId() 中添加
if (provider === "my-provider") {
  return normalizeMyProviderModelId(model);
}
```

### 步骤四：添加流式适配器

参考 `ollama-stream.ts` 或 `openai-ws-stream.ts` 的模式。

---

## 2. 添加新工具

### 步骤一：在 tool-catalog.ts 注册

```typescript
// 在 CORE_TOOL_DEFINITIONS 数组中添加
{
  id: "my_tool",
  label: "my_tool",
  description: "My tool description",
  sectionId: "automation",  // 选择合适的组
  profiles: ["coding"],     // 选择激活的 Profile
  includeInOpenClawGroup: true,
}
```

### 步骤二：在 system-prompt.ts 添加摘要

```typescript
// 在 coreToolSummaries 对象中添加
my_tool: "Brief description for system prompt",
```

### 步骤三：实现工具处理器

```typescript
// 在 pi-tools.ts 中对应位置添加，或创建独立文件
// 参考 channel-tools.ts 或 openclaw-tools.ts
```

### 步骤四：配置工具策略

```typescript
// 在 tool-policy.ts 中添加策略规则
// 在 sandbox-tool-policy.ts 中添加沙箱策略（如需要）
```

---

## 3. 修改 System Prompt

### 添加新段落

1. 创建构建器函数：
```typescript
function buildMySection(params: { isMinimal: boolean }) {
  if (params.isMinimal) return [];  // 子代理跳过
  return [
    "## My Section",
    "Section content...",
    "",
  ];
}
```

2. 在 `buildAgentSystemPrompt()` 的 `lines` 数组中插入适当位置。

### 修改 Runtime Line

在 `buildRuntimeLine()` 中添加新字段：
```typescript
myField ? `my_field=${myField}` : "",
```

---

## 4. 开发子代理功能

### 注册表操作

```typescript
// 注册新运行
subagentRuns.set(runId, {
  runId,
  childSessionKey,
  requesterSessionKey,
  startedAt: Date.now(),
  // ...
});
persistSubagentRuns();

// 完成运行
await completeSubagentRun({
  runId,
  outcome: { status: "ok" },
  reason: SUBAGENT_ENDED_REASON_COMPLETE,
  sendFarewell: true,
  triggerCleanup: true,
});
```

### 通知流要点

- 通知重试使用指数退避（1s → 2s → 4s → 8s）
- 最多重试 3 次
- 非完成通知 5 分钟过期
- 完成通知 30 分钟硬过期
- steer-restart 期间抑制通知

---

## 5. 处理模型回退

### 添加新的回退原因

1. 在 `failover-error.ts` 中添加 `FailoverReason`
2. 在 `model-fallback.ts` 的 `resolveCooldownDecision()` 中添加处理逻辑
3. 更新 `describeFailoverError()` 返回描述

### 调试回退链

```typescript
// 启用回退观察日志
import { logModelFallbackDecision } from "./model-fallback-observation.js";
// 决策类型: skip_candidate | probe_cooldown_candidate | 
//           candidate_succeeded | candidate_failed
```

---

## 6. 工作区引导文件

### 添加新的引导文件

1. 在 `workspace.ts` 中添加常量：
```typescript
export const DEFAULT_MY_FILENAME = "MY_FILE.md";
```

2. 添加到 `VALID_BOOTSTRAP_NAMES` Set
3. 在 `ensureAgentWorkspace()` 中添加模板加载逻辑
4. 在 `loadWorkspaceBootstrapFiles()` 中添加加载入口

### 安全注意事项

- 所有文件读取必须通过 `readWorkspaceFileWithGuards()` —— 防止路径遍历
- 使用 `openBoundaryFile()` 验证: 绝对路径在 workspaceDir 内
- 文件大小限制: `MAX_WORKSPACE_BOOTSTRAP_FILE_BYTES` = 2MB
- 缓存由 inode/dev/size/mtime 标识，防止 TOCTOU

---

## 7. 上下文压缩策略

### 自定义摘要指令

```typescript
const instructions: CompactionSummarizationInstructions = {
  identifierPolicy: "strict",  // "strict" | "custom" | "off"
  identifierInstructions: "Custom preservation rules...",
};
```

### Token 预算管理

```typescript
// 压缩开销
SUMMARIZATION_OVERHEAD_TOKENS = 4096;  // 系统提示 + 推理预留

// 历史裁剪
const pruned = pruneHistoryForContextShare({
  messages,
  maxContextTokens: 128000,
  maxHistoryShare: 0.5,  // 最多占上下文的 50%
  parts: 2,
});
```

---

## 8. 关键开发模式

### 依赖注入

```typescript
// 使用 createDefaultDeps() 而非直接导入
import { createDefaultDeps } from "../cli/deps.js";
const deps = createDefaultDeps();
```

### 子系统日志

```typescript
import { createSubsystemLogger } from "../logging/subsystem.js";
const log = createSubsystemLogger("agents/my-subsystem");
log.info("message", { context });
log.warn("warning");
```

### 错误恢复

```typescript
// 使用 retryAsync 进行自动重试
import { retryAsync } from "../infra/retry.js";
const result = await retryAsync(
  () => myOperation(),
  {
    attempts: 3,
    minDelayMs: 500,
    maxDelayMs: 5000,
    jitter: 0.2,
    label: "my-operation",
    shouldRetry: (err) => !(err instanceof Error && err.name === "AbortError"),
  },
);
```

---

## 9. 测试指南

### 目录结构

- 单元测试与源码并置: `*.test.ts`
- E2E 测试: `*.e2e.test.ts`
- Live 测试（需要 API Key）: `*.live.test.ts`
- 测试辅助: `test-helpers/`, `*-test-harness.ts`

### 运行测试

```bash
# 运行 agents 相关测试
pnpm test -- src/agents/model-selection.test.ts
pnpm test -- src/agents/model-fallback.test.ts

# 运行 live 测试（需要环境变量）
CLAWDBOT_LIVE_TEST=1 pnpm test:live
```

### Mock 模式

```typescript
// 使用 test-harness 进行集成测试
import { createModelTestHarness } from "./model-catalog.test-harness.js";
```
