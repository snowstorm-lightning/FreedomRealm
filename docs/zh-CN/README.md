# 中文文档库

本目录是 AI HRMS 的中文解释文档库，也是后续实现阶段的主要知识入口。文档按“愿景 -> 业务 -> 架构 -> 流程 -> 治理 -> 执行 -> 演化”的顺序组织。

## 核心文档

- [vision-and-principles.md](vision-and-principles.md)：项目愿景、边界与核心原则
- [business-blueprint.md](business-blueprint.md)：业务蓝图、边界上下文与核心概念
- [architecture-blueprint.md](architecture-blueprint.md)：系统拓扑、分层、数据流与技术栈
- [collaboration-workflows.md](collaboration-workflows.md)：人类与智能体协作流程
- [api-contracts.md](api-contracts.md)：v1 API、事件、模式边界与命名约定
- [learning-flywheel.md](learning-flywheel.md)：学习、自进化与受控发布闭环
- [security-and-governance.md](security-and-governance.md)：身份、策略、预算、审计与合规
- [deployment-and-operations.md](deployment-and-operations.md)：部署、环境、可观测性、备份与恢复
- [environment-isolation.md](environment-isolation.md)：环境隔离、防污染、晋级和回滚约束
- [harness-engineering.md](harness-engineering.md)：仓库作为 harness 的工程规范
- [quality-gates.md](quality-gates.md)：质量门禁、验收和发布闸门
- [roadmap.md](roadmap.md)：阶段路线图
- [glossary.md](glossary.md)：术语表
- [references.md](references.md)：官方参考资料索引

## 决策与执行

- [adr/README.md](adr/README.md)：ADR 索引
- [execution-plans/README.md](execution-plans/README.md)：执行计划索引
- [evals/baseline-v1.md](evals/baseline-v1.md)：评测基线

## 文档维护规则

- 任何新能力都必须映射到业务上下文、接口、事件、权限边界和审计点。
- 任何高风险自治行为都必须映射到 `ApprovalGate`、评测规则和回滚路径。
- 领域对象、接口形状和基础回归场景统一沉淀到 `business-blueprint.md`、`api-contracts.md`、`quality-gates.md`。
- 文档优先更新原则：当实现与文档不一致时，要么修实现，要么修文档，不能长期漂移。
