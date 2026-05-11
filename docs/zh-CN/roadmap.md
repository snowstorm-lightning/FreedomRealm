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
- 定义 FederationProtocol 的最小通信面、消息封套和二次开发兼容规则。
- 定义资源自适应运行体系。
- 定义 GovernanceBrain、智能分派和模型能力治理边界。
- 定义能力发展愿景、文档教学优先和 MVP 收敛边界。
- 定义开源策略。
- 定义传播机制。
- 定义最小可运行闭环。
- 准备 Demo Mode。

退出标准：

- README 首屏能在 30 秒内解释 AI-HRMS 是什么、AI 时代 HRMS 管理什么、个人和多人如何使用、AI 如何执行标准化工作、人类如何审批和治理。
- `business-blueprint.md` 出现 ProjectInstance、GovernanceBrain、MemberCapabilityProfile、TaskFitAssessment、ModelCapabilityProfile、FederationLink、CapabilityOffer、CapabilityRequest、SharedTemplate、SharedEvalSummary、ExecutionReportCard、ResourceProfile、AdaptiveRuntimePolicy、DomainWorkflow 和 DomainPack。
- `architecture-blueprint.md` 出现 Adaptive Runtime Layer、Federation Gateway、FederationProtocol、Execution Report Generator、Resource Profile Detector、Adaptive Model Router 和 Adaptive Task Scheduler。
- `open-source-strategy.md`、`adoption-and-growth.md`、`community-network.md`、`adaptive-runtime.md` 和 `community-governance.md` 已进入索引。
- `governance-ai-brain.md` 已进入索引，并说明治理型 AI 中枢不能替代人类 owner 或绕过审批。
- `capability-development-and-mvp.md` 已进入索引，并说明复杂能力发现、自适应教学和 KeywordHelpOverlay 不阻塞 MVP。
- ADR-0004 已记录 AI 时代 HRMS 定义。

## Phase 0.6: Template and report-card growth loop

- 示例模板。
- MVP 文档教学入口。
- ExecutionReportCard。
- 模板贡献指南。
- 脱敏评测摘要。
- 公开案例库。
- 贡献者声誉。
- 传播型 Web Workbench 设计。
- 固定入口、目标入口和自由探索入口。

最小交付：

- GitHub issue 分流、会议纪要整理、文档摘要、政策问答、开源项目维护和社区贡献者 onboarding 等示例模板。
- README -> Demo Mode -> 首个模板 -> ExecutionReportCard 的最短学习路径。
- 首个低连接器依赖、低敏感数据依赖的模板，优先评估文档摘要与改进建议。
- CLI-first 的 Demo Mode 执行入口，极简 Web UI 后续读取同一份执行数据展示。
- Web-first onboarding 草案，允许用户从固定身份、目标描述或自由探索进入，而不是先被迫定义身份。
- Web MVP 第一屏草案：目标入口、自由探索入口、示例入口和报告卡预览。
- 第一批用户可见 AI-assisted work proof 模板草案：`repo_understanding_and_work_plan`、`issue_pr_triage_and_review`、`personal_work_proof`。
- 知识导航与异议闭环模板：`knowledge_navigation_and_challenge`，生成带来源引用的 `AnswerCard`、`DocChallengeDraft` 和报告卡。
- `docs_review_and_improvement` 保留为工程 smoke template、CLI Demo 和文档协作样例。
- 默认 mock model 和可选 live model 路径；MVP 通过标准不得依赖真实模型 key。
- ExecutionReportCard JSON schema 草案、Markdown 渲染规则和脱敏规则。
- 模板贡献指南和失败案例贡献指南。
- SharedEvalSummary 的聚合指标和失败分类格式。
- 案例库信息架构和公开分享许可规则。
- 成员权利、拒绝 AI 建议分派和贡献记录机制。
- 脱敏训练资源的数据生命周期和保留规则。
- 现实感知层和现实执行层只登记为后续探索假设，不作为软件层 MVP 前置条件。

不能进入下一阶段的条件：

- 报告卡公开分享无法标注脱敏状态和许可。
- 模板缺少风险等级、审批要求和失败处理。
- 贡献者署名和追踪机制缺失。
- AI 分派被实现成强制命令，或拒绝建议被自动记为负面贡献。
- 敏感原文可直接作为训练资源保留。
- Demo Mode 依赖 KeywordHelpOverlay、复杂自适应教学、真实外部连接器或完整企业栈才能跑通。
- Demo Mode 必须依赖真实模型 key 才能跑通，或 mock model 输出不可测试。
- Web UI 需要重新实现独立业务逻辑，或不能读取 CLI 产生的同一份执行数据。
- Onboarding 把用户锁定为单一身份，无法从目标或自由探索开始。
- 首屏需要用户先注册、先配置模型 key、先连接外部工具或先理解完整平台架构。
- 现实任务输入被提前作为 MVP 依赖，导致软件层 Web onboarding、模板运行和报告卡分享无法按期完成。

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
- 建立 `GovernanceBrain`、`MemberCapabilityProfile`、`TaskFitAssessment`、`ModelCapabilityProfile`、`ResourceProfile`、`AdaptiveRuntimePolicy`、`ExecutionReportCard` 的最小实现方向。
- 建立 `TeachingMaterial`、`LearningPath`、`CapabilityDiscovery`、`CapabilityProof` 和 `KeywordHelpOverlay` 的边界，其中 KeywordHelpOverlay 延后实现。
- 建立受控模型网关与知识底座。
- 建立基础审计与观测。
- 建立跨平台开发入口、doctor 检查、文件组织基线和最小 CI。
- 保留传统 HRMS 能力，包括组织、账号、员工档案、考勤、权限和协作内容。
- 建立大型项目多 agent 分片协作的最小治理机制。

最小交付：

- `apps/web`、`apps/control-plane`、`apps/agent-runtime`、`packages/contracts`、`packages/policy` 基础结构。
- `developer-experience.md` 目标结构落地到首批目录，包含 `scripts/doctor.mjs`、`pnpm-lock.yaml` 和 Linux CI；关键脚本准备 Windows 验证。
- CLI-first 的 Demo runner，能保存 JSON `ExecutionReportCard` 并默认导出 Markdown 渲染物。
- mock model 固定输出和 live model 可选增强路径。
- 组织、账号、员工档案、考勤、权限、协作内容的核心 API。
- ProjectInstance 和 InstanceMember 的最小 API。
- GovernanceBrain 的项目基线解释、成员画像、任务适配评估和冲突报告 API 草案。
- 文档教学优先的 Demo 教程和首个模板说明。
- WorkItem 状态迁移、ApprovalGate 决策、AgentRun 记录和审计事件。
- LiteLLM Proxy 的 dev/staging/prod 分环境配置样例。
- ResourceProfile、ModelCapabilityProfile 和 AdaptiveRuntimePolicy 的最小策略模型。
- ExecutionReportCard 的 JSON 生成、schemaVersion、Markdown 渲染和脱敏状态记录。
- 基础 Playwright 场景覆盖审批流、人机协作流和 Demo Mode 闭环。
- `WorkShard`、`AgentWorkLease`、`ChangePacket` 和 `MergeGate` 的最小数据结构或文档化流程。
- 当任务超过单 agent 稳定处理能力时，系统能提示拆分，并记录拆分理由、`writeSet` 和合并门禁结果。

不能进入下一阶段的条件：

- 高风险动作仍可绕过 ApprovalGate。
- Agent Runtime 可直接修改 HR 主数据。
- 没有可追溯的审计事件和策略判断。
- Demo Mode 无法跑通最小闭环。
- 新用户无法按文档在 5 到 10 分钟内跑通首个模板。
- 新开发者无法通过本机路径或容器兜底路径完成最小验证。
- 新目录不符合文件组织门禁，或根目录出现临时实验资产。
- 自适应降级可以绕过审批、安全、审计、预算或数据分级。
- GovernanceBrain 可以替代人类 owner、自动批准高风险动作或把候选直接落地。
- 生产模型路由没有 ModelCapabilityProfile、评测结果和回退策略。
- 多 agent 并行开发没有 `writeSet` 边界、合并门禁、测试记录或统一 owner。

## Phase 2: 学习飞轮

- 建立 Observation 汇聚管道。
- 建立数据集管理、评测运行和候选发布流程。
- 建立提示词、工作流和策略的灰度发布能力。
- 建立任务分派策略、模型能力画像和模型路由候选的评测流程。
- 支持 Failure case、Review note 和 SharedEvalSummary 的沉淀。
- 开始评估 LearningPath、CapabilityProof 和 TeachingStrategy 的数据化沉淀。
- 基于软件层使用数据评估现实感知层和现实执行层是否值得进入后续试点。

最小交付：

- LearningArtifact、Experiment、EvalRun 的 API 与存储模型。
- TaskFitAssessment、ModelCapabilityProfile 和模型间分歧报告的评测切片。
- 固定基线数据集和评分器版本。
- staging 沙盒回放能力。
- 生产灰度发布、观察窗口和回滚记录。
- 脱敏评测摘要导出。
- CapabilityProof 证据类型和 LearningPath 反馈样本。
- RealityCapture 研究备忘录：明确候选场景、用户、数据边界、人工验收方式、商业化假设和暂不实现理由。

不能进入下一阶段的条件：

- 学习结果可直接覆盖生产配置。
- 评测数据集没有版本或包含未脱敏生产数据。
- 治理指标缺少发布门槛。
- 模型升级、降级或供应商切换没有评测和回滚。
- 在软件层模板、报告卡、学习路径和贡献入口未验证前，贸然把现实层能力作为交付主线。

## 当前短期目标

从当前 MVP 起算，AI-HRMS 的短期目标应优先证明三件事。这不是一年目标；在当前 AI 模型能力和 agent 工程工具已经足够强的前提下，这三项应作为接下来连续迭代的近期验收线：

1. 可传播：非核心开发者能通过 Web-first onboarding 在 30 分钟内完成第一份 AI-assisted work proof。
2. 可协作：大型项目可以通过 `WorkShard`、`AgentWorkLease`、`ChangePacket` 和 `MergeGate` 由多人和多 agent 安全推进。
3. 可复用：模板、报告卡、失败复盘、学习路径和贡献入口能形成可持续的 Commons 资产循环。

这些目标完成后，项目才算具备进一步讨论一年愿景、社区扩张和商业化试验的基础。

## 一年发展目标

一年目标不应停留在“能传播、能协作、能复用”。一年内 AI-HRMS 应在软件层形成可以持续增长的工作执行与治理底座：

1. 产品形态成型：Web Workbench 成为默认入口，CLI 作为可测试内核继续存在；用户可以从固定入口、目标入口或自由探索入口创建 WorkItem、运行模板、触发审批、查看 Observation 并导出 ExecutionReportCard。
2. 模板生态成型：至少形成一批可运行、可评测、可贡献的 Workflow Template、Skill Recipe、ToolContract、Failure case 和 Review note，覆盖开发者、设计师、写作者、创作者、小团队和开源维护者的高频软件层工作。
3. 多 agent 工程成型：大型项目能通过 WorkShard、AgentWorkLease、ChangePacket、MergeGate 和质量门禁进行安全并行开发，避免单 agent 上下文溢出和写入冲突。
4. 学习飞轮成型：ExecutionReportCard、CapabilityProof、LearningPath、失败复盘和人工修正能够进入评测、模板改进和贡献机制，但不能直接变成绩效、排名或强制分派。
5. 社区增长成型：项目能吸引非代码贡献者、模板贡献者、失败案例贡献者和真实使用反馈，形成可署名、可追踪、可撤回、可复用的 Commons 资产。
6. 治理边界成型：审批、审计、预算、数据分级、分享许可、成员权利和反捕获规则不只是文档原则，而是在 Demo / Local / Community 级别至少有可运行或可验证的切片。

一年内仍不要求完整无人自治组织，也不要求一次性完成所有 HRMS 业务。现实感知、线下履约、复杂 3D、硬件和生产级跨实例网络不是当前软件层 MVP 的前置条件，但一年内可以基于真实用户和模板数据完成研究备忘录、候选试点判断和边界设计。

## Phase 3: 深化自治与社区协作

- 建立更多 AgentActor 角色与跨部门协作能力。
- 扩展更复杂的流程编排与多代理协同。
- 使用 GovernanceBrain 协调多人、多 AgentActor 和跨实例协作的依赖、冲突、review 和交接。
- 在严格审批边界内扩大自动执行范围。
- 试验 Community Mode 中的模板共享、贡献者声誉和可选 FederationLink。
- 试验 FederationProtocol 的 Manifest、Message、Receipt 和 schema 互操作。

最小交付：

- 多个 AgentActor 的能力、工具和预算隔离。
- GovernanceBrain 对多人任务分派、review 链路、模型能力匹配和阻塞升级的审计。
- 跨部门 WorkItem 协作、升级和补偿流程。
- 更细粒度的 ToolContract 风险等级和自动执行策略。
- 多代理协同的审计和冲突处理规则。
- FederationLink 的只读或模板共享试验，不包含高风险远程工具执行。
- FederationProtocol 的最小互操作测试，覆盖重复 messageId、未知 messageType、撤销 link 和 SharedEvalSummary 脱敏。

不能进入下一阶段的条件：

- 多代理协作缺少统一 owner 或冲突解决规则。
- 自动执行范围扩大但评测覆盖没有同步扩大。
- FederationLink 无显式授权、审计或撤销方式。
- 跨实例通信依赖未登记内部 API，或二次开发修改 FederationMessage 标准封套语义。

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
