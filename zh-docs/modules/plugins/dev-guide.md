# 插件系统开发指南

> 如何开发 OpenClaw 插件、注册工具/渠道/Provider、发布插件。

## 1. 项目结构

```
src/plugins/
├── loader.ts            # 插件加载器核心（1304L）
├── runtime.ts           # 插件运行时工厂
├── registry.ts          # PluginRegistry
├── provenance.ts        # 溯源追踪
├── sdk/                 # 插件 SDK
└── types.ts             # 类型定义

src/plugin-sdk/          # 公共 SDK 接口
├── index.ts             # 主导出
├── reply-payload.ts     # 回复负载
└── <subpath>/           # 各模块子路径
```

## 2. 创建新插件

### 最小插件结构

```
your-plugin/
├── package.json
├── src/
│   └── index.ts         # 主入口
└── tsconfig.json
```

### package.json

```json
{
  "name": "openclaw-plugin-your-name",
  "version": "1.0.0",
  "main": "src/index.ts",
  "dependencies": {},
  "devDependencies": {
    "openclaw": "workspace:*"
  }
}
```

### 插件入口

```typescript
// src/index.ts
import type { PluginDefinition } from "openclaw/plugin-sdk";

export default {
  id: "your-plugin",
  name: "Your Plugin",
  version: "1.0.0",

  register(api) {
    // 注册工具
    api.registerTool({
      name: "your_tool",
      description: "Your tool description",
      parameters: { type: "object", properties: { ... } },
      execute: async (params) => {
        return { result: "..." };
      },
    });

    // 注册渠道
    api.registerChannel({ ... });

    // 注册 AI Provider
    api.registerProvider({ ... });

    // 注册 Hook
    api.registerHook("message.before", async (event) => { ... });
  },
} satisfies PluginDefinition;
```

## 3. 插件加载优先级

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 0 | config `loadPaths` | 配置中显式指定 |
| 1 | global + install | 全局目录 + 安装记录 |
| 2 | bundled | 内置插件 |
| 3 | workspace | 工作区本地 |
| 4 | global (no install) | 全局目录无安装记录 |

## 4. SDK 导入规则

```typescript
// ✅ 正确：通过公共 SDK 路径
import { ... } from "openclaw/plugin-sdk";
import { ... } from "openclaw/plugin-sdk/reply-payload";

// ❌ 错误：直接导入核心源码
import { ... } from "../../src/config/config.js";

// ❌ 错误：导入其他插件的内部代码
import { ... } from "../other-plugin/src/internal.js";
```

## 5. 插件配置 Schema

```typescript
export default {
  // ...
  configSchema: {
    type: "object",
    properties: {
      apiKey: { type: "string", description: "API密钥" },
      timeout: { type: "number", default: 30000 },
    },
    required: ["apiKey"],
  },
  register(api) {
    const config = api.getPluginConfig();
    // config 已经过 JSON Schema 校验
  },
};
```

## 6. 渠道插件 Setup 模式

如果渠道插件有轻量级 setup 入口：
```typescript
export default {
  // ...
  setupSource: "./setup.ts",  // setup-only 入口
  register(api) { ... },      // 完整运行时
};
// 当渠道未启用时，仅加载 setupSource
```

## 7. 安装与测试

```bash
# 安装插件
openclaw plugins install ./path/to/your-plugin

# 测试插件
pnpm test -- extensions/your-plugin/
```

## 8. 安全注意事项

- 插件白名单：`plugins.allow` 为空时自动加载所有非内置插件（会有警告）
- 溯源追踪：非内置插件的加载路径会被记录并审计
- 运行时隔离：插件通过 Jiti 加载，支持 TypeScript 免编译
