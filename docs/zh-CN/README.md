# 中文文档库

本目录是 AI-HRMS 的中文解释文档库，也是后续实现阶段的主要知识入口。AI-HRMS 已扩展为 AI 时代的人类与智能体资源管理系统，但传统 HRMS 能力继续保留。文档按“愿景 -> 业务 -> 架构 -> 流程 -> 治理 -> 社区 -> 执行 -> 演化”的顺序组织。

## 核心文档

- [vision-and-principles.md](vision-and-principles.md)：项目愿景、AI 时代 HRMS 定义、边界与核心原则。
- [business-blueprint.md](business-blueprint.md)：业务蓝图、边界上下文、ProjectInstance 和核心概念。
- [architecture-blueprint.md](architecture-blueprint.md)：系统拓扑、分层、运行档位、跨实例与自适应运行边界。
- [collaboration-workflows.md](collaboration-workflows.md)：人类与智能体协作流程。
- [member-rights-and-contribution.md](member-rights-and-contribution.md)：成员拒绝权、贡献记录、AI 分派边界和公平分析报告。
- [capability-development-and-mvp.md](capability-development-and-mvp.md)：能力发展愿景、文档教学优先、MVP 生存优先级和后续关键词弹窗规划。
- [governance-ai-brain.md](governance-ai-brain.md)：治理型 AI 中枢、智能分派、多人协作、自我迭代和模型能力治理。
- [api-contracts.md](api-contracts.md)：v1 API、事件、模式边界与命名约定。
- [learning-flywheel.md](learning-flywheel.md)：学习、自进化与受控发布闭环。
- [security-and-governance.md](security-and-governance.md)：身份、策略、预算、审计与合规。
- [data-lifecycle-and-training-resources.md](data-lifecycle-and-training-resources.md)：数据生命周期、脱敏训练资源、训练用途和撤回删除规则。
- [deployment-and-operations.md](deployment-and-operations.md)：部署、环境、可观测性、备份与恢复。
- [environment-isolation.md](environment-isolation.md)：环境隔离、防污染、晋级和回滚约束。
- [developer-experience.md](developer-experience.md)：跨平台开发体验、本地命令、doctor、CI 和文件组织规划。
- [harness-engineering.md](harness-engineering.md)：仓库作为 harness 的工程规范。
- [quality-gates.md](quality-gates.md)：质量门禁、验收和发布闸门。
- [roadmap.md](roadmap.md)：阶段路线图。
- [glossary.md](glossary.md)：术语表。
- [references.md](references.md)：官方参考资料索引。

## 开源、社区与增长

- [open-source-strategy.md](open-source-strategy.md)：开源战略、许可证候选、商标、Commons 资产和反商业捕获。
- [adoption-and-growth.md](adoption-and-growth.md)：传播目标、最小 Demo、ExecutionReportCard、模板传播和贡献者声誉。
- [community-network.md](community-network.md)：ProjectInstance、FederationLink、CapabilityOffer、CapabilityRequest、SharedTemplate 和 SharedEvalSummary。
- [federation-protocol.md](federation-protocol.md)：跨实例通信协议、消息封套、兼容性规则和二次开发扩展边界。
- [adaptive-runtime.md](adaptive-runtime.md)：Tiny / Demo / Local / Community / Enterprise 五种运行档位和自适应策略。
- [community-governance.md](community-governance.md)：社区治理、企业参与规则、商标与官方兼容声明。

## 决策与执行

- [adr/README.md](adr/README.md)：ADR 索引。
- [execution-plans/README.md](execution-plans/README.md)：执行计划索引。
- [evals/baseline-v1.md](evals/baseline-v1.md)：评测基线。

## 运行手册

- [runbooks/demo-mode.md](runbooks/demo-mode.md)：CLI-first Demo Mode 运行手册，首个模板为 `docs_review_and_improvement`。

重点新增：

- [adr/ADR-0004-ai-era-hrms-definition.md](adr/ADR-0004-ai-era-hrms-definition.md)：AI 时代 HRMS 定义。
- [adr/ADR-0005-open-source-anti-capture-strategy.md](adr/ADR-0005-open-source-anti-capture-strategy.md)：开源反商业捕获组合策略。
- [adr/ADR-0006-adaptive-runtime-profiles.md](adr/ADR-0006-adaptive-runtime-profiles.md)：自适应运行档位。
- [adr/ADR-0007-governance-ai-brain.md](adr/ADR-0007-governance-ai-brain.md)：治理型 AI 中枢。
- [adr/ADR-0008-federation-protocol-compatibility.md](adr/ADR-0008-federation-protocol-compatibility.md)：跨实例通信协议兼容性。
- [execution-plans/active/phase-0-5-ai-hrms-repositioning.md](execution-plans/active/phase-0-5-ai-hrms-repositioning.md)：Phase 0.5 定位与自适应 Demo 基础计划。

## 文档维护规则

- 任何新能力都必须映射到业务上下文、接口、事件、权限边界和审计点。
- 任何高风险自治行为都必须映射到 `ApprovalGate`、评测规则和回滚路径。
- 任何治理型 AI 中枢能力都不能替代人类责任主体，智能分派、模型路由和学习候选必须保留来源、评测、审批和审计引用。
- AI 分派默认是建议，不是命令；成员拒绝、延后、协商或转交 AI 建议分派不得被自动记为负面贡献。
- MVP 阶段优先使用文档教学和最小模板跑通闭环；复杂能力发现、自适应教学和关键词弹窗不得阻塞 Demo Mode。
- 敏感数据不得以原文作为训练资源保留；脱敏后的训练资源必须绑定来源、用途、审批、审计、保留期和撤回路径。
- 领域对象、接口形状和基础回归场景统一沉淀到 `business-blueprint.md`、`api-contracts.md`、`quality-gates.md`。
- 修改 AI-HRMS 定义、治理、开源策略、传播机制、社区协议、GovernanceBrain、模型能力治理或自适应运行时，必须同步更新相关文档。
- 不要把 AI-HRMS 限定为传统 HRMS；也不要把它改写成泛泛 agent framework。
- 不要让跨实例协作绕过本地审批、审计和数据分级。
- 不要通过二次开发修改 FederationMessage 标准封套语义；自定义跨实例能力必须通过 CapabilityOffer、schema 和 namespaced extensions 扩展。
- 不要让资源降级绕过安全治理、预算控制、审批和审计。
- 不要把可跨平台安装的工具误判为环境风险；开发脚本应保持 OS-neutral，复杂服务依赖再用 Docker/Compose/devcontainer 兜底。
- 文档优先更新原则：当实现与文档不一致时，要么修实现，要么修文档，不能长期漂移。
