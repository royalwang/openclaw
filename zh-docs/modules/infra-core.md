# 模块分析：基础设施 (Infra Core)

## 概览 — `src/infra/` (393 文件) ⭐ 第二大模块

基础设施模块提供系统级服务：执行审批、心跳监控、服务发现、自动更新、文件系统安全、进程管理等。

```mermaid
graph TB
  subgraph "执行审批系统"
    EA["exec-approvals.ts (17KB)<br/>审批引擎"]
    EA_ALLOW["exec-approvals-allowlist.ts (17KB)<br/>白名单"]
    EA_ANAL["exec-approvals-analysis.ts (22KB)<br/>命令分析"]
    EA_SAFE["exec-safe-bin-policy.ts<br/>安全命令策略"]
    EA_CMD["exec-command-resolution.ts (6KB)<br/>命令解析"]
    EA_OBF["exec-obfuscation-detect.ts (6KB)<br/>混淆检测"]
  end

  subgraph "心跳系统"
    HB["heartbeat-runner.ts (39KB)<br/>心跳引擎"]
    HB_WAKE["heartbeat-wake.ts (7KB)<br/>唤醒检测"]
    HB_VIS["heartbeat-visibility.ts<br/>可见性"]
    HB_HOURS["heartbeat-active-hours.ts<br/>活跃时段"]
    HB_EVENTS["heartbeat-events.ts<br/>事件过滤"]
    HB_REASON["heartbeat-reason.ts<br/>触发原因"]
  end

  subgraph "自动更新"
    UPD_CHECK["update-check.ts (13KB)<br/>版本检查"]
    UPD_RUN["update-runner.ts (26KB)<br/>更新执行"]
    UPD_START["update-startup.ts (16KB)<br/>启动时检查"]
    UPD_GLOBAL["update-global.ts (8KB)<br/>全局更新"]
    UPD_CH["update-channels.ts<br/>渠道管理"]
  end

  subgraph "服务发现"
    BONJOUR["bonjour.ts (11KB)<br/>mDNS 服务发布"]
    BON_DISC["bonjour-discovery.ts (16KB)<br/>服务发现"]
    TAILSCALE["tailscale.ts (15KB)<br/>Tailscale 集成"]
    WIDEAREA["widearea-dns.ts (6KB)<br/>广域 DNS"]
  end

  subgraph "文件系统安全"
    FS_SAFE["fs-safe.ts (25KB)<br/>安全文件操作"]
    FS_PIN["fs-pinned-write-helper.ts (7KB)<br/>固定写入"]
    SAFE_OPEN["safe-open-sync.ts (3KB)<br/>安全打开"]
    HARDLINK["hardlink-guards.ts<br/>硬链接防护"]
    PATH_GUARD["path-guards.ts<br/>路径安全"]
  end

  subgraph "进程与系统"
    LOCK["gateway-lock.ts (7KB)<br/>网关锁"]
    RESTART["restart.ts (15KB)<br/>重启管理"]
    RESPAWN["process-respawn.ts<br/>进程重生"]
    SUPERVISOR["supervisor-markers.ts<br/>监控标记"]
    SHELL_ENV["shell-env.ts (6KB)<br/>Shell 环境"]
  end
```

### 执行审批系统

保护系统免受 Agent 执行危险命令的核心机制：

```mermaid
flowchart TD
    CMD["Agent 请求执行命令"] --> RESOLVE["exec-command-resolution.ts<br/>解析命令"]
    RESOLVE --> OBF{"混淆检测<br/>exec-obfuscation-detect.ts"}
    OBF -->|检测到混淆| DENY["拒绝执行"]
    OBF -->|安全| ANALYSIS["exec-approvals-analysis.ts (22KB)<br/>命令风险分析"]
    ANALYSIS --> SAFE{"安全命令?<br/>exec-safe-bin-policy"}
    SAFE -->|在安全清单内| EXEC["直接执行"]
    SAFE -->|不在清单| ALLOWLIST{"白名单匹配?"}
    ALLOWLIST -->|匹配| EXEC
    ALLOWLIST -->|不匹配| APPROVE["请求人工审批"]
    APPROVE --> USER["转发给用户"]
    USER -->|批准| EXEC
    USER -->|拒绝| DENY
```

### 心跳系统

`heartbeat-runner.ts`（39KB）实现后台心跳监控：

- 定期检查 Agent 健康状态
- 活跃时段控制（`heartbeat-active-hours.ts`）
- 唤醒检测（`heartbeat-wake.ts`）
- 事件过滤与汇总（`heartbeat-events-filter.ts`）
- 重影提醒（`ghost-reminder`）

### 服务发现

| 方案         | 文件                                  | 场景           |
| ------------ | ------------------------------------- | -------------- |
| mDNS/Bonjour | `bonjour.ts` + `bonjour-discovery.ts` | 局域网自动发现 |
| Tailscale    | `tailscale.ts` (15KB)                 | 跨网络 VPN     |
| 广域 DNS     | `widearea-dns.ts`                     | 互联网级发现   |

### 自动更新

`update-runner.ts`（26KB）管理自动更新生命周期：

- 版本检查（`update-check.ts` 13KB）
- 包下载与验证
- 原子更新与回滚
- 启动时更新检查（`update-startup.ts` 16KB）
- 更新渠道管理（stable/beta/dev）

### 文件系统安全

`fs-safe.ts`（25KB）包装所有文件操作确保安全：

- 原子写入（防止写入中断导致数据损坏）
- 路径安全检查（防止路径遍历攻击）
- 硬链接防护
- 临时文件安全管理

### 其他核心设施

| 文件                           | 功能                    |
| ------------------------------ | ----------------------- |
| `gateway-lock.ts` (7KB)        | 防止多 Gateway 实例并发 |
| `restart.ts` (15KB)            | 平滑重启策略            |
| `state-migrations.ts` (31KB)   | 状态数据迁移            |
| `push-apns.ts` (28KB)          | Apple Push 通知         |
| `session-cost-usage.ts` (31KB) | 会话成本追踪            |
| `device-pairing.ts` (21KB)     | 设备配对                |
