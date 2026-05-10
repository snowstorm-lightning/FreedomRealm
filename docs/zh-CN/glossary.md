# 术语表

## HumanActor

系统中的人类参与者，拥有组织身份、职责、权限和审批责任。

## CommunityActor

社区维度下的人类参与者，可与 HumanActor 关联，但在 ProjectInstance 内保留独立角色、贡献记录、权限和可见范围。

## AgentActor

系统中的智能体参与者，拥有独立身份、策略、预算、工具边界、能力、风险等级和审计轨迹。

## WorkItem

最小可管理工作单元，可被创建、分派、审批、关闭与学习。

## ApprovalGate

高风险动作前的显式人工审批闸门。

## Skill

智能体能力封装，可复用领域知识、流程模板和工具使用约束。

## ToolContract

对工具的结构化契约，定义权限、schema、风险等级和审计标签。

## Observation

运行中产生的结构化观察记录，包括日志、指标、trace、反馈和输出。

## LearningArtifact

可被系统再次利用的学习沉淀物，如 prompt、模板、策略、优质案例、失败样本或复盘报告。

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

## FederationPeer

另一个可协作的 AI-HRMS 实例。Peer 不代表默认信任。

## FederationLink

两个 ProjectInstance 之间的显式协作连接，声明对方实例身份、信任等级、允许共享的数据类型、允许协作的 WorkItem 类型、允许交换的模板类型、允许暴露的能力、审计要求、速率限制和撤销方式。

## FederationGateway

处理跨实例能力发现、授权校验、消息审计、模板交换和脱敏评测摘要交换的网关或连接器边界。

## CapabilityOffer

一个实例对外公开的能力描述，包括能力名称、输入要求、输出类型、风险等级、是否需要人工审批、成本估计、延迟估计、数据使用边界、可用时间和调用限制。

## CapabilityRequest

一个实例向另一个实例请求协作，包括请求目标、输入引用、数据分级、期望输出、预算、截止时间、审批要求、回调方式和失败处理。

## SharedTemplate

可被公开或定向共享的 Workflow Template、Skill Recipe 或 ToolContract。

## SharedEvalSummary

脱敏后的评测摘要，只包含聚合指标、样本类型、失败分类和版本信息，不包含用户私有数据、敏感字段、原始上下文或内部任务内容。

## ExecutionReportCard

AI 完成任务后生成的可分享执行报告卡，包含任务目标、发起者、执行者、Skill、ToolContract、风险等级、审批结果、成本、延迟、节省时间估算、失败与人工修正、模板引用、脱敏状态和公开分享许可。

## Community Commons

由用户明确发布并可复用的公共资产集合，包括模板、工具契约、脱敏评测摘要、公开案例、失败样本和复盘报告。

## Anti-capture

通过许可证候选、商标、开放协议、社区治理、Commons 资产、贡献者声誉和实例网络降低商业捕获、闭源 SaaS 吸血、品牌冒用和生态夺取风险的组合策略。

## ResourceProfile

系统启动或配置时记录的资源画像，包括 CPU、内存、GPU、磁盘、网络、本地模型、远程模型、用户预算、并发上限和隐私偏好。

## AdaptiveRuntimePolicy

根据 ResourceProfile 决定模型路由、embedding、长期记忆、观测、并发、降级、拆分任务和人工接管的策略。

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
