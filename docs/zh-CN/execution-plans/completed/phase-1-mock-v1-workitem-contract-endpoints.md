# Phase 1: Mock v1 WorkItem Contract Endpoints 计划

## 状态

Completed

2026-05-26：human owner 要求继续工程主线；本计划承接 Go Core Control Plane skeleton，在不引入真实认证、数据库、外部 connector、模型调用或生产数据的前提下，落地第一组 mock v1 contract endpoints。

2026-05-26：本计划已归档。`apps/control-plane` 已实现 mock v1 `WorkItem` 创建、读取和状态迁移端点，并保留 mock-only、审批拦截、审计引用和无持久化边界。

## 背景和问题陈述

`apps/control-plane` 已提供 Go 标准库 HTTP skeleton、`/healthz`、`/metadata`、审计引用 header、统一响应工具和 deterministic fake policy kernel。下一步需要把 `docs/zh-CN/api-contracts.md` 中的 `WorkItem API` 转化为最小可运行 mock，以验证控制面接口封套、请求元数据、审批拦截和审计引用。

本计划只实现本地 mock contract，不建立生产事实来源。所有返回的 `WorkItem` 都是请求派生或内存内 fixture，不具备持久化语义。

## 目标

- 实现最小 `WorkItem` mock endpoints：
  - `POST /api/v1/work-items`
  - `GET /api/v1/work-items/{workItemId}`
  - `POST /api/v1/work-items/{workItemId}/transition`
- 保持统一响应封套：成功响应包含 `data`、`meta` 和 `audit`。
- 保持错误响应封套：错误响应包含 `error.code`、`error.message` 和可选 `error.details`。
- 对写请求校验 `meta.requestId`、`meta.idempotencyKey`、`meta.env`、`meta.actorType`、`meta.actorId`、`meta.projectInstanceId`。
- 对高风险或敏感数据请求调用 deterministic fake policy，命中时返回 `approval_required`，并提供 `approvalGateRequired: true`。
- 在 `metadata` 中登记 mock endpoints，明确 `mockOnly: true`。

## 非目标

- 不实现真实 Keycloak token 校验、RBAC、数据库、迁移、幂等键存储或跨请求持久化。
- 不创建真实 `ApprovalGate`、issue、PR、Temporal workflow、LangGraph state、模型调用或外部 connector run。
- 不实现 `assign`、`close` 或列表查询。
- 不让 Go 控制面执行 agent reasoning graph。

## 请求边界

`POST /api/v1/work-items` 请求体：

- `meta` 必填：`requestId`、`idempotencyKey`、`env`、`actorType`、`actorId`、`projectInstanceId`。
- `data` 必填：`title`、`requestedBy.actorType`、`requestedBy.actorId`、`riskLevel`。
- `data.riskLevel` 仅接受 `low`、`medium`、`high`、`critical`。
- `data.dataClassification` 仅接受 `public`、`internal`、`restricted`、`sensitive`，缺省为 `internal`。
- `data.assignedActor` 可选，但必须区分 `HumanActor` 与 `AgentActor`。

`POST /api/v1/work-items/{workItemId}/transition` 请求体：

- `meta` 边界同创建请求，且 `meta.workItemId` 如存在必须与路径一致。
- `data.transition` 必填；首期仅允许 `start`、`block`、`complete`。
- `data.reason` 在 `block` 中必填；`meta.reason` 在高风险上下文中必填。

## 响应边界

成功响应：

- `data.workItemId` 为 deterministic mock ID 或路径 ID。
- `data.status` 使用 mock 状态：`open`、`in_progress`、`blocked`、`completed`。
- `meta.requestId` 来自请求；`meta.env` 来自服务端运行模式映射；`meta.version` 为 `v1`；`meta.mockOnly` 为 `true`。
- `audit.auditEventId` 和 `audit.policyEvaluationId` 为本地 deterministic 引用。

错误响应：

- `validation_failed`：请求结构、必填字段、枚举或路径不一致。
- `approval_required`：高风险或敏感数据命中 fake policy。
- 错误响应不得泄漏敏感字段原文。

## 事件语义

本计划不发布异步事件，只在同步响应中返回 `eventsPreview`，用于描述如果接入事件总线将产生的事件：

- 创建成功：`task.created`
- 高风险或敏感数据被拦截：`approval.requested`
- 状态迁移当前只记录同步响应和审计引用；现有事件目录未登记 WorkItem 状态迁移事件，因此不新增事件名。

`eventsPreview` 是 mock review material，不代表事件已经入队或被消费者处理。

## 审计点

- WorkItem 创建请求接收、校验结果和 mock 创建结果。
- fake policy evaluation 结果和拦截原因。
- 状态迁移请求、路径一致性校验和 mock transition 结果。
- `approval_required` 响应必须保留 `audit.policyEvaluationId` 和 `approvalGateRequired`。

## 影响范围

- `apps/control-plane/internal/modules/work`
- `apps/control-plane/internal/http/server.go`
- `apps/control-plane/internal/platform`
- `apps/control-plane/README.md`
- `docs/zh-CN/api-contracts.md`
- `docs/zh-CN/project-operating-entry.md`
- `docs/zh-CN/execution-plans/README.md`

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| mock endpoint 被误认为生产 API | README、metadata 和响应 `mockOnly` 均声明 mock-only |
| 内存状态被误认为持久化 | 不做跨请求存储；读取 endpoint 只返回 deterministic fixture |
| Go 重复实现治理规则 | 只调用 `internal/policy` fake adapter，复杂治理仍留给 Rust kernel / contract kernel 后续计划 |
| 状态迁移语义过早扩大 | 首期只允许 `start`、`block`、`complete`，其它返回 `validation_failed` |

## 验证计划

至少运行：

```text
pnpm check:go
pnpm check
git diff --check
```

## 验收标准

- 三个 mock endpoints 均有单元测试覆盖成功路径、校验失败和 approval-required。
- `metadata` 正确列出 mock endpoints 且 `mockOnly` 仍为 `true`。
- 响应封套包含 `data`、`meta`、`audit`；错误封套包含 `error`。
- `pnpm check` 通过。
- 完成后将本计划归档到 `completed/`，并记录实际交付、偏差和剩余风险。

## 实际交付物

- `apps/control-plane/internal/modules/work` 实现 mock `POST /api/v1/work-items`、`GET /api/v1/work-items/{workItemId}` 和 `POST /api/v1/work-items/{workItemId}/transition`。
- `apps/control-plane/internal/platform` 增加统一响应封套、错误封套、审计引用和 runtime env helper。
- `apps/control-plane/internal/http/server.go` 注册 mock v1 WorkItem routes，并在 `/metadata` 中列出端点。
- `apps/control-plane/README.md`、`docs/zh-CN/api-contracts.md`、`docs/zh-CN/developer-experience.md` 和 Web Workbench 文案同步 mock-only 边界。

## 偏差

- 读取 endpoint 不实现 `not_found`；首期所有非空路径 ID 都派生 deterministic mock fixture，以避免引入存储或跨请求状态。
- 状态迁移不返回 `eventsPreview`，因为当前事件目录没有登记 WorkItem 状态迁移事件名。

## 剩余风险和后续事项

- 真实 `ApprovalGate` 创建、幂等键存储、数据库持久化、认证授权、Temporal、LiteLLM、Keycloak 和真实 Rust kernel 集成仍需独立计划。
- 当前 policy kernel 仍是 deterministic fake，不得解释为生产治理内核。

## 验证记录

- `pnpm check:go`
- `pnpm check`
- `git diff --check`
