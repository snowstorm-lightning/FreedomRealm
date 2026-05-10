# 业务蓝图

## 业务目标

AI-HRMS v1 围绕“工作被谁执行、如何被分派、如何被审批、如何被学习、由哪个实例负责”建立统一模型。系统既保留传统 HRMS 场景，也支持 agent-first、个人、社区、多人成员实例和跨实例协作场景。所有自动化都必须服从事实、审批、预算、数据分级和审计边界。

AI-HRMS 是 AI 时代的人类与智能体资源管理系统。它不只管理员工、组织、考勤、档案、审批和协作内容，还管理 HumanActor、AgentActor、WorkItem、ToolContract、ApprovalGate、PolicyRule、Observation、LearningArtifact、ProjectInstance、DomainWorkflow、模板、评测和实例间协作关系。

## 核心概念

### HumanActor

具备组织身份、职责、权限和审批责任的人类参与者。

### CommunityActor

社区维度下的人类参与者。可与 HumanActor 关联，但保留 ProjectInstance 内独立角色、贡献记录、权限和可见范围。

### InstanceMember

ProjectInstance 的成员。可以拥有不同角色、权限、审批责任、资源配额和可见范围。

### AgentActor

ProjectInstance 内注册的 AI 执行者。具备注册身份、能力、工具、预算、风险等级、审计轨迹和运行策略。

### WorkItem

系统中的最小可管理工作单元，可被人类、智能体或跨实例协作能力领取、拆解、执行、暂停、升级或关闭。

### ApprovalGate

高风险动作前的显式人工闸门，负责批准、驳回、修改建议或升级审查。

### Skill

面向智能体的能力封装，定义可复用的领域知识、步骤约束或工具使用方式。

### ToolContract

工具的权限边界与输入输出约束，要求具备明确 schema、审计标签和风险等级。

### Observation

系统运行中产生的结构化观察，包括日志、指标、trace、用户反馈、任务结果和模型输出。

### LearningArtifact

可进入学习飞轮的沉淀物，如优质提示词、任务分解模板、工具调用策略、知识摘要、评分样本或失败复盘。

### Experiment

面向提示词、工作流或策略候选项的受控试验单元，必须具备假设、样本、指标和退出条件。

### PolicyRule

治理规则集合，覆盖身份、预算、工具白名单、审批触发条件、数据访问等级和发布约束。

### ProjectInstance

一个 AI-HRMS 运行实例，也可称为 AI-HRMS Instance。它可以是个人工作系统、开源项目工作台、小团队工作台、社区组织、合作社、工作室、企业内部团队或临时项目组。

### FederationPeer

另一个可协作的 AI-HRMS 实例。Peer 不代表默认信任。

### FederationLink

两个 ProjectInstance 之间的显式协作连接。必须声明对方实例身份、信任等级、共享数据类型、可协作 WorkItem 类型、可交换模板类型、可暴露能力、审计要求、速率限制和撤销方式。

### CapabilityOffer

一个实例对外公开的能力描述，包括能力名称、输入要求、输出类型、风险等级、是否需要人工审批、成本估计、延迟估计、数据使用边界、可用时间和调用限制。

### CapabilityRequest

一个实例向另一个实例请求协作，包括请求目标、输入引用、数据分级、期望输出、预算、截止时间、审批要求、回调方式和失败处理。

### SharedTemplate

可被公开或定向共享的 Workflow Template、Skill Recipe 或 ToolContract。

### SharedEvalSummary

脱敏后的评测摘要。只能包含聚合指标、样本类型、失败分类和版本信息，不得包含用户私有数据、敏感字段、原始上下文或内部任务内容。

### ExecutionReportCard

AI 完成任务后生成的可分享执行报告卡。字段包括任务目标、发起者、执行者、使用的 Skill、调用的 ToolContract、风险等级、审批结果、成本、延迟、节省时间估算、失败与人工修正、可复用模板引用、脱敏状态和公开分享许可。

### ResourceProfile

系统启动或配置时记录的资源画像，包括 CPU、内存、GPU、磁盘、网络、本地模型、远程模型、用户预算、并发上限和隐私偏好。

### AdaptiveRuntimePolicy

根据 ResourceProfile 决定模型路由、embedding、长期记忆、观测、并发、降级、拆分任务和人工接管的策略。

### DomainWorkflow

面向某个领域的可复用工作流，如招聘筛选、入职流程、政策问答、issue 分流、社区 onboarding 或客户反馈整理。

### DomainPack

围绕某个领域组织的一组 Workflow Template、Skill Recipe、ToolContract、Eval sample、Failure case 和 Review note。

## 边界上下文

### 1. Workforce & Org

- 组织根事实：企业主体、社区组织、团队或 ProjectInstance 背后的组织边界。
- 部门树事实：保留父子层级、部门编码、负责人、介绍、创建时间和汇报关系。
- 账号事实：手机号、用户名、启用状态、角色级别、工号、工作城市、聘用形式、管理形式、入职、转正和离职时间。
- 员工档案事实：身份证明、联系方式、紧急联系人、教育经历、银行账户、社保公积金、前司信息、竞业限制、附件与备注。
- `账号` 和 `员工档案` 是两个边界。前者承载身份与访问，后者承载雇佣和人事事实。

### 2. Work Orchestration

- `WorkItem` 创建、拆分、分派、升级、关闭。
- 任务 SLA、优先级、依赖与补偿。
- 人类、AgentActor、CommunityActor 和跨实例协作能力的统一分派。
- 与员工、部门、ProjectInstance、政策、知识和审批动作之间的引用关系。

### 3. Agent Operations

- `AgentActor` 注册、版本、能力、预算。
- 工具授权与运行策略。
- AgentRun 生命周期与中断恢复。
- 对 HR 事实的只读、建议写入和审批触发边界。

### 4. Knowledge & Learning

- 知识采集、索引、检索和记忆。
- `Observation` 汇聚。
- `LearningArtifact`、`Experiment`、评测数据集。
- 公告、帖子、评论、FAQ 等协作内容可进入知识索引，但不是人事事实真相。

### 5. Governance & Audit

- `ApprovalGate`、`PolicyRule`。
- 审计日志、风险分级、异常处置。
- 发布、回滚和治理报表。
- 跨实例通信、ExecutionReportCard、资源降级和 Commons 资产发布的审计。

### 6. Federation & Commons

- ProjectInstance、FederationPeer、FederationLink。
- CapabilityOffer、CapabilityRequest。
- SharedTemplate、SharedEvalSummary。
- Community Commons 的贡献、署名、复用、修正和撤回。
- 默认不互信、默认不共享私有数据、默认不允许远程实例直接调用本地高风险工具。

### 7. Adaptive Runtime

- ResourceProfile。
- AdaptiveRuntimePolicy。
- Adaptive Model Router。
- Adaptive Task Scheduler。
- Tiny / Demo / Local / Community / Enterprise 运行档位。
- 资源降级不能绕过审批、安全、审计、预算和数据分级。

### 8. Growth & Adoption

- 最小可传播 Demo。
- ExecutionReportCard。
- 模板传播机制。
- 案例库、指标面板和贡献者声誉。
- 面向个人、社区、开源项目和企业内部创新者的采用路径。

## 核心对象状态

### WorkItem 状态

| 状态 | 含义 | 允许进入方式 | 退出条件 |
| --- | --- | --- | --- |
| `draft` | 目标、上下文或风险尚未确认 | 人类创建、系统草稿 | 补齐目标、请求方、范围和风险 |
| `triaged` | 已完成初步分流 | 人类分流或策略自动分流 | 分派给 HumanActor、AgentActor 或协作能力 |
| `assigned_to_human` | 由人类执行 | 分派动作 | 人类开始处理、转交或关闭 |
| `assigned_to_agent` | 由智能体执行 | 分派动作且策略允许 | 启动 AgentRun 或回退人工 |
| `in_progress` | 正在执行 | 执行者领取或 AgentRun 启动 | 完成、阻塞或进入审批 |
| `blocked` | 等待外部信息、系统恢复或人工处理 | 执行失败、依赖未满足 | 解除阻塞或取消 |
| `awaiting_approval` | 等待 ApprovalGate 决策 | 高风险动作请求 | 批准、驳回、修改后批准或升级 |
| `completed` | 交付完成 | 审批通过或低风险执行完成 | 进入学习沉淀 |
| `learned` | 观察、反馈或样本已沉淀 | 完成后采集 Observation | 关闭生命周期 |

状态推进必须写入审计事件。`completed` 不能直接跳过必要的 `ApprovalGate`。

### AgentRun 生命周期

- `created`：控制面创建运行请求，绑定 `WorkItem`、策略版本和预算快照。
- `running`：运行面开始执行 LangGraph graph。
- `interrupted`：等待人工输入、审批、工具恢复或上下文补充。
- `succeeded`：输出候选结果、建议或已授权工具执行结果。
- `failed`：运行失败且已写入失败原因、重试建议和审计引用。
- `cancelled`：由人类、策略或预算约束终止。

每个 AgentRun 必须有 `runId`、`agentActorId`、`workItemId`、`env`、`policyVersion`、`toolGrants`、`budgetSnapshot` 和 `checkpointRef`。

### ApprovalGate 决策

| 决策 | 含义 | 后续动作 |
| --- | --- | --- |
| `approve` | 按原建议执行 | Temporal 继续流程，执行高风险动作 |
| `reject` | 拒绝建议 | WorkItem 回到执行态或关闭为拒绝 |
| `edit_and_approve` | 人类修改后批准 | 使用人类修改版本继续执行 |
| `escalate` | 升级审查 | 转交更高权限审批人或合规角色 |

审批记录必须保留审批人、理由、输入引用、输出引用、策略判断和回滚引用。

## 风险分级

| 风险等级 | 示例 | 默认控制 |
| --- | --- | --- |
| `low` | 知识问答、草稿生成、只读摘要 | 可自动执行，记录审计 |
| `medium` | 内部通知草稿、普通任务分派、低敏数据读取 | 可受策略自动执行，异常升级 |
| `high` | 员工档案修正、考勤补签、外部正式通知、跨实例协作请求 | 必须触发 ApprovalGate |
| `critical` | 薪酬、雇佣、合同、权限、模型路由、预算或 FederationLink 高权限变更 | 强审批、双人复核、显式回滚 |

风险等级由 `PolicyRule` 计算，不能由前端或模型输出自行决定。

## 跨实例信任与数据共享

信任等级建议：

- `unknown`
- `known`
- `trusted`
- `verified`
- `blocked`

数据共享等级建议：

- `none`
- `public_metadata`
- `templates_only`
- `anonymized_eval_summaries`
- `approved_work_collaboration`

跨实例协作规则：

- 默认不互信。
- 默认不共享私有数据。
- 默认不允许远程实例直接调用本地高风险工具。
- 跨实例协作必须显式授权。
- 跨实例通信必须记录审计。
- 授权必须可撤销。
- 敏感数据不得进入跨实例消息。
- 高风险动作必须回到本实例 ApprovalGate。

## 传统 HRMS 领域细节

### 考勤事实

- `AttendanceRecord` 必须至少包含员工、部门、组织、日期、签到时间、签退时间、地点、状态和备注。
- `attendanceStatus` 使用受控枚举，至少覆盖正常、旷工、迟到、早退、外出、出差、年假、事假、病假、婚假、丧假、产假、奖励产假、陪产假、探亲假、工伤假、调休、产检假、流产假、长期病假和补签。
- 调试型、占位型或仅为开发方便存在的状态值不得直接进入正式词表。

### 访问控制

- 角色分配与权限分配分离，不能把菜单展示逻辑当作唯一授权来源。
- 权限粒度至少覆盖菜单、操作点、API 三层。
- 权限还要声明可见范围，例如平台级可见、企业级可见、ProjectInstance 级可见和社区贡献级可见。
- 角色命名必须使用正式词表，避免把界面显示、历史实现细节或临时字符串直接固化为治理模型。

### 协作内容

- 帖子和评论可以保留为正式协作内容类型，用于公告、答疑和经验沉淀。
- 协作内容可以被检索和摘要，但不能直接替代审批结论、雇佣事实或权限事实。
- 富文本、附件和删除动作必须纳入审计和内容治理。

### 导出与批量动作

- 员工名册、考勤报表、批量授权、补签修正、模板导出、ExecutionReportCard 公开分享等动作必须具备审计点。
- 是否要求 `ApprovalGate` 由风险策略决定，不能由前端或 agent 自行绕过。

## v1 边界约束

- 公司、社区、部门或 ProjectInstance 不能因为一次名称查询失败而被自动创建。
- 控制面不按 `company/system/employee/message` 这类 CRUD 服务边界直接拆分部署。
- v1 范围不包含面向 SaaS 的余额、续费、版本和交易流水语义；如未来引入，必须先定义商业、审计和合规模型。
- 所有正式接口都必须版本化，不能使用未版本化路径作为长期契约。
- 前端不得直接拼接后端服务地址并通过跨域方式耦合多个服务。
- v1 不实现完整分布式计算网络，不承诺完全无人自治组织。
- v1 不默认上传用户私有数据，不允许跨实例协作绕过本地 ApprovalGate。

## v1 关键能力

- 统一的人机工作台与工作单模型。
- 组织、账号、员工档案与考勤事实的一体化控制面。
- ProjectInstance、InstanceMember 和 CommunityActor 的最小模型。
- 任务分派给人类或智能体的统一路由。
- 高风险动作的审批闸门。
- 角色、权限和审批策略的显式治理。
- 结构化知识与长期记忆。
- 协作内容、操作结果和审计记录的可检索沉淀。
- 提示词、流程候选和策略候选的评测与灰度发布。
- ExecutionReportCard。
- ResourceProfile 和 AdaptiveRuntimePolicy。
- FederationLink 的概念边界和审计模型。

## Owner 映射原则

每个核心能力都必须明确：

- 业务 owner。
- 技术 owner。
- 数据源。
- 接口入口。
- 权限边界。
- 审计点。
- 失败恢复方式。

## 能力验收示例

| 能力 | 最小验收 |
| --- | --- |
| 组织与部门 | 支持父子层级校验、负责人变更审计、子树删除风险提示和回滚引用 |
| 账号与档案 | 账号身份和员工档案分离，敏感字段按数据等级授权和审计 |
| 考勤 | 普通打卡、补签、人工修正和导出使用不同接口与审计标签 |
| 权限 | 有效权限能追溯到角色、权限资源、策略和授权操作者 |
| ProjectInstance | 单人和多人实例能区分成员、角色、审批责任和可见范围 |
| WorkItem | 每次状态迁移都有 actor、原因、时间、输入输出引用和失败恢复方式 |
| AgentActor | 能力、工具、预算、模型范围和禁止动作按环境和 ProjectInstance 绑定 |
| ApprovalGate | 高风险动作不能绕过审批，审批结果能驱动流程继续、回退或升级 |
| LearningArtifact | 只能作为候选进入评测和灰度流程，不能直接替换生产策略 |
| ExecutionReportCard | 可生成脱敏报告卡，公开分享必须有许可和审计引用 |
| FederationLink | 默认不互信，显式授权，可撤销，跨实例消息可审计 |
| AdaptiveRuntimePolicy | 资源不足时降级、阻塞或转人工，不能绕过审批和审计 |
