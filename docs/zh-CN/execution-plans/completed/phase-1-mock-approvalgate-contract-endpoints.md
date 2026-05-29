# Phase 1: Mock ApprovalGate Contract Endpoints 计划

## 状态

Completed

2026-05-26：human owner 要求继续推进工程主线。本计划承接 mock v1 WorkItem endpoints 和 control-plane contract primitives，落地最小 mock `ApprovalGate` 契约端点，补齐高风险 WorkItem 被拦截后的下一环。

2026-05-26：本计划已归档。Go control-plane 已提供 deterministic mock ApprovalGate 创建、读取和决策端点，并保持无数据库、无真实审批队列、无 Temporal 和无外部副作用。

## 目标

- 实现 mock endpoints：
  - `POST /api/v1/approvals`
  - `GET /api/v1/approvals/{approvalId}`
  - `POST /api/v1/approvals/{approvalId}/decide`
- 复用 `internal/contracts/v1` 的 `RequestMeta`、`ActorRef`、risk 和 data classification 校验。
- 成功响应使用 `{ data, meta, audit }`；错误响应使用 `{ error, audit? }`。
- 只返回 deterministic mock 响应，不创建真实审批任务、不写数据库、不触发 Temporal。
- 只使用已登记事件预览：`approval.requested` 和 `approval.decided`。

## 非目标

- 不实现真实审批队列、超时、通知、权限系统、数据库、幂等键存储或回滚执行。
- 不启用真实 connector、secret、生产数据、模型调用或外部写入。
- 不替代 human owner，也不让 approval mock 成为生产事实。

## 请求边界

`POST /api/v1/approvals`：

- `meta` 必填：`requestId`、`idempotencyKey`、`env`、`actorType`、`actorId`、`projectInstanceId`、`workItemId`。
- `data` 必填：`riskLevel`、`requestedAction`、`requestPayloadRef`、`policyEvaluationId`、`rollbackRef`。
- `riskLevel` 受控为 `low`、`medium`、`high`、`critical`。

`POST /api/v1/approvals/{approvalId}/decide`：

- `meta` 必填同创建请求；路径 `approvalId` 必须非空。
- `data.decision` 只允许 `approve`、`reject`、`edit_and_approve`、`escalate`。
- `data.decisionReason` 必填。
- `edit_and_approve` 必须提供 `editedPayloadRef`。

## 审计与事件语义

- 创建请求返回 `approval.requested` 预览，不代表事件已入队。
- 决策请求返回 `approval.decided` 预览，不代表真实审批流完成。
- 审计引用使用本地 deterministic mock id。

## 验证计划

```text
pnpm check:go
pnpm check
git diff --check
```

## 验收标准

- 三个 mock endpoints 均有测试覆盖成功、校验失败和路径一致性。
- `/metadata` 自动列出 Approval endpoints。
- 不引入真实审批、数据库、Temporal、connector 或模型调用。
- 文档同步说明 mock-only 边界。

## 实际交付物

- `apps/control-plane/internal/modules/approvals` 实现 mock `POST /api/v1/approvals`、`GET /api/v1/approvals/{approvalId}` 和 `POST /api/v1/approvals/{approvalId}/decide`。
- ApprovalGate mock 复用 `internal/contracts/v1` 的请求 meta、risk level 和 actor 边界。
- `/metadata` 通过 route descriptor 自动列出 Approval endpoints。
- 测试覆盖创建、读取、决策、缺失字段和 `edit_and_approve` 缺失 `editedPayloadRef`。

## 偏差

- 未实现真实审批队列、超时策略、通知、权限校验或持久化。
- 未让 ApprovalGate mock 修改 WorkItem 状态；当前只返回 mock 决策响应和事件预览。

## 剩余风险和后续事项

- 真实 ApprovalGate 服务需要单独计划，包含审批队列、权限、审计写入、超时、通知、回滚引用不可变和状态持久化。
- ReportCard / AgentRun 仍未接入 Go control-plane。

## 验证记录

- `pnpm check:go`
- `pnpm check`
- `git diff --check`
