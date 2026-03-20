# 模块分析：Extensibility (扩展性)

## 插件系统 — `src/plugins/` (138 文件)

OpenClaw 的高度可扩展性建立在精心设计的插件架构之上。

```mermaid
graph TB
  subgraph "插件加载引擎"
    LOADER["loader.ts (45KB)<br/>插件加载器"]
    DISC["discovery.ts (24KB)<br/>插件发现"]
    MANIFEST["manifest.ts (9KB)<br/>清单解析"]
    MANI_REG["manifest-registry.ts (14KB)<br/>清单注册"]
    VALID["schema-validator.ts (4KB)<br/>Schema 验证"]
  end

  subgraph "生命周期 Hooks"
    HOOKS["hooks.ts (29KB)<br/>Hook 引擎"]
    HOOK_RUN["hook-runner-global.ts<br/>全局 Hook 执行器"]
    WIRED["wired-hooks-*.ts<br/>内置 Hook 绑定"]
  end

  subgraph "插件管理"
    INSTALL["install.ts (24KB)<br/>插件安装"]
    UPDATE["update.ts (19KB)<br/>插件更新"]
    UNINSTALL["uninstall.ts (6KB)<br/>插件卸载"]
    MARKET["marketplace.ts (22KB)<br/>市场搜索"]
    STATUS["status.ts (10KB)<br/>状态查询"]
  end

  subgraph "运行时"
    REG["registry.ts (31KB)<br/>插件注册中心"]
    BIND["conversation-binding.ts (27KB)<br/>会话绑定"]
    RUNTIME["provider-runtime.ts (11KB)<br/>提供商运行时"]
    SLOTS["slots.ts<br/>插槽系统"]
    INTER["interactive.ts (8KB)<br/>交互式分发"]
  end

  subgraph "Provider 认证"
    P_AUTH["provider-auth-input.ts (17KB)<br/>认证输入"]
    P_STORE["provider-auth-storage.ts (9KB)<br/>凭证存储"]
    P_CHOICE["provider-auth-choice.ts (9KB)<br/>认证选择"]
    P_WIZARD["provider-wizard.ts (8KB)<br/>向导式配置"]
  end

  LOADER --> DISC & MANIFEST & VALID
  DISC --> MANI_REG
  LOADER --> REG
  REG --> BIND & RUNTIME & SLOTS
  HOOKS --> HOOK_RUN & WIRED
```

### 插件加载流程

```mermaid
sequenceDiagram
    participant GW as Gateway
    participant DISC as Discovery
    participant LOADER as Loader
    participant VALID as Validator
    participant REG as Registry
    participant HOOK as Hooks

    GW->>DISC: 扫描 extensions/ 目录
    DISC->>DISC: 发现 package.json + manifest
    DISC->>LOADER: 提交插件清单
    LOADER->>VALID: Schema 验证
    VALID-->>LOADER: 验证结果
    LOADER->>LOADER: 安全沙箱初始化
    LOADER->>REG: 注册插件实例
    REG->>HOOK: 绑定生命周期钩子
    HOOK-->>GW: 插件就绪
```

### Hook 系统

`hooks.ts`（29KB）支持的生命周期钩子：

| Hook                 | 触发时机     | 用途                  |
| -------------------- | ------------ | --------------------- |
| `before-agent-start` | Agent 开始前 | 修改配置、注入上下文  |
| `after-tool-call`    | 工具调用后   | 处理结果、日志记录    |
| `on-message`         | 收到消息     | 拦截/修改/过滤消息    |
| `on-compaction`      | 上下文压缩   | 自定义压缩策略        |
| `before-llm-call`    | LLM 调用前   | 修改 prompt、模型覆盖 |
| `on-session-start`   | 会话开始     | 初始化会话状态        |
| `on-subagent-*`      | 子代理事件   | 编排控制              |
| `inbound-claim`      | 消息认领     | 自定义路由策略        |

### 市场与分发

`marketplace.ts`（22KB）支持从远程注册表搜索和安装插件，`conversation-binding.ts`（27KB）管理插件到特定会话的绑定关系。
