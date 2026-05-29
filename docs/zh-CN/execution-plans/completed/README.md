# Completed Plans

本目录保存已经从 `active/` 归档的复杂执行计划。归档计划保留结果摘要、偏差、剩余风险和后续事项，不能直接删除。

## 已归档计划

| 计划 | 完成日期 | 验收依据 | 后续事项 |
| --- | --- | --- | --- |
| [phase-0-doc-foundation.md](phase-0-doc-foundation.md) | 2026-05-19 | human owner 批准清理 active execution plans，并以 `pnpm check` 作为归档验证 | 后续架构、治理、接口、评测或运行规则变化继续同步专题文档与 ADR |
| [phase-0-5-freedomrealm-repositioning.md](phase-0-5-freedomrealm-repositioning.md) | 2026-05-19 | human owner 批准清理 active execution plans，并以 `pnpm check` 作为归档验证 | LICENSE / 商标策略、P2 live connectors、真实 Federation 互操作测试和社区贡献闭环仍需后续决策 |
| [phase-0-6-web-workbench-mvp.md](phase-0-6-web-workbench-mvp.md) | 2026-05-17 | `user-approved-continuation-20260517`，并以 `pnpm validate:operating-entry`、`pnpm check` 作为归档验证 | P1 connector governance sync、P1 decay prevention backlog、P1 template evaluation samples、P2 live connectors 审批路径 |
| [phase-0-7-open-source-contribution-foundation.md](phase-0-7-open-source-contribution-foundation.md) | 2026-05-26 | human owner 要求推进到开源可用；`pnpm validate:open-source`、`pnpm check` 和 `git diff --check` 作为验收依据 | 最终 LICENSE、商标策略、官方兼容认证、Commons 资产撤回自动化和真实发布流程仍需后续人工决策 |
| [phase-1-environment-isolation-guard.md](phase-1-environment-isolation-guard.md) | 2026-05-19 | human owner 批准清理 active execution plans，并以 `pnpm check` 作为归档验证 | Go 控制面 skeleton、数据库、Temporal、LiteLLM、Keycloak 和生产模型网关仍需独立计划与审批 |
| [phase-1-go-control-plane-skeleton.md](phase-1-go-control-plane-skeleton.md) | 2026-05-26 | human owner 要求继续工程主线；`pnpm check:go`、`pnpm validate:workspace` 和 `pnpm check` 作为验收依据 | mock v1 WorkItem endpoints 已由后续计划完成；真实 Rust kernel 集成、数据库、Temporal、LiteLLM、Keycloak 和真实 connector 仍需独立计划 |
| [phase-1-mock-v1-workitem-contract-endpoints.md](phase-1-mock-v1-workitem-contract-endpoints.md) | 2026-05-26 | human owner 要求继续工程主线；`pnpm check:go`、`pnpm check` 和 `git diff --check` 作为验收依据 | 真实 ApprovalGate、幂等键存储、数据库、Temporal、LiteLLM、Keycloak、真实 Rust kernel 集成和真实 connector 仍需独立计划 |
| [phase-1-control-plane-contract-primitives.md](phase-1-control-plane-contract-primitives.md) | 2026-05-26 | human owner 要求代码高内聚、低冗余、可扩展；`pnpm check:go`、`pnpm check` 和 `git diff --check` 作为验收依据 | mock ApprovalGate endpoints、真实幂等键存储、数据库和真实 Rust kernel 集成仍需独立计划 |
| [phase-1-mock-approvalgate-contract-endpoints.md](phase-1-mock-approvalgate-contract-endpoints.md) | 2026-05-26 | human owner 要求继续工程主线；`pnpm check:go`、`pnpm check` 和 `git diff --check` 作为验收依据 | 真实 ApprovalGate 服务、审批队列、通知、Temporal、数据库和权限系统仍需独立计划 |

归档计划应保留：

- 完成日期
- 实际交付物
- 与原计划的偏差
- 未解决风险
- 后续计划或 ADR 链接
- 验收人或验收依据
