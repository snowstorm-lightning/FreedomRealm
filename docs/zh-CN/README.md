# 中文文档库

本目录是 AI-HRMS 的中文解释文档库，也是后续实现阶段的主要知识入口。AI-HRMS 已扩展为 AI 时代的人类与智能体资源管理系统，但传统 HRMS 能力继续保留。文档按“愿景 -> 业务 -> 架构 -> 流程 -> 治理 -> 社区 -> 执行 -> 演化”的顺序组织。

## 核心文档

- [vision-and-principles.md](vision-and-principles.md)：项目愿景、AI 时代 HRMS 定义、边界与核心原则。
- [business-blueprint.md](business-blueprint.md)：业务蓝图、边界上下文、ProjectInstance 和核心概念。
- [architecture-blueprint.md](architecture-blueprint.md)：系统拓扑、分层、运行档位、跨实例与自适应运行边界。
- [collaboration-workflows.md](collaboration-workflows.md)：人类与智能体协作流程。
- [api-contracts.md](api-contracts.md)：v1 API、事件、模式边界与命名约定。
- [learning-flywheel.md](learning-flywheel.md)：学习、自进化与受控发布闭环。
- [security-and-governance.md](security-and-governance.md)：身份、策略、预算、审计与合规。
- [deployment-and-operations.md](deployment-and-operations.md)：部署、环境、可观测性、备份与恢复。
- [environment-isolation.md](environment-isolation.md)：环境隔离、防污染、晋级和回滚约束。
- [harness-engineering.md](harness-engineering.md)：仓库作为 harness 的工程规范。
- [quality-gates.md](quality-gates.md)：质量门禁、验收和发布闸门。
- [roadmap.md](roadmap.md)：阶段路线图。
- [glossary.md](glossary.md)：术语表。
- [references.md](references.md)：官方参考资料索引。

## 开源、社区与增长

- [open-source-strategy.md](open-source-strategy.md)：开源战略、许可证候选、商标、Commons 资产和反商业捕获。
- [adoption-and-growth.md](adoption-and-growth.md)：传播目标、最小 Demo、ExecutionReportCard、模板传播和贡献者声誉。
- [community-network.md](community-network.md)：ProjectInstance、FederationLink、CapabilityOffer、CapabilityRequest、SharedTemplate 和 SharedEvalSummary。
- [adaptive-runtime.md](adaptive-runtime.md)：Tiny / Demo / Local / Community / Enterprise 五种运行档位和自适应策略。
- [community-governance.md](community-governance.md)：社区治理、企业参与规则、商标与官方兼容声明。

## 决策与执行

- [adr/README.md](adr/README.md)：ADR 索引。
- [execution-plans/README.md](execution-plans/README.md)：执行计划索引。
- [evals/baseline-v1.md](evals/baseline-v1.md)：评测基线。

重点新增：

- [adr/ADR-0004-ai-era-hrms-definition.md](adr/ADR-0004-ai-era-hrms-definition.md)：AI 时代 HRMS 定义。
- [adr/ADR-0005-open-source-anti-capture-strategy.md](adr/ADR-0005-open-source-anti-capture-strategy.md)：开源反商业捕获组合策略。
- [adr/ADR-0006-adaptive-runtime-profiles.md](adr/ADR-0006-adaptive-runtime-profiles.md)：自适应运行档位。
- [execution-plans/active/phase-0-5-ai-hrms-repositioning.md](execution-plans/active/phase-0-5-ai-hrms-repositioning.md)：Phase 0.5 定位与自适应 Demo 基础计划。

## 文档维护规则

- 任何新能力都必须映射到业务上下文、接口、事件、权限边界和审计点。
- 任何高风险自治行为都必须映射到 `ApprovalGate`、评测规则和回滚路径。
- 领域对象、接口形状和基础回归场景统一沉淀到 `business-blueprint.md`、`api-contracts.md`、`quality-gates.md`。
- 修改 AI-HRMS 定义、治理、开源策略、传播机制、社区协议或自适应运行时，必须同步更新相关文档。
- 不要把 AI-HRMS 限定为传统 HRMS；也不要把它改写成泛泛 agent framework。
- 不要让跨实例协作绕过本地审批、审计和数据分级。
- 不要让资源降级绕过安全治理、预算控制、审批和审计。
- 文档优先更新原则：当实现与文档不一致时，要么修实现，要么修文档，不能长期漂移。
