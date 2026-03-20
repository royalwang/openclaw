# CLI 开发指南

> 如何添加 CLI 命令、使用 Progress UI、扩展 Onboarding 向导。

## 1. 项目结构

```
src/cli/
├── progress.ts           # 进度条/Spinner（osc-progress + @clack/prompts）
├── command-format.ts     # 命令格式化
└── ...

src/commands/
├── gateway.ts            # openclaw gateway run/stop/status
├── config.ts             # openclaw config set/get
├── send.ts               # openclaw message send
├── channels.ts           # openclaw channels status
├── security.ts           # openclaw security audit
├── onboard-*.ts          # Onboarding 命令
└── ...

src/wizard/
├── setup.ts              # 设置向导
├── onboard-*.ts          # Onboarding 流程
└── ...
```

## 2. 添加新 CLI 命令

```typescript
// src/commands/your-command.ts
import { defineCommand } from "../cli/command-format.js";

export default defineCommand({
  name: "your-command",
  description: "命令描述",
  options: {
    verbose: { type: "boolean", alias: "v", description: "详细输出" },
  },
  
  async execute(args, deps) {
    const config = await deps.loadConfig();
    // 实现命令逻辑
    console.log("Done!");
  },
});
```

## 3. Progress UI

```typescript
import { createProgress, createSpinner } from "../cli/progress.js";

// Spinner
const spinner = createSpinner("加载中...");
spinner.start();
// ... 操作 ...
spinner.stop("完成 ✓");

// 进度条
const progress = createProgress({ total: 100 });
for (let i = 0; i < 100; i++) {
  progress.update(i);
}
progress.done();
```

> ⚠ 禁止手写 Spinner/进度条，统一使用 `src/cli/progress.ts`。

## 4. 颜色调色板

```typescript
import { palette } from "../terminal/palette.js";
console.log(palette.primary("主色文字"));
console.log(palette.success("成功"));
console.log(palette.error("错误"));
```

> ⚠ 禁止硬编码 ANSI 颜色，使用 `src/terminal/palette.ts`。

## 5. 测试

```bash
pnpm test -- src/commands/
pnpm test -- src/cli/
pnpm test -- src/wizard/
```
