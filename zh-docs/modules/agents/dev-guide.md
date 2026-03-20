# Agent 引擎开发指南

> 如何添加 Agent 能力、自定义模型选择、扩展执行路径。

## 1. 项目结构

```
src/agents/
├── agent-command.ts     # 核心执行入口
├── model-selection.ts   # 模型引用解析与选择
├── model-fallback.ts    # 模型故障转移
├── sandbox.ts           # 沙箱配置解析
├── session-store.ts     # 会话存储
├── subagent-registry.ts # 子代理注册表
├── cli-agent/           # CLI Provider（Claude CLI / Codex）
└── workspace/           # Agent 工作区管理
```

## 2. 添加新的执行路径

当前有 3 种路径：CLI Provider → ACP → 嵌入式 Pi。添加新路径：

```typescript
// agent-command.ts — runAgentAttempt() 中添加分支
if (isYourProvider(provider)) {
  return runYourAgent({
    message: body,
    sessionEntry,
    config: resolvedConfig,
    // ...
  });
}
```

### 执行路径契约

每种执行路径必须：
1. 返回 `AgentCommandResult`（含 `text`, `usage`, `sessionId`）
2. 支持 `onEvent` 回调（流式输出）
3. 处理 `FailoverError` 以触发 fallback
4. 发出 `agentEvent` 事件（`stream.text_delta`）

## 3. 扩展模型选择

### 添加 Provider 别名

在 `model-selection.ts` 中：
```typescript
// normalizeProviderModelId() — 添加短名称映射
case "your-provider":
  return normalizeYourModelId(model);
  // "fast" → "your-provider-fast-v2"
```

### 自定义 Thinking 级别

在 `resolveThinkingDefaultForModel()` 中为新模型指定默认值：
```typescript
if (modelRef.includes("your-model")) {
  return "medium"; // 默认 thinking 级别
}
```

## 4. 会话管理

### 会话覆盖字段

12 个可覆盖字段（需在会话删除时清理）：
- `providerOverride` / `modelOverride`
- `authProfileOverride` / `thinkingLevel` / `verboseLevel`

### 添加新的会话字段

1. 在 `session-store.ts` 的 `SessionEntry` 类型中添加字段
2. 在 `clearSessionOverrides()` 中添加清理逻辑
3. 在 `buildStatusMessage()` 中展示新字段

## 5. 模型白名单

```typescript
// 空白名单 → allowAny: true
agents.defaults.models = {};  // 允许所有模型

// 非空白名单 → 严格匹配
agents.defaults.models = {
  "anthropic/claude-sonnet-4-5": {},
  "openai/gpt-4o": {},
};
```

## 6. 测试

```bash
pnpm test -- src/agents/
# 重点测试：model-selection, agent-command, model-fallback
```
