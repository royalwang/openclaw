# 渠道与路由开发指南

> 如何开发渠道插件、自定义路由策略、实现适配器接口。

## 1. 项目结构

```
src/channels/
├── plugins/
│   ├── types.ts          # 50+ 渠道类型导出
│   ├── types.adapters.ts # 25+ 适配器接口
│   ├── types.core.ts     # 核心类型
│   └── types.plugin.ts   # ChannelPlugin 主类型
├── config-presence.ts    # 渠道配置检测
└── chat-type.ts          # ChatType 枚举

src/routing/
├── session-key.ts        # Session Key 构建（254L）
├── account-id.ts         # Account ID 标准化
└── routing.ts            # 路由逻辑
```

## 2. 开发渠道插件

### 最小适配器实现

```typescript
import type { ChannelPlugin } from "openclaw/plugin-sdk";

export const myChannel: ChannelPlugin = {
  id: "my-channel",
  name: "My Channel",
  
  // 生命周期
  lifecycle: {
    start: async (ctx) => { /* 启动连接 */ },
    stop: async () => { /* 关闭连接 */ },
  },
  
  // 消息处理
  messaging: {
    onMessage: async (message, ctx) => {
      // 处理入站消息
      return { sessionKey: buildSessionKey(message) };
    },
  },
  
  // 出站发送
  outbound: {
    send: async (payload, ctx) => {
      // 发送消息到渠道
      await sendToApi(payload.text, ctx.peerId);
    },
  },
  
  // 状态查询
  status: {
    probe: async () => ({ ok: true, latencyMs: 42 }),
  },
};
```

### 适配器接口清单

| 适配器 | 必需 | 说明 |
|--------|------|------|
| `lifecycle` | ✅ | 启动/停止 |
| `messaging` | ✅ | 消息收发 |
| `outbound` | ✅ | 主动发送 |
| `status` | ✅ | 状态探测 |
| `auth` | - | 渠道认证 |
| `group` | - | 群组管理 |
| `threading` | - | 线程支持 |
| `mention` | - | @提及 |
| `streaming` | - | 流式输出 |
| `pairing` | - | 设备配对 |
| `security` | - | DM 策略 |
| `setup` | - | Onboarding |
| `execApproval` | - | 执行审批 |
| `directory` | - | 通讯录 |

## 3. Session Key 路由

```typescript
import { buildAgentPeerSessionKey } from "../routing/session-key.js";

const sessionKey = buildAgentPeerSessionKey({
  agentId: "main",
  channel: "my-channel",
  peerId: message.fromUserId,
  peerKind: message.isGroup ? "group" : "direct",
  dmScope: "per-peer",  // 或 "main" | "per-channel-peer" | "per-account-channel-peer"
});
```

## 4. Voice Bubble 渠道

如果渠道支持语音气泡播放：
```typescript
// tts/tts.ts — VOICE_BUBBLE_CHANNELS
const VOICE_BUBBLE_CHANNELS = new Set(["telegram", "feishu", "whatsapp", "my-channel"]);
// → 自动使用 opus 格式
```

## 5. 测试

```bash
pnpm test -- src/channels/
pnpm test -- src/routing/
```
