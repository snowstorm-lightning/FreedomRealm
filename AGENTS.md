# AGENTS.md

本文件是 AI HRMS 仓库中的 agent 工作入口，而不是完整手册。更详细的业务、架构、流程、评测和安全信息全部在 `docs/zh-CN/` 中维护。

## Agent Working Rules

1. 以仓库文档为 system of record，优先读取本仓库而不是假设外部上下文。
2. 先查导航文档，再进入对应专题文档；不要把单个文件当作全局真相。
3. 任何影响架构、治理、评测或发布规则的改动，都必须同步更新相关文档。
4. 任何自治能力都必须经过评测、审批、审计和回滚设计，不能绕过人类闸门。
5. 文档中的接口名、事件名、角色名必须保持一致；不要引入未登记的新术语。

## Recommended Read Order

1. [README.md](README.md)
2. [ARCHITECTURE.md](ARCHITECTURE.md)
3. [docs/zh-CN/README.md](docs/zh-CN/README.md)
4. 根据任务进入对应专题文档

## Knowledge Map

- 项目愿景与原则：[docs/zh-CN/vision-and-principles.md](docs/zh-CN/vision-and-principles.md)
- 业务蓝图：[docs/zh-CN/business-blueprint.md](docs/zh-CN/business-blueprint.md)
- 总体架构：[docs/zh-CN/architecture-blueprint.md](docs/zh-CN/architecture-blueprint.md)
- 人机协作流：[docs/zh-CN/collaboration-workflows.md](docs/zh-CN/collaboration-workflows.md)
- 接口契约：[docs/zh-CN/api-contracts.md](docs/zh-CN/api-contracts.md)
- 学习与自进化：[docs/zh-CN/learning-flywheel.md](docs/zh-CN/learning-flywheel.md)
- 安全治理：[docs/zh-CN/security-and-governance.md](docs/zh-CN/security-and-governance.md)
- 部署运维：[docs/zh-CN/deployment-and-operations.md](docs/zh-CN/deployment-and-operations.md)
- Harness 工程方式：[docs/zh-CN/harness-engineering.md](docs/zh-CN/harness-engineering.md)
- 质量门禁：[docs/zh-CN/quality-gates.md](docs/zh-CN/quality-gates.md)
- 路线图：[docs/zh-CN/roadmap.md](docs/zh-CN/roadmap.md)
- 术语表：[docs/zh-CN/glossary.md](docs/zh-CN/glossary.md)
- ADR 索引：[docs/zh-CN/adr/README.md](docs/zh-CN/adr/README.md)
- 执行计划索引：[docs/zh-CN/execution-plans/README.md](docs/zh-CN/execution-plans/README.md)
- 评测基线：[docs/zh-CN/evals/baseline-v1.md](docs/zh-CN/evals/baseline-v1.md)

## Mandatory Invariants

- 控制面不直接承载 agent 推理图执行逻辑。
- 长流程编排由 Temporal 承担，agent 内部状态化推理由 LangGraph 承担。
- 所有模型调用必须经 LiteLLM Proxy，接受策略、预算和审计控制。
- 所有高风险动作必须存在 `ApprovalGate`。
- 所有新增接口必须同时定义请求边界、响应边界、事件语义和审计点。
