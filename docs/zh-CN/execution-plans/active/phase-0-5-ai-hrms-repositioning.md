# Phase 0.5: AI-HRMS Repositioning and Adaptive Demo Foundation

## 状态

Active

## 背景和问题陈述

AI-HRMS 的既有文档偏向单企业私有化部署的 agent-first 人力资源管理与协作平台。该定位保留了强治理边界，但不利于个人、社区、开源项目、小团队和多人协作体理解并试用 AI-HRMS。

本阶段保留 AI-HRMS 名称，扩展 HRMS 定义：AI-HRMS 是 AI 时代的人类与智能体资源管理系统。它统一管理 HumanActor、AgentActor、WorkItem、ToolContract、ApprovalGate、PolicyRule、Observation、LearningArtifact、ProjectInstance 和 DomainWorkflow，让标准化工作可以在明确约束下由 AI 执行，由人类设定目标、定义边界、审批高风险动作、审查结果和承担最终责任。

## 目标

- 扩展 AI 时代 HRMS 定义。
- 明确个人与社区优先原则。
- 定义 ProjectInstance 和跨实例协作边界。
- 定义资源自适应运行体系。
- 定义开源策略和反商业捕获原则。
- 定义传播机制和最小可运行闭环。
- 准备 Demo Mode 的文档基础。

## 非目标

- 本任务不处理正式更名。
- 本任务不实现完整分布式计算网络。
- 本任务不实现完整商业化。
- 本任务不引入生产业务代码。
- 本任务不删除现有 HRMS 设计。
- 本任务不替代 Enterprise Mode 的强治理架构。
- 本任务不直接锁定 LICENSE。

## 影响范围

- README 和 AGENTS 工作规则。
- 愿景、业务蓝图、架构蓝图、质量门禁、路线图和术语表。
- 新增开源战略、传播增长、社区网络、自适应运行和社区治理专题文档。
- 新增 ADR 和 ADR 索引。
- 新增执行计划索引。

## 交付物

- 更新 README 首屏定位。
- 更新 `vision-and-principles.md`。
- 更新 `business-blueprint.md`。
- 更新 `architecture-blueprint.md` 和根 `ARCHITECTURE.md`。
- 新增 `open-source-strategy.md`。
- 新增 `adoption-and-growth.md`。
- 新增 `community-network.md`。
- 新增 `adaptive-runtime.md`。
- 新增 `community-governance.md`。
- 更新 `roadmap.md`。
- 新增 ADR-0004，必要时新增 ADR-0005 和 ADR-0006。
- 更新质量门禁和术语表。

## 依赖和前置条件

- 保留现有 `packages/contracts`、`packages/policy` 和 `config/environments`。
- 保留环境隔离守卫和现有 pnpm 脚本。
- 遵守现有 ApprovalGate、Temporal、LangGraph、LiteLLM Proxy 和环境隔离约束。

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| AI-HRMS 被误解为泛泛 agent framework | 文档持续强调 HRMS 边界扩展，而不是放弃 HRMS |
| 新增跨实例协作导致安全边界模糊 | 明确默认不互信、不共享私有数据、高风险动作回到本实例 ApprovalGate |
| 自适应降级削弱治理 | 将降级不能绕过审批、安全、审计、预算和数据分级写入架构与质量门禁 |
| 开源策略被误读为法律结论 | 明确许可证选择需要人工确认且不是法律意见 |
| 文档新增术语不一致 | 更新 glossary、README、业务蓝图、架构蓝图和索引 |

## 安全、审批、审计和回滚影响

- 安全：新增 Federation 和 Adaptive Runtime 边界，不放宽既有数据分级、环境隔离和模型网关约束。
- 审批：所有高风险动作仍必须经过 ApprovalGate，跨实例和低资源降级都不能绕过。
- 审计：跨实例消息、资源降级、模型路由降级和 ExecutionReportCard 生成都需要审计引用。
- 回滚：本阶段为文档改动，可通过 git 回滚；未来代码实现必须另行定义迁移和回滚。

## 文档一致性检查

- 项目名称仍为 AI-HRMS。
- 本轮不处理正式更名。
- 传统 HRMS 能力继续保留。
- Enterprise Mode 保留企业私有化部署和强治理架构。
- Tiny / Demo / Local / Community / Enterprise 成为运行档位。
- Federation 使用 ProjectInstance、CapabilityOffer、CapabilityRequest、SharedTemplate 和 SharedEvalSummary 语言。
- 自适应运行不能绕过审批、安全、审计、预算和数据分级。

## 验收标准

- README 首屏能解释 AI-HRMS 是什么、AI 时代 HRMS 管理什么、个人和多人如何使用、Demo Mode 能跑通什么。
- business-blueprint 出现 ProjectInstance、InstanceMember、CommunityActor、FederationLink、CapabilityOffer、CapabilityRequest、SharedTemplate、SharedEvalSummary、ExecutionReportCard、ResourceProfile、AdaptiveRuntimePolicy、DomainWorkflow 和 DomainPack。
- architecture-blueprint 出现 Adaptive Runtime Layer、Federation Gateway、Execution Report Generator、Resource Profile Detector、Adaptive Model Router 和 Adaptive Task Scheduler。
- roadmap 出现 Phase 0.5、0.6、0.7，并调整 Phase 1 为 AI-HRMS Core 基础能力。
- quality-gates 出现 Adoption、Adaptive runtime、Anti-capture、Federation safety 和 Community contribution gate。
- glossary 新增相关术语。
- ADR 和执行计划索引已更新。
