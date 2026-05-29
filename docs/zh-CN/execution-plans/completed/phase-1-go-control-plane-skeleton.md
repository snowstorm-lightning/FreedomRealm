# Phase 1: Go Core Control Plane Skeleton 计划

## 状态

Completed

2026-05-26，human owner 明确要求继续工程主线，并接受保守默认决策：Go module path 使用仓库内 `freedomrealm/apps/control-plane`，HTTP 层优先使用标准库，Rust kernel 首期只接窄接口 deterministic fake，首期 endpoint 只暴露 health / metadata，本地存储暂不持久化。

## 背景和问题陈述

ADR-0010 已接受长期生产 Core Control Plane 默认采用 Go，Rust 用于 Policy / Contract / Protocol Kernel。当前仓库已经有 TypeScript Demo / Web / contracts / policy 基础，以及不接入生产路径的 Rust policy kernel skeleton，但还没有 Go 控制面 skeleton 的受控执行计划。

本计划用于定义 Go 控制面最小初始化边界，避免直接创建空目录或过早承诺生产 API。实施时只落地最小 skeleton，不启用生产 API、真实 connector、secret、模型调用或持久化写入。

## 目标

- 定义首个 Go 控制面 skeleton 的最小目录、模块边界、测试和验证命令。
- 保持控制面是事实、权限、审批、审计、ProjectInstance、WorkItem、ReportCard 和 Federation Gateway 的服务主干。
- 保持 Agent Runtime、LangGraph 状态化推理、Temporal 长流程、LiteLLM Proxy 和 Rust policy kernel 的边界清晰。
- 支持 Windows 个人用户、Tiny Mode、Demo Mode 和 Local Mode 的单二进制、本地 SQLite / 文件存储和 mock-first 路径。

## 非目标

- 不实现 HR 主数据 API、登录、多租户、数据库迁移或生产服务。
- 不调用真实模型、真实外部 connector、secret、生产数据或云服务。
- 不让 Go 控制面复制 Rust Policy / Contract / Protocol Kernel 的高治理规则。
- 不让控制面承载 agent 推理图执行逻辑。

## 实际最小目录

实际采用标准库优先的模块化单体：

```text
apps/control-plane/
  go.mod
  cmd/control-plane/main.go
  internal/app/app.go
  internal/http/server.go
  internal/http/health.go
  internal/config/config.go
  internal/audit/audit.go
  internal/policy/kernel.go
  internal/platform/errors.go
  internal/platform/response.go
  internal/platform/meta.go
  internal/modules/instances/handler.go
  internal/modules/work/handler.go
  internal/modules/approvals/handler.go
  internal/modules/reports/handler.go
  internal/modules/federation/handler.go
```

首批测试：

```text
internal/http/server_test.go
internal/platform/response_test.go
internal/platform/meta_test.go
internal/modules/work/handler_test.go
internal/modules/approvals/handler_test.go
internal/modules/federation/handler_test.go
internal/policy/kernel_test.go
```

## 边界约束

- Go 控制面可以拥有 request metadata、response envelope、audit refs、idempotency key、模块路由和受控状态推进。
- Go 控制面不能直接执行 agent reasoning graph，不能直接持有模型供应商 key，不能绕过 LiteLLM Proxy / ModelRoute。
- Go 控制面不能绕过 Rust policy kernel；首期只能通过 `internal/policy/kernel.go` 定义窄接口和 deterministic fake，用于后续 CLI、FFI、sidecar、WASM 或 generated bindings 决策。
- 所有写 API 必须设计幂等、审计、回滚和 ApprovalGate 入口。
- `WorkItem`、`ApprovalGate`、`ExecutionReportCard`、`ProjectInstance`、`FederationMessage` 和 `DataClassification` 术语必须沿用现有文档。

## 验证计划

本计划落地为代码后，至少运行：

```text
pnpm check:go
pnpm validate:workspace
pnpm check
```

如果引入数据库、Docker、Temporal、LiteLLM 或 Keycloak，必须新增单独 execution plan 或更新本计划，并说明回滚方式。

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 过早选择 HTTP 框架锁死 API 风格 | skeleton 阶段标准库优先；框架选择单独记录 |
| Go 复制 Rust 治理规则 | Go 只定义 policy kernel adapter，复杂校验留给 Rust |
| 创建空目录导致项目腐烂 | 目录创建必须同时包含 README、测试和可运行入口 |
| Tiny / Local Mode 被企业栈阻塞 | 首期 health / metadata / mock contract endpoints 不依赖外部服务 |
| 控制面变成 agent runtime | 保持 Temporal / LangGraph / Agent Runtime 边界，不在控制面执行推理图 |

## Human Owner 决策点

- Go module import path：`freedomrealm/apps/control-plane`。
- HTTP 框架：标准库优先。
- Rust kernel 集成方式：首期只用窄接口 deterministic fake，真实 CLI / FFI / sidecar / WASM / generated bindings 另开计划。
- 首期 endpoint 范围：只暴露 `/healthz` 和 `/metadata`。
- 本地存储：暂不持久化。

## 实际交付物

- `apps/control-plane` Go module。
- 标准库 HTTP server 和 `/healthz`、`/metadata`。
- request audit ref header、response envelope、service metadata 和 deterministic policy kernel fake。
- `instances`、`work`、`approvals`、`reports`、`federation` 模块 handler 占位，默认返回 disabled problem response。
- `scripts/check-go.mjs`，并纳入 `pnpm check`。
- CI 增加 Go toolchain setup。

## 偏差

- 原计划在进入实现前不创建 `apps/control-plane`；本轮 human owner 明确要求继续工程主线后，按计划中的保守默认完成最小实现。
- 首期没有加入 mock v1 contract endpoints，避免过早承诺 API shape。
- 未引入 `go.work`，也未把 Go 服务加入 pnpm workspace，避免误判为 Node workspace。

## 剩余风险和后续事项

- mock v1 WorkItem contract endpoints 已由 [phase-1-mock-v1-workitem-contract-endpoints.md](phase-1-mock-v1-workitem-contract-endpoints.md) 完成；后续新增其它 mock 或生产接口仍必须先定义请求边界、响应边界、事件语义和审计点。
- 真实 Rust kernel 集成方式仍需单独计划；当前 fake 不得被解释为生产治理内核。
- 数据库、Temporal、LiteLLM、Keycloak、真实 connector 和生产模型调用仍在本计划范围外。

## 验收标准

- skeleton 目录不是空目录，必须有可运行入口、README、测试和明确边界。
- `go test ./...` 通过。
- `pnpm validate:workspace` 能识别 Go 服务目录，且不把它误判为 Node workspace。
- 文档明确该 skeleton 不启用生产 API、真实 connector、secret 或模型调用。
- 不改变 MVP Demo Mode 和 Web Workbench 的通过标准。
