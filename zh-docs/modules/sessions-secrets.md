# 模块分析：Sessions & Secrets

## 会话与凭据管理

这两个模块（`src/sessions/` 和 `src/secrets/`/`src/providers/`）协同工作，为 OpenClaw 提供了多租户环境下的状态隔离、上下文锁定与核心安全敏感信息管理。

### 会话管理 (Sessions)

-   **会话解析与生命周期 (`session-id-resolution.ts`, `session-key-utils.ts`)**:
    -   提供跨平台、多渠道的统一用户身份标识解析机制，打通不同社交通讯协议的独特 ID 格式，实现标准化的内部 Session ID 分配。
-   **模型与级别覆盖 (`model-overrides.ts`, `level-overrides.ts`)**:
    -   允许在每个特定的交互 Session 中动态覆盖系统级别的 LLM 默认大模型及参数行为，支持面向不同群组/私聊空间的独立定制策略。
-   **发送策略防刷屏 (`send-policy.ts`)**:
    -   在复杂的渠道对话中精准控制重试容错与高频阻断，定制特定的消息发送频率合并规则，防止 Agent 在循环故障中对群组造成打扰。

### 提供商扩展与凭据 (Providers & Secrets)

-   **提供商联合认证 (Providers)**:
    -   针对多种垂直模型与代码助手服务集成（包含 GitHub Copilot Auth 抓取、Google API 以及部分自定义协议像 Kilocode、Qwen Portal），提供统一标准的 OAuth 或鉴权接口对接能力封装。
-   **核心凭管理与隔离**:
    -   配合系统的运行时沙箱隔离，保障所有的连接 Key 注入安全，规范在持久化或远程调用传递链中杜绝明文硬编码输出。
