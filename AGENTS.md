# AGENTS.md

本文件是 FreedomRealm 仓库中的 agent 工作入口，而不是完整手册。更详细的业务、架构、流程、评测、开源策略、社区治理和安全信息全部在 `docs/zh-CN/` 中维护。

## Agent Working Rules

1. 以仓库文档为 system of record，优先读取本仓库而不是假设外部上下文。
2. 先查导航文档，再进入对应专题文档；不要把单个文件当作全局真相。
3. 任何影响架构、治理、评测、发布规则、开源策略、传播机制、社区协议或自适应运行时的改动，都必须同步更新相关文档。
4. 任何自治能力都必须经过评测、审批、审计和回滚设计，不能绕过人类闸门。
5. 文档中的接口名、事件名、角色名、运行档位和实例协作术语必须保持一致；不要引入未登记的新术语。
6. 不要把 FreedomRealm 限定为传统 HRMS；FreedomRealm 是 AI 时代的人类与智能体资源管理系统。
7. 当前文档基线已正式更名为 FreedomRealm；AI-HRMS 仅作为历史名称或兼容迁移语境出现。
8. 不要引入破坏个人和社区优先原则的实现或叙事。
9. 不要让跨实例协作绕过本地审批、审计和数据分级。
10. 不要让资源降级绕过安全治理、预算控制、审批和审计。
11. 开发脚本和本地命令应优先保持 OS-neutral；可跨平台安装的工具不视为环境风险，复杂服务依赖再通过 Docker/Compose/devcontainer 兜底。

## Recommended Read Order

1. [README.md](README.md)
2. [ARCHITECTURE.md](ARCHITECTURE.md)
3. [docs/zh-CN/README.md](docs/zh-CN/README.md)
4. [docs/zh-CN/project-operating-entry.md](docs/zh-CN/project-operating-entry.md)
5. 根据任务进入对应专题文档。

## Knowledge Map

- 项目愿景与原则：[docs/zh-CN/vision-and-principles.md](docs/zh-CN/vision-and-principles.md)
- 项目运行入口与任务清单：[docs/zh-CN/project-operating-entry.md](docs/zh-CN/project-operating-entry.md)
- 业务蓝图：[docs/zh-CN/business-blueprint.md](docs/zh-CN/business-blueprint.md)
- 总体架构：[docs/zh-CN/architecture-blueprint.md](docs/zh-CN/architecture-blueprint.md)
- 人机协作流：[docs/zh-CN/collaboration-workflows.md](docs/zh-CN/collaboration-workflows.md)
- 成员权利与贡献机制：[docs/zh-CN/member-rights-and-contribution.md](docs/zh-CN/member-rights-and-contribution.md)
- 能力发展与 MVP 收敛：[docs/zh-CN/capability-development-and-mvp.md](docs/zh-CN/capability-development-and-mvp.md)
- 治理型 AI 中枢：[docs/zh-CN/governance-ai-brain.md](docs/zh-CN/governance-ai-brain.md)
- 接口契约：[docs/zh-CN/api-contracts.md](docs/zh-CN/api-contracts.md)
- 学习与自进化：[docs/zh-CN/learning-flywheel.md](docs/zh-CN/learning-flywheel.md)
- 安全治理：[docs/zh-CN/security-and-governance.md](docs/zh-CN/security-and-governance.md)
- 数据生命周期与训练资源：[docs/zh-CN/data-lifecycle-and-training-resources.md](docs/zh-CN/data-lifecycle-and-training-resources.md)
- 部署运维：[docs/zh-CN/deployment-and-operations.md](docs/zh-CN/deployment-and-operations.md)
- 环境隔离：[docs/zh-CN/environment-isolation.md](docs/zh-CN/environment-isolation.md)
- 开发体验与文件组织：[docs/zh-CN/developer-experience.md](docs/zh-CN/developer-experience.md)
- Harness 工程方式：[docs/zh-CN/harness-engineering.md](docs/zh-CN/harness-engineering.md)
- 质量门禁：[docs/zh-CN/quality-gates.md](docs/zh-CN/quality-gates.md)
- 路线图：[docs/zh-CN/roadmap.md](docs/zh-CN/roadmap.md)
- 术语表：[docs/zh-CN/glossary.md](docs/zh-CN/glossary.md)
- 开源战略：[docs/zh-CN/open-source-strategy.md](docs/zh-CN/open-source-strategy.md)
- 传播与增长：[docs/zh-CN/adoption-and-growth.md](docs/zh-CN/adoption-and-growth.md)
- 社区网络与跨实例协作：[docs/zh-CN/community-network.md](docs/zh-CN/community-network.md)
- 跨实例通信协议：[docs/zh-CN/federation-protocol.md](docs/zh-CN/federation-protocol.md)
- 自适应运行体系：[docs/zh-CN/adaptive-runtime.md](docs/zh-CN/adaptive-runtime.md)
- 社区治理：[docs/zh-CN/community-governance.md](docs/zh-CN/community-governance.md)
- ADR 索引：[docs/zh-CN/adr/README.md](docs/zh-CN/adr/README.md)
- 执行计划索引：[docs/zh-CN/execution-plans/README.md](docs/zh-CN/execution-plans/README.md)
- 评测基线：[docs/zh-CN/evals/baseline-v1.md](docs/zh-CN/evals/baseline-v1.md)

## Mandatory Invariants

- 控制面不直接承载 agent 推理图执行逻辑。
- 长流程编排由 Temporal 承担，agent 内部状态化推理由 LangGraph 承担。
- 所有模型调用必须经 LiteLLM Proxy 或受控 ModelRoute，接受策略、预算和审计控制。
- 生产 `ModelRoute` 必须绑定 `ModelCapabilityProfile`、评测结果、数据分级范围、风险等级范围和回退策略。
- 所有高风险动作必须存在 `ApprovalGate`。
- `GovernanceBrain` 只能生成项目理解、智能分派、多人协调、模型能力治理和自我迭代候选，不能替代人类 owner 或绕过审批、审计、预算和数据分级。
- AI 分派默认是建议，不是命令；成员有权拒绝、延后、协商或转交 AI 建议分派，拒绝本身不得被自动记为负面贡献。
- MVP 阶段优先用文档教学、最小模板和 Demo Mode 跑通闭环；复杂能力发现、自适应教学和关键词弹窗不能成为 MVP 阻塞项。
- 所有新增接口必须同时定义请求边界、响应边界、事件语义和审计点。
- 传统 HRMS 能力继续保留，不能被 Agent 平台叙事覆盖。
- `Tiny Mode`、`Demo Mode`、`Local Mode`、`Community Mode` 和 `Enterprise Mode` 是正式运行档位。
- 自适应运行不能绕过审批、安全、审计、预算和数据分级。
- 跨实例协作必须使用 `ProjectInstance`、`FederationLink`、`CapabilityOffer`、`CapabilityRequest`、`SharedTemplate` 和 `SharedEvalSummary` 语言。
- 跨实例通信必须保持 `FederationMessage` envelope、`FederationManifest`、`FederationReceipt` 和协议版本兼容；二次开发只能通过 namespaced extensions、自定义 schema 和 CapabilityOffer 扩展。
- 学习结果必须经过评测、审批、灰度和回滚。
- 敏感数据不得以原文作为训练资源保留；只有经过脱敏、审批、审计、用途限定和保留期约束后，才能形成训练、评测或模型能力改进资源。
