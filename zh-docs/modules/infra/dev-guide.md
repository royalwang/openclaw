# 基础设施开发指南

> 如何使用执行安全、网络工具、临时文件管理、进程控制。

## 1. 项目结构

```
src/infra/
├── exec-safe-bin-*.ts     # 安全二进制执行
├── net/
│   ├── ssrf.ts            # SSRF 防护
│   └── ...                # 网络工具
├── tmp-openclaw-dir.ts    # 临时目录管理
└── ...

src/process/               # 进程管理
├── manager.ts             # 进程管理器
└── signals.ts             # 信号处理
```

## 2. 安全执行

```typescript
// exec-safe-bin-runtime-policy.ts
// 只允许执行白名单中的二进制文件
const safeBins = listInterpreterLikeSafeBins();
// 白名单目录由 normalizeTrustedSafeBinDirs() 解析
```

## 3. SSRF 防护

```typescript
import { isBlockedHostnameOrIp } from "../infra/net/ssrf.js";
// 检测并阻止对内网地址的请求
if (isBlockedHostnameOrIp(hostname)) throw new Error("SSRF blocked");
```

## 4. 临时文件

```typescript
import { resolvePreferredOpenClawTmpDir } from "../infra/tmp-openclaw-dir.js";
const tmpDir = resolvePreferredOpenClawTmpDir();
// 自动在 ~/.openclaw/tmp/ 创建并清理
```

## 5. 测试

```bash
pnpm test -- src/infra/
pnpm test -- src/process/
```
