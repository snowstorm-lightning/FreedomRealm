# 术语表

## HumanActor

系统中的人类参与者，拥有组织身份、职责和审批责任。

## AgentActor

系统中的智能体参与者，拥有独立身份、策略、预算和工具边界。

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

可被系统再次利用的学习沉淀物，如 prompt、模板、策略或优质案例。

## Experiment

对候选变更进行假设检验和对照评估的受控试验单元。

## PolicyRule

治理策略规则，覆盖预算、权限、审批触发与数据访问限制。

## OrgRoot

单企业私有化部署下的组织根实体，承载企业主体资料和最高层组织边界。

## EmployeeProfile

与账号分离的人事档案，承载身份、教育、联系方式、薪保账户、前司与附件等长期事实。

## AttendanceRecord

围绕某员工某日期形成的考勤事实，至少包含状态、签到和签退时间、地点与备注。

## AccessRole

可分配给 HumanActor 或 AgentActor 的角色集合，定义授权范围而不是页面展示本身。

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
