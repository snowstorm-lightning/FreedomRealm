# 路线图

## Phase 0: 文档与仓库底座

- 建立根入口文档。
- 建立中文知识库。
- 固化架构边界、角色模型、契约与治理规则。
- 建立 ADR、执行计划和评测基线。

退出标准：

- 所有核心专题文档能独立说明目标、边界、状态、审计、评测和回滚要求。
- ADR 至少覆盖控制面/运行面拆分、模型网关和 Temporal/LangGraph 分工。
- 质量门禁能约束后续实现，不只描述愿景。
- 环境隔离和安全治理已作为正式发布约束进入文档索引。

## Phase 0.5: AI-HRMS repositioning and adaptive demo foundation

- 扩展 AI 时代 HRMS 定义。
- 定义个人与社区优先原则。
- 定义 ProjectInstance。
- 定义跨实例协作边界。
- 定义资源自适应运行体系。
- 定义开源策略。
- 定义传播机制。
- 定义最小可运行闭环。
- 准备 Demo Mode。

退出标准：

- README 首屏能在 30 秒内解释 AI-HRMS 是什么、AI 时代 HRMS 管理什么、个人和多人如何使用、AI 如何执行标准化工作、人类如何审批和治理。
- `business-blueprint.md` 出现 ProjectInstance、FederationLink、CapabilityOffer、CapabilityRequest、SharedTemplate、SharedEvalSummary、ExecutionReportCard、ResourceProfile、AdaptiveRuntimePolicy、DomainWorkflow 和 DomainPack。
- `architecture-blueprint.md` 出现 Adaptive Runtime Layer、Federation Gateway、Execution Report Generator、Resource Profile Detector、Adaptive Model Router 和 Adaptive Task Scheduler。
- `open-source-strategy.md`、`adoption-and-growth.md`、`community-network.md`、`adaptive-runtime.md` 和 `community-governance.md` 已进入索引。
- ADR-0004 已记录 AI 时代 HRMS 定义。

## Phase 0.6: Template and report-card growth loop

- 示例模板。
- ExecutionReportCard。
- 模板贡献指南。
- 脱敏评测摘要。
- 公开案例库。
- 贡献者声誉。

最小交付：

- GitHub issue 分流、会议纪要整理、文档摘要、政策问答、开源项目维护和社区贡献者 onboarding 等示例模板。
- ExecutionReportCard schema 草案和脱敏规则。
- 模板贡献指南和失败案例贡献指南。
- SharedEvalSummary 的聚合指标和失败分类格式。
- 案例库信息架构和公开分享许可规则。

不能进入下一阶段的条件：

- 报告卡公开分享无法标注脱敏状态和许可。
- 模板缺少风险等级、审批要求和失败处理。
- 贡献者署名和追踪机制缺失。

## Phase 0.7: Community contribution foundation

- LICENSE 决策材料。
- CONTRIBUTING.md。
- issue 模板。
- PR 模板。
- good first issue。
- 社区治理文档。
- 模板贡献流程。
- 失败样本贡献流程。

最小交付：

- LICENSE 或 LICENSE-CANDIDATES 决策材料，标注需要人工确认。
- 商标策略和官方兼容认证草案。
- 非代码贡献入口。
- 企业参与和利益冲突披露规则。
- Community Commons 的贡献、署名、复用、修正和撤回流程。

不能进入下一阶段的条件：

- 许可证、商标或官方兼容认证仍无人工确认路径。
- 企业参与规则无法保护个人和社区优先原则。
- Commons 资产规则无法区分公开贡献和用户私有数据。

## Phase 1: AI-HRMS Core 基础能力

- 建立控制面与工作台。
- 建立 `ProjectInstance`、`InstanceMember`、`WorkItem`、`ApprovalGate`、`AgentActor`、`PolicyRule` 最小闭环。
- 建立 `ResourceProfile`、`AdaptiveRuntimePolicy`、`ExecutionReportCard` 的最小实现方向。
- 建立受控模型网关与知识底座。
- 建立基础审计与观测。
- 保留传统 HRMS 能力，包括组织、账号、员工档案、考勤、权限和协作内容。

最小交付：

- `apps/web`、`apps/control-plane`、`apps/agent-runtime`、`packages/contracts`、`packages/policy` 基础结构。
- 组织、账号、员工档案、考勤、权限、协作内容的核心 API。
- ProjectInstance 和 InstanceMember 的最小 API。
- WorkItem 状态迁移、ApprovalGate 决策、AgentRun 记录和审计事件。
- LiteLLM Proxy 的 dev/staging/prod 分环境配置样例。
- ResourceProfile 和 AdaptiveRuntimePolicy 的最小策略模型。
- ExecutionReportCard 的生成和脱敏状态记录。
- 基础 Playwright 场景覆盖审批流、人机协作流和 Demo Mode 闭环。

不能进入下一阶段的条件：

- 高风险动作仍可绕过 ApprovalGate。
- Agent Runtime 可直接修改 HR 主数据。
- 没有可追溯的审计事件和策略判断。
- Demo Mode 无法跑通最小闭环。
- 自适应降级可以绕过审批、安全、审计、预算或数据分级。

## Phase 2: 学习飞轮

- 建立 Observation 汇聚管道。
- 建立数据集管理、评测运行和候选发布流程。
- 建立提示词、工作流和策略的灰度发布能力。
- 支持 Failure case、Review note 和 SharedEvalSummary 的沉淀。

最小交付：

- LearningArtifact、Experiment、EvalRun 的 API 与存储模型。
- 固定基线数据集和评分器版本。
- staging 沙盒回放能力。
- 生产灰度发布、观察窗口和回滚记录。
- 脱敏评测摘要导出。

不能进入下一阶段的条件：

- 学习结果可直接覆盖生产配置。
- 评测数据集没有版本或包含未脱敏生产数据。
- 治理指标缺少发布门槛。

## Phase 3: 深化自治与社区协作

- 建立更多 AgentActor 角色与跨部门协作能力。
- 扩展更复杂的流程编排与多代理协同。
- 在严格审批边界内扩大自动执行范围。
- 试验 Community Mode 中的模板共享、贡献者声誉和可选 FederationLink。

最小交付：

- 多个 AgentActor 的能力、工具和预算隔离。
- 跨部门 WorkItem 协作、升级和补偿流程。
- 更细粒度的 ToolContract 风险等级和自动执行策略。
- 多代理协同的审计和冲突处理规则。
- FederationLink 的只读或模板共享试验，不包含高风险远程工具执行。

不能进入下一阶段的条件：

- 多代理协作缺少统一 owner 或冲突解决规则。
- 自动执行范围扩大但评测覆盖没有同步扩大。
- FederationLink 无显式授权、审计或撤销方式。

## Phase 4: AI-HRMS 跨域扩展

- 将 agent-first 能力扩展到 HR 之外的业务域。
- 建立跨域运营台、知识共享与统一治理面。
- 扩展 DomainWorkflow 和 DomainPack。
- 逐步形成面向个人、社区和组织的工作执行与治理底座。

前置条件：

- HR 域内审批、审计、评测、环境隔离和回滚机制稳定。
- 跨域数据分级、权限模型和知识边界已经定义。
- 新业务域必须先新增业务蓝图、API 契约、评测基线和 ADR。
- 不承诺完整分布式计算网络，不承诺完全无人自治组织。
