# 术语表

## HumanActor

系统中的人类参与者，拥有组织身份、职责、权限和审批责任。

## CommunityActor

社区维度下的人类参与者，可与 HumanActor 关联，但在 ProjectInstance 内保留独立角色、贡献记录、权限和可见范围。

## AgentActor

系统中的智能体参与者，拥有独立身份、策略、预算、工具边界、能力、风险等级和审计轨迹。

## WorkItem

最小可管理工作单元，可被创建、分派、审批、关闭与学习。

## WorkShard

从较大的 WorkItem 中拆出的可独立理解、执行、验证和合并的子工作面。WorkShard 必须说明目标、输入、边界、owner、交付物、验证方式和失败恢复。

## AgentWorkLease

AgentActor 或 HumanActor 领取 WorkShard 时形成的工作租约，声明目标、readSet、writeSet、可用 ToolContract、禁止动作、超时、交付物、审计要求和回滚方式。租约不是永久所有权，超时、冲突或风险升级时必须回到调度和人工复核。

## ChangePacket

WorkShard 完成后提交的结构化交付包，至少包含变更摘要、文件列表、接口影响、测试结果、风险、人工复核点、失败复盘和回滚说明。

## MergeGate

多个 WorkShard 合并前的门禁，用于检查 writeSet 冲突、契约兼容、测试结果、文档一致性、审批要求、数据分级和统一 owner。MergeGate 不能绕过 ApprovalGate。

## ApprovalGate

高风险动作前的显式人工审批闸门。

## Skill

智能体能力封装，可复用领域知识、流程模板和工具使用约束。

## ToolContract

对工具的结构化契约，定义权限、schema、风险等级和审计标签。

## Observation

运行中产生的结构化观察记录，包括日志、指标、trace、反馈和输出。

## RealityCapture

后续探索能力，指通过手机或普通设备采集现实任务输入，例如照片、视频、OCR、定位、扫码、录音、转写和现场确认。RealityCapture 不属于当前软件层 MVP 前置条件；未来若进入实现，产生的数据必须作为受数据分级、脱敏、授权和保留期约束的 Observation 处理，不能默认进入训练资源或公开分享。

## LearningArtifact

可被系统再次利用的学习沉淀物，如 prompt、模板、策略、优质案例、失败样本或复盘报告。

## CapabilityDiscovery

发现成员显性能力和潜在能力的候选分析过程。它可以参考成员自述、兴趣、学习目标、ContributionRecord、review、WorkItem 结果和人工确认，但不能自动生成绩效、处罚、排名或强制分派结论。

## TeachingMaterial

面向学习和上手的教材资产。MVP 阶段优先使用文档教材，围绕“这是什么、为什么重要、如何跑通、常见失败、可复制模板、下一步入口”组织。

## LearningPath

围绕角色、任务、模板或 DomainPack 的学习路径。MVP 只要求存在从 README 到 Demo Mode、首个模板和 ExecutionReportCard 的最短路径。

## TeachingStrategy

系统提供教学的方式。MVP 固定为 document-first，后续可以扩展为示例、问答、练习、pair review、任务反馈和错题复盘。

## GrowthWorkItem

同时具备生产价值和学习价值的 WorkItem。它可以被 AI 推荐，但领取应保持自愿。

## CapabilityProof

能力证据，而不是单一能力分。它可以来自完成的任务、文档改进、模板贡献、review、评测样本、失败复盘或公开案例。

## AI-assisted work proof

用户在 AI-HRMS 中完成的一次可展示工作证明，通常包含目标、输入引用、受控 AI 协作过程、人工复核点、ExecutionReportCard，以及可选的 CapabilityProof、LearningPath 或后续 GrowthWorkItem。

## KeywordHelpOverlay

后续文档体验能力。用户阅读文档时，可通过快捷键或聚焦关键词唤起弹窗，查看术语解释、来源文档、示例、相关概念和下一步链接。

## Experiment

对候选变更进行假设检验和对照评估的受控试验单元。

## PolicyRule

治理策略规则，覆盖预算、权限、审批触发与数据访问限制。

## ProjectInstance

一个 AI-HRMS 运行实例。可以由一个人运行，也可以由多个成员共同使用；可以表示个人工作系统、开源项目工作台、小团队工作台、社区组织、合作社、工作室、企业内部团队或临时项目组。

## AI-HRMS Instance

ProjectInstance 的同义表达，强调它是一个独立运行、独立治理和独立审计的 AI-HRMS 实例。

## InstanceMember

ProjectInstance 的成员，拥有实例内角色、权限、审批责任、资源配额和可见范围。

## MemberCapabilityProfile

用于智能分派的成员画像，记录技能、兴趣、学习目标、偏好任务类型、负载、可用时间、历史交付质量、review 质量、数据可见范围、审批责任和可承担风险等级。它只能作为分派建议输入，不能扩大权限或替代审批责任。

## MemberRights

成员围绕 AI 分派、成员画像、贡献记录和个人权益影响拥有的查看、拒绝、协商、修正、撤回、申诉和复审权利。AI-HRMS 不能把成员变成服从 AI 分派的执行资源。

## ContributionRecord

对 code、docs、templates、eval samples、tool contracts、failure reports、translations、design discussions、review notes、usage reports、维护和社区协调等贡献的结构化记录。贡献记录应按类型呈现，不能压缩成单一贡献分或自动绩效结论。

## GovernanceBrain

ProjectInstance 内长期陪伴项目演化的治理型 AI 中枢。它连接项目上下文、成员画像、任务、模型能力画像、评测、审批、失败样本和学习候选，用于项目理解、智能分派、多人协调、模型能力治理和受控自我迭代。它不能替代人类 owner，也不能绕过 ApprovalGate、审计、预算和数据分级。

## TaskFitAssessment

GovernanceBrain 对 WorkItem 与候选 HumanActor、CommunityActor、AgentActor 或跨实例能力之间适配度的结构化评估，包含候选执行者、理由、风险、权限边界、替代方案、信心分和是否需要人工确认。

## FederationPeer

另一个可协作的 AI-HRMS 实例。Peer 不代表默认信任。

## FederationLink

两个 ProjectInstance 之间的显式协作连接，声明对方实例身份、信任等级、允许共享的数据类型、允许协作的 WorkItem 类型、允许交换的模板类型、允许暴露的能力、审计要求、速率限制和撤销方式。

## FederationGateway

处理跨实例能力发现、授权校验、消息审计、模板交换和脱敏评测摘要交换的网关或连接器边界。

## FederationProtocol

不同 ProjectInstance 之间通信的最小稳定协议面，定义实例发现、消息封套、版本兼容、回执、错误和扩展规则。

## FederationManifest

实例公开的协议发现文档，声明支持的协议版本、消息类型、schema、公开端点、速率限制和公开联系信息，不包含私有数据。

## FederationMessage

跨实例通信的统一消息封套，包含 protocolVersion、messageId、messageType、messageVersion、发送方、接收方、FederationLink、trace、policy、payload、extensions、audit 和 signature。

## FederationReceipt

接收方对 FederationMessage 的处理回执，说明消息被接受、拒绝、入队、阻塞、需要审批或被识别为重复。回执不等同于业务动作完成。

## CapabilityOffer

一个实例对外公开的能力描述，包括能力名称、输入要求、输出类型、风险等级、是否需要人工审批、成本估计、延迟估计、数据使用边界、可用时间和调用限制。

## CapabilityRequest

一个实例向另一个实例请求协作，包括请求目标、输入引用、数据分级、期望输出、预算、截止时间、审批要求、回调方式和失败处理。

## SharedTemplate

可被公开或定向共享的 Workflow Template、Skill Recipe 或 ToolContract。

## SharedEvalSummary

脱敏后的评测摘要，只包含聚合指标、样本类型、失败分类和版本信息，不包含用户私有数据、敏感字段、原始上下文或内部任务内容。

## ExecutionReportCard

AI 完成任务后生成的可分享执行报告卡。它的 canonical source 是带 `schemaVersion` 的结构化 JSON；Markdown、HTML、Web UI 卡片和案例库页面都是渲染物。

## FairnessAnalysisReport

AI 对分派、贡献评价、冲突处理或 HR 高风险场景生成的公平分析报告。它只能作为人工复核输入，必须说明事实来源、个人权益影响、集体权益影响、不确定性、替代方案和申诉路径，不能替代人类裁决。

## DesensitizedTrainingResource

敏感或受限数据经过脱敏、审批、审计、用途限定和保留期约束后形成的训练、评测或模型能力改进资源。原始敏感数据不得直接作为训练资源保留。

## Community Commons

由用户明确发布并可复用的公共资产集合，包括模板、工具契约、脱敏评测摘要、公开案例、失败样本和复盘报告。

## Anti-capture

通过许可证候选、商标、开放协议、社区治理、Commons 资产、贡献者声誉和实例网络降低商业捕获、闭源 SaaS 吸血、品牌冒用和生态夺取风险的组合策略。

## ResourceProfile

系统启动或配置时记录的资源画像，包括 CPU、内存、GPU、磁盘、网络、本地模型、远程模型、用户预算、并发上限和隐私偏好。

## AdaptiveRuntimePolicy

根据 ResourceProfile 决定模型路由、embedding、长期记忆、观测、并发、降级、拆分任务和人工接管的策略。

## ModelCapabilityProfile

某个 ModelRoute 背后模型能力的可评测画像，描述推理、代码、长上下文、结构化输出、工具调用、检索配合、多语言、安全拒答、一致性、成本、延迟、数据分级适用范围、风险等级适用范围、已通过评测和已知失败模式。

## Adaptive Model Router

根据资源、成本、延迟、数据分级、模型可用性和预算选择本地模型、远程模型、mock 模型或人工接管的模型路由能力。

## Adaptive Task Scheduler

根据资源档位、预算、并发、任务风险和截止时间调度、暂停、恢复、拆分或阻塞 WorkItem / AgentRun 的能力。

## Tiny Mode

面向低配设备、旧电脑、轻量试用和教学的运行档位，通常使用文件存储或 SQLite、mock model、远程低成本模型或手动执行模式。

## Demo Mode

面向首次体验的运行档位，目标是在 5 到 10 分钟内跑通最小闭环并生成 ExecutionReportCard。

## Local Mode

面向个人长期使用的运行档位，使用本地数据库、可选 Docker Compose、本地或远程模型、基础权限、基础审计、基础模板库和低成本模型路由。

## Community Mode

面向多人共用实例的运行档位，支持多用户、角色权限、审批流、审计查询、模板共享、成员协作、资源配额和可选 FederationLink。

## Enterprise Mode

面向企业、严肃组织和强治理场景的运行档位，包含 Keycloak、Temporal、PostgreSQL、LiteLLM Proxy、OpenTelemetry、Grafana/Loki/Tempo/Langfuse、环境隔离、备份恢复、灰度发布、完整 ApprovalGate 和完整审计。

## DomainWorkflow

面向某个领域的可复用工作流，如招聘筛选、入职流程、政策问答、GitHub issue 分流、社区 onboarding 或客户反馈整理。

## DomainPack

围绕某个领域组织的一组 Workflow Template、Skill Recipe、ToolContract、Eval sample、Failure case 和 Review note。

## OrgRoot

单企业私有化部署下的组织根实体，承载企业主体资料和最高层组织边界；在社区或团队场景下可映射到 ProjectInstance 背后的组织边界。

## EmployeeProfile

与账号分离的人事档案，承载身份、教育、联系方式、薪保账户、前司与附件等长期事实。

## AttendanceRecord

围绕某员工某日期形成的考勤事实，至少包含状态、签到和签退时间、地点与备注。

## AccessRole

可分配给 HumanActor、CommunityActor 或 AgentActor 的角色集合，定义授权范围而不是页面展示本身。

## PermissionResource

可被授予、回收或审计的权限对象，粒度至少包括菜单、操作点和 API。

## CommunityPost

用于公告、问答或经验沉淀的协作内容项，可被检索，但不是人事事实真相。

## Control Plane

负责事实、权限、审批、审计和 API 的核心控制面。

## Agent Runtime

负责 agent graph 执行、上下文组装、工具调用和 HITL 中断恢复的运行面。

## Durable Workflow

支持长流程、恢复、补偿与人工介入的工作流骨干。

## Environment

承载系统运行、验证或发布的隔离边界。v1 至少区分 `dev`、`ci`、`staging` 和 `prod`，不同环境拥有独立数据、配置、身份、模型路由、预算和审计边界。

## Environment Promotion

代码、配置、prompt、workflow、策略、模型路由或迁移从低风险环境向高风险环境单向晋级的过程，必须经过评测、审批、审计和回滚设计。

## AgentRun

某个 AgentActor 围绕一个 WorkItem 执行一次 LangGraph graph 的运行实例，必须绑定环境、策略版本、预算快照、工具授权和 checkpoint。

## EvalRun

对候选 prompt、workflow、工具策略、模型路由或学习沉淀物进行评测的一次运行记录，必须绑定数据集版本、评分器版本、基线版本和候选版本。

## ToolGrant

某次 AgentRun 可使用的工具授权快照。它来自 ToolContract 和 PolicyRule 的交集，不等同于 AgentActor 的全部能力。

## PolicyEvaluation

系统对某次请求、工具调用、数据访问或发布动作进行策略判断的结果，至少包含策略版本、命中规则、风险等级、决策和理由。

## RiskLevel

描述动作或对象风险的受控等级，v1 使用 `low`、`medium`、`high`、`critical`。

## DataClassification

描述数据敏感程度的受控等级，v1 使用 `public`、`internal`、`restricted`、`sensitive`。

## ModelRoute

模型网关中的受控路由配置，定义可用模型、供应商、预算、限流、数据分级规则和审计要求。

## AuditEvent

不可随意修改的审计记录，用于说明谁在什么时间、基于什么原因和策略，对哪些输入输出引用执行了什么动作，以及如何回滚或追溯。
