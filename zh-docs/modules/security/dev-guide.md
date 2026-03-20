# 安全模型开发指南

> 如何添加审计检查、扩展安全策略、实现新的安全防护。

## 1. 项目结构

```
src/security/
├── audit.ts                  # 主审计引擎（1319L）
├── audit.nondeep.runtime.ts  # 非深度检查模块
├── audit.deep.runtime.ts     # 深度检查模块（Gateway探测）
├── audit-channel.ts          # 渠道安全审计
├── audit-fs.ts               # 文件系统权限检查
├── audit-tool-policy.ts      # 工具策略审计
├── safe-regex.ts             # ReDoS 防护
├── dm-policy-shared.ts       # DM 策略
├── external-content.ts       # 外部内容安全
├── secret-equal.ts           # 时间安全比较
├── dangerous-config-flags.ts # 危险配置检测
├── dangerous-tools.ts        # 危险工具默认拒绝
├── skill-scanner.ts          # 技能文件扫描
└── windows-acl.ts            # Windows ACL
```

## 2. 添加新的审计检查

```typescript
// audit.ts — collectGatewayConfigFindings() 或新函数
findings.push({
  checkId: "your.check.id",          // 唯一标识
  severity: "critical",               // info | warn | critical
  title: "检查标题",
  detail: "详细描述...",
  remediation: "修复建议...",         // 可选
});
```

### 严重级别指南
- **critical**：数据泄露或未授权访问风险
- **warn**：潜在安全风险，但不直接导致漏洞
- **info**：信息性提示

## 3. 模块懒加载

安全模块使用懒加载减少启动开销：
```typescript
let auditDeepModulePromise: Promise<typeof import("./audit.deep.runtime.js")> | undefined;
async function loadAuditDeepModule() {
  auditDeepModulePromise ??= import("./audit.deep.runtime.js");
  return await auditDeepModulePromise;
}
```

## 4. 文件系统权限检查

```typescript
// audit-fs.ts
const perms = await inspectPathPermissions(targetPath, { platform });
// 检查: worldWritable, groupWritable, worldReadable, isSymlink
// 跨平台: POSIX stat() + Windows icacls
```

## 5. 测试

```bash
pnpm test -- src/security/
```
