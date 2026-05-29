# Phase 1: Control Plane Contract Primitives 计划

## 状态

Completed

2026-05-26：human owner 要求继续推进，并强调代码要高内聚、低冗余、可扩展。本计划承接 mock v1 WorkItem endpoints，先做窄范围重构，避免后续 ApprovalGate、ProjectInstance 或 ReportCard mock endpoints 复制同一套 v1 meta、actor、risk 和 data classification 校验。

2026-05-26：本计划已归档。Go control-plane 已抽出共享 v1 contract primitives，修正 mock 幂等 ID，区分 policy outcome，并用 route descriptor 统一 HTTP 注册与 `/metadata`。

## 背景和问题陈述

当前 `apps/control-plane/internal/modules/work/handler.go` 同时承载 HTTP 解码、v1 contract 类型、字段校验、mock ID、策略映射、审计引用和响应写入。继续扩展 ApprovalGate 或其它模块时，会复制 `RequestMeta`、`Actor`、`riskLevel`、`dataClassification` 等通用概念，并可能让 route 注册和 `/metadata` endpoint 清单漂移。

## 目标

- 抽出共享 v1 contract primitives：
  - `RequestMeta`
  - `ActorRef`
  - `RiskLevel`
  - `DataClassification`
  - 通用 validation issue 和枚举校验
- 修正 mock WorkItem ID 的幂等语义：同一 `projectInstanceId + idempotencyKey + title` 应得到同一 mock ID，不因 `requestId` 变化而改变。
- 区分 policy decision outcome：`allowed`、`approval_required`、`policy_violation`。
- 用单一路由 descriptor 同时驱动 mux 注册和 service metadata，减少重复 endpoint 清单。
- 保持 mock-only，无数据库、无真实 ApprovalGate、无真实 connector、无模型调用。

## 非目标

- 不新增 `ApprovalGate` API。
- 不引入数据库、幂等键存储、Temporal、Keycloak、LiteLLM 或真实 Rust kernel 集成。
- 不改变公开 v1 WorkItem endpoint 路径。
- 不改变 Demo Mode 和 Web Workbench 行为。

## 影响范围

- `apps/control-plane/internal/contracts/v1`
- `apps/control-plane/internal/modules/work`
- `apps/control-plane/internal/policy`
- `apps/control-plane/internal/http`
- `apps/control-plane/internal/platform`
- `apps/control-plane/README.md`
- `docs/zh-CN/api-contracts.md`
- `docs/zh-CN/developer-experience.md`
- `docs/zh-CN/project-operating-entry.md`

## 验证计划

```text
pnpm check:go
pnpm check
git diff --check
```

## 验收标准

- WorkItem handler 不再定义私有 `requestMeta`、`Actor`、risk/data classification 枚举校验。
- 同一 `idempotencyKey` 在不同 `requestId` 下生成稳定 mock WorkItem ID。
- policy fake 能区分 `approval_required` 和 `policy_violation`，WorkItem handler 映射到不同错误码。
- `/metadata` endpoint 列表来自同一份 route descriptor。
- `pnpm check` 通过。

## 实际交付物

- `apps/control-plane/internal/contracts/v1`：共享 `RequestMeta`、`ActorRef`、risk / data classification 枚举和校验。
- `apps/control-plane/internal/policy`：deterministic fake decision outcome 区分 `allowed`、`approval_required` 和 `policy_violation`。
- `apps/control-plane/internal/modules/work`：复用共享 v1 primitives，修正 mock WorkItem ID 派生规则，并分开处理 `approval_required` 与 `policy_violation`。
- `apps/control-plane/internal/http/routes.go`：用 route descriptor 同时驱动 mux 注册和 metadata endpoints。

## 偏差

- 未新增 mock `ApprovalGate` endpoints；本轮只做扩展前的内聚性重构。
- 未拆分 WorkItem handler 到多个文件；先消除跨模块最容易复制的 contract primitives 和 endpoint 清单重复。

## 剩余风险和后续事项

- 下一轮 mock `ApprovalGate` 前应复用 `internal/contracts/v1`，并继续避免真实审批、数据库或 Temporal 语义。
- 真实幂等键存储仍未实现；当前只是 deterministic mock ID。
- 真实 Rust kernel 集成仍需独立计划。

## 验证记录

- `pnpm check:go`
- `pnpm check`
- `git diff --check`
