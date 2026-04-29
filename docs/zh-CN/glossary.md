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
