# 模块分析：安全模型 (Security Model)

## 概览 — `src/security/` (35 文件)

安全模块实现了 OpenClaw 的纵深防御体系，涵盖配置审计、命令执行审批、DM 策略、正则安全和外部内容防护。

```mermaid
graph TB
  subgraph "安全审计引擎"
    AUDIT["audit.ts (50KB)<br/>全面安全扫描"]
    AUDIT_CH["audit-channel.ts (35KB)<br/>渠道安全审计"]
    AUDIT_EX["audit-extra.sync.ts (48KB)<br/>扩展审计（同步）"]
    AUDIT_EA["audit-extra.async.ts (47KB)<br/>扩展审计（异步）"]
    AUDIT_FS["audit-fs.ts (5KB)<br/>文件系统审计"]
  end

  subgraph "DM 策略"
    DM["dm-policy-shared.ts (11KB)<br/>私聊策略共享逻辑"]
    DM_CH["per-channel smoke tests"]
  end

  subgraph "内容安全"
    EXT_CONT["external-content.ts (11KB)<br/>外部内容安全审查"]
    SAFE_RE["safe-regex.ts (9KB)<br/>正则表达式安全"]
    SCAN["scan-paths.ts<br/>路径扫描"]
  end

  subgraph "执行安全"
    DANGER_T["dangerous-tools.ts<br/>危险工具标记"]
    DANGER_C["dangerous-config-flags.ts<br/>危险配置标记"]
    MUTABLE["mutable-allowlist-detectors.ts<br/>可变白名单检测"]
  end

  subgraph "修复与加固"
    FIX["fix.ts (13KB)<br/>自动修复引擎"]
    SKILL_SC["skill-scanner.ts (15KB)<br/>技能安全扫描"]
    WIN_ACL["windows-acl.ts (10KB)<br/>Windows ACL"]
  end

  AUDIT --> AUDIT_CH & AUDIT_EX & AUDIT_EA & AUDIT_FS
  AUDIT --> DM & EXT_CONT & SAFE_RE
  AUDIT --> FIX
```

### 安全审计引擎

`audit.ts`（50KB，测试文件 116KB）是安全体系的核心：

```mermaid
flowchart TD
    CONFIG["加载配置"] --> SCAN["全面扫描"]
    SCAN --> CH_AUDIT["渠道安全<br/>audit-channel.ts"]
    SCAN --> FS_AUDIT["文件系统<br/>audit-fs.ts"]
    SCAN --> EXT_AUDIT["扩展审计<br/>audit-extra.*.ts"]

    CH_AUDIT --> DM_CHECK["DM 策略检查"]
    CH_AUDIT --> ALLOW_CHECK["白名单合规"]
    CH_AUDIT --> META["渠道元数据"]

    EXT_AUDIT --> REGEX["正则安全<br/>safe-regex.ts"]
    EXT_AUDIT --> CONTENT["外部内容<br/>external-content.ts"]
    EXT_AUDIT --> SKILL["技能扫描<br/>skill-scanner.ts"]
    EXT_AUDIT --> DANGER["危险标记检测"]

    SCAN --> REPORT["安全报告"]
    REPORT --> FIX_ENGINE["fix.ts (13KB)<br/>自动修复建议"]
```

### DM 策略

`dm-policy-shared.ts`（11KB）控制私聊行为：

- 哪些渠道允许私聊
- 私聊消息的权限级别
- 群组消息 vs 私聊的差异化处理
- 跨渠道策略一致性

### 正则表达式安全

`safe-regex.ts`（9KB）防止 ReDoS（正则表达式拒绝服务）攻击：

- 检测潜在的回溯爆炸模式
- 配置中用户提供的正则进行安全性验证
- 提供安全的替代方案

### 外部内容安全

`external-content.ts`（11KB）审查来自外部的内容：

- URL 安全性检查
- 注入攻击检测
- 内容长度限制
- 敏感信息泄漏预防

### 技能安全扫描

`skill-scanner.ts`（15KB）对工作区技能进行安全分析：

- 权限范围检查
- 文件系统访问审计
- 网络请求审计
- 危险操作检测

### Windows ACL 管理

`windows-acl.ts`（10KB）处理 Windows 平台特有的访问控制：

- 文件/目录权限设置
- 服务账户权限管理
- 配置文件保护

---

## 执行审批系统 — `src/infra/exec-approvals*`

与安全模块配合的命令执行审批体系（详见 [基础设施文档](./infra-core.md)）：

- 命令分类（安全/需审批/禁止）
- Safe-bin 策略配置
- 白名单模式匹配
- 审批流转与记录
