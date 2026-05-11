# v1 接口契约

## 契约原则

- 同步 API 使用 OpenAPI 描述
- 异步事件使用 AsyncAPI 描述
- 结构边界使用 JSON Schema 描述
- 前端以 Zod 校验边界，运行面以 Pydantic 校验边界
- 所有正式接口都必须挂在 `/api/v1/` 之下
- 所有写操作必须携带幂等键或具备业务唯一约束
- 所有请求必须能绑定 `env`、actor、权限上下文和审计上下文

## 全局约定

### 身份与授权

- API 调用方必须通过 Keycloak 颁发的 token 或内部 service account 认证。
- `HumanActor` 和 `AgentActor` 使用不同 subject 类型，不能复用 session。
- Agent Runtime 调用控制面时必须携带 `agentActorId`、`workItemId`、`runId` 和 `policyVersion`。
- 管理类接口必须声明所需 `PermissionResource`，不能只依赖前端菜单隐藏。

### 请求元数据

写请求推荐包含：

```json
{
  "meta": {
    "requestId": "uuid",
    "idempotencyKey": "string",
    "env": "staging",
    "actorType": "HumanActor",
    "actorId": "uuid",
    "projectInstanceId": "uuid",
    "workItemId": "uuid",
    "reason": "string"
  }
}
```

`projectInstanceId` 用于绑定 AI-HRMS Instance。`reason` 在高风险动作中必填。`env` 必须与服务端运行环境一致，客户端传入值只能用于校验和审计，不能决定真实环境。

### ID 与时间

- 外部契约使用不透明字符串 ID，推荐 UUID。
- 时间字段使用 ISO 8601，服务端统一转换为 UTC 存储。
- 日期字段如考勤 `day` 使用业务时区下的日期，不可与 UTC timestamp 混用。
- 所有列表接口必须定义稳定排序字段。

### 错误码

| 错误码 | 含义 |
| --- | --- |
| `validation_failed` | 请求结构、枚举、格式或必填字段不合法 |
| `unauthorized` | 未认证或 token 无效 |
| `forbidden` | 已认证但权限不足 |
| `not_found` | 目标资源不存在或不可见 |
| `conflict` | 幂等键冲突、版本冲突或唯一键冲突 |
| `approval_required` | 命中高风险策略，必须进入 ApprovalGate |
| `policy_violation` | 策略明确禁止该动作 |
| `budget_exceeded` | 预算不足或超出模型/工具限制 |
| `rate_limited` | 超出速率限制 |
| `dependency_unavailable` | 依赖系统、模型网关或工具不可用 |

错误响应必须避免泄漏敏感字段原文。

## 同步响应封套

- 正常响应统一返回 `data` 与 `meta`，必要时附带 `audit` 引用。
- 分页响应统一在 `meta.pagination` 中声明 `total`、`page`、`pageSize` 或游标信息。
- 错误响应统一返回 `error.code`、`error.message`、`error.details`，不得混用字符串化错误。
- 同步响应必须统一封套和分页元数据，但字段命名以 v1 正式契约为准。

示例：

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "env": "prod",
    "version": "v1"
  },
  "audit": {
    "auditEventId": "uuid",
    "policyEvaluationId": "uuid",
    "approvalId": "uuid"
  }
}
```

## 资源族

### Org Directory API

用途：维护组织根信息和部门树。

关键操作：
- `GET /api/v1/org/roots/{orgRootId}`
- `PATCH /api/v1/org/roots/{orgRootId}`
- `GET /api/v1/org/departments?orgRootId={orgRootId}`
- `GET /api/v1/org/departments/{departmentId}`
- `POST /api/v1/org/departments`
- `PATCH /api/v1/org/departments/{departmentId}`
- `DELETE /api/v1/org/departments/{departmentId}`

核心字段：
- `orgRootId`
- `departmentId`
- `parentDepartmentId`
- `name`
- `code`
- `managerActorId`
- `status`

审计点：
- 组织主体资料修改
- 部门树增删改
- 负责人变更
- 子树删除或重挂接

### Workforce Profile API

用途：维护账号、员工档案和在职生命周期。

关键操作：
- `GET /api/v1/workforce/accounts`
- `POST /api/v1/workforce/accounts`
- `GET /api/v1/workforce/accounts/{accountId}`
- `PATCH /api/v1/workforce/accounts/{accountId}`
- `POST /api/v1/workforce/accounts/{accountId}/roles`
- `GET /api/v1/workforce/employees/{employeeId}`
- `PATCH /api/v1/workforce/employees/{employeeId}`
- `POST /api/v1/workforce/employees/{employeeId}/employment-events`

核心字段：
- `accountId`
- `employeeId`
- `mobile`
- `username`
- `enableState`
- `employmentStatus`
- `departmentId`
- `workNumber`
- `timeOfEntry`
- `correctionTime`
- `timeOfDimission`

边界说明：
- 账号与员工档案必须分离建模。
- 手机号、工号等唯一键必须在契约层显式说明。
- 员工附件、身份证明、银行与社保字段必须声明敏感级别和可见范围。

审计点：
- 新建、禁用、解禁账号
- 档案敏感字段修改
- 在职状态变更
- 角色授予与回收

### Attendance API

用途：记录考勤、处理例外并导出报表。

关键操作：
- `GET /api/v1/attendance/records?employeeId={employeeId}`
- `GET /api/v1/attendance/records/today?employeeId={employeeId}`
- `POST /api/v1/attendance/records/check-in`
- `POST /api/v1/attendance/records/check-out`
- `PATCH /api/v1/attendance/records/{recordId}`
- `POST /api/v1/exports/attendance`

核心字段：
- `recordId`
- `employeeId`
- `departmentId`
- `orgRootId`
- `day`
- `attendanceStatus`
- `attendanceInTime`
- `attendanceOutTime`
- `attendanceInPlace`
- `remarks`

边界说明：
- `attendanceStatus` 必须使用集中定义的枚举。
- 补签、人工修正、批量导出不能复用普通签到接口。

审计点：
- 补签和手工修正
- 导出触发与下载
- 状态枚举变更

### Access Control API

用途：维护角色、权限目录和授权关系。

关键操作：
- `GET /api/v1/access/roles`
- `POST /api/v1/access/roles`
- `PATCH /api/v1/access/roles/{roleId}`
- `DELETE /api/v1/access/roles/{roleId}`
- `POST /api/v1/access/roles/{roleId}/permissions`
- `GET /api/v1/access/permissions`
- `GET /api/v1/access/permissions/{permissionId}`
- `POST /api/v1/access/accounts/{accountId}/roles`

核心字段：
- `roleId`
- `permissionId`
- `permissionType`
- `code`
- `visibilityScope`
- `apiMethod`
- `apiPath`
- `menuIcon`
- `menuOrder`

边界说明：
- `permissionType` 至少覆盖 `menu`、`point`、`api`。
- `visibilityScope` 至少区分平台级和企业级。
- 有效权限计算结果必须能追溯到角色和策略来源。

审计点：
- 角色创建、删除
- 权限授予、回收
- 菜单、按钮和 API 权限目录变更
- 越权提升尝试

### Collaboration Feed API

用途：承载公告、帖子、评论等协作内容。

关键操作：
- `GET /api/v1/community/posts`
- `POST /api/v1/community/posts`
- `GET /api/v1/community/posts/{postId}`
- `PATCH /api/v1/community/posts/{postId}`
- `DELETE /api/v1/community/posts/{postId}`
- `GET /api/v1/community/posts/{postId}/comments`
- `POST /api/v1/community/posts/{postId}/comments`

核心字段：
- `postId`
- `commentId`
- `category`
- `title`
- `content`
- `authorActorId`
- `orgScope`
- `departmentScope`
- `viewCount`
- `starCount`

边界说明：
- 富文本内容需要显式清洗和渲染策略。
- 协作内容可被知识索引消费，但不能替代审批或主数据接口。

审计点：
- 内容删除和可见范围变更
- 敏感词、附件和富文本治理
- 人工置顶、封禁或归档

### WorkItem API

用途：创建、查询、分派、升级和关闭工作项。

关键操作：
- `POST /api/v1/work-items`
- `GET /api/v1/work-items/{workItemId}`
- `POST /api/v1/work-items/{workItemId}/assign`
- `POST /api/v1/work-items/{workItemId}/transition`
- `POST /api/v1/work-items/{workItemId}/close`

核心字段：
- `workItemId`
- `title`
- `requestedBy`
- `assignedActor`
- `riskLevel`
- `status`
- `sla`
- `approvalPolicyId`

边界说明：
- `assignedActor` 必须区分 `HumanActor` 与 `AgentActor`。
- 状态迁移必须使用 transition 接口，不允许普通 PATCH 直接改状态。
- 高风险 WorkItem 必须绑定审批策略或给出策略豁免记录。

审计点：
- 创建、分派、升级、关闭
- 风险等级变更
- SLA 修改
- 从智能体转人工或从人工转智能体

### Project Instance API

用途：维护 `ProjectInstance`、`InstanceMember`、运行档位和实例级治理边界。

关键操作：
- `POST /api/v1/instances`
- `GET /api/v1/instances/{projectInstanceId}`
- `PATCH /api/v1/instances/{projectInstanceId}`
- `GET /api/v1/instances/{projectInstanceId}/members`
- `POST /api/v1/instances/{projectInstanceId}/members`
- `PATCH /api/v1/instances/{projectInstanceId}/members/{memberId}`

核心字段：
- `projectInstanceId`
- `instanceType`
- `runtimeMode`
- `ownerActorId`
- `memberId`
- `memberRole`
- `approvalResponsibilities`
- `visibilityScope`
- `memberCapabilityProfileRef`

边界说明：
- 单人实例和多人实例必须使用同一 ProjectInstance 语言。
- `runtimeMode` 必须使用 Tiny、Demo、Local、Community、Enterprise 的受控枚举。
- 成员权限不能只由前端展示决定。
- `MemberCapabilityProfile` 只能作为分派建议输入，不能扩大数据可见范围或替代审批责任。

审计点：
- 实例创建、归档和运行档位变更
- 成员新增、移除、角色变更
- 审批责任和可见范围变更
- 成员能力、兴趣、可用性、负载、偏好任务类型和可承担风险等级变更

### Governance Brain API

用途：维护 `GovernanceBrain` 的项目上下文图谱、成员能力画像、任务适配评估、模型能力画像引用和治理建议。

关键操作：
- `GET /api/v1/governance-brain/context-baseline?projectInstanceId={projectInstanceId}`
- `POST /api/v1/governance-brain/task-fit-assessments`
- `GET /api/v1/governance-brain/task-fit-assessments/{assessmentId}`
- `POST /api/v1/governance-brain/member-capability-profiles`
- `PATCH /api/v1/governance-brain/member-capability-profiles/{profileId}`
- `POST /api/v1/governance-brain/conflict-reports`
- `POST /api/v1/governance-brain/improvement-candidates`

核心字段：
- `governanceBrainId`
- `projectInstanceId`
- `sourceRefs`
- `baselineVersion`
- `memberCapabilityProfileId`
- `skills`
- `interests`
- `learningGoals`
- `availability`
- `currentLoad`
- `preferredWorkTypes`
- `deliveryQualitySignals`
- `reviewQualitySignals`
- `riskLevelAllowed`
- `dataVisibilityScope`
- `assessmentId`
- `workItemId`
- `candidateAssignees`
- `recommendedHumanOwner`
- `recommendedAgentContributors`
- `fitScore`
- `confidence`
- `reason`
- `requiresHumanConfirmation`
- `modelCapabilityRequirements`

边界说明：
- `TaskFitAssessment` 是可审计建议，不是强制分派结果。
- 高风险任务必须保留人类 owner 和 `ApprovalGate` 责任链。
- 成员画像不能用于绕过权限、扩大可见范围或降低数据分级。
- 改进候选必须进入 `LearningArtifact`、`Experiment`、`EvalRun` 和审批流程，不能直接覆盖生产配置。

审计点：
- 项目基线解释生成
- 成员画像创建和修改
- 任务适配评估生成
- 分派建议被接受、修改或拒绝
- 文档、接口、术语或治理冲突报告生成
- 自我迭代候选生成

### Federation API

用途：管理跨实例授权协作、能力发现、模板共享和脱敏评测摘要交换。

关键操作：
- `GET /.well-known/ai-hrms-instance.json`
- `GET /api/v1/federation/manifest`
- `POST /api/v1/federation/messages`
- `GET /api/v1/federation/messages/{messageId}/receipt`
- `POST /api/v1/federation/peers`
- `POST /api/v1/federation/links`
- `PATCH /api/v1/federation/links/{federationLinkId}`
- `POST /api/v1/federation/capability-offers`
- `POST /api/v1/federation/capability-requests`
- `POST /api/v1/federation/shared-templates/import`
- `POST /api/v1/federation/shared-eval-summaries`

核心字段：
- `federationPeerId`
- `federationLinkId`
- `protocol`
- `protocolVersion`
- `messageId`
- `messageType`
- `messageVersion`
- `correlationId`
- `federationReceiptId`
- `receiptStatus`
- `trustLevel`
- `dataSharingLevel`
- `allowedWorkItemTypes`
- `allowedTemplateTypes`
- `capabilityOfferId`
- `capabilityRequestId`
- `revocationRef`

边界说明：
- 默认不互信，默认不共享私有数据。
- 跨实例互操作必须使用 `FederationMessage` envelope，二次开发不能修改标准 envelope 字段语义。
- 自定义跨实例能力必须通过 `CapabilityOffer`、JSON Schema 和 namespaced `extensions` 扩展。
- 接收方必须对 `messageId` 幂等处理。
- 不支持的 `protocolVersion`、`messageType` 或已撤销 `FederationLink` 必须明确拒绝。
- 远程实例不能直接调用本地高风险工具。
- 高风险动作必须回到本实例 ApprovalGate。
- `SharedEvalSummary` 只能包含聚合指标、样本类型、失败分类和版本信息。

审计点：
- Manifest 读取和协议版本协商
- FederationMessage 接收、拒绝、入队和回执
- Peer 登记和阻断
- FederationLink 创建、权限变更和撤销
- CapabilityOffer 发布
- CapabilityRequest 调用、失败和回调
- SharedTemplate 导入
- SharedEvalSummary 导出

### Runtime Profile API

用途：记录 `ResourceProfile`、读取 `AdaptiveRuntimePolicy` 和解释资源降级决策。

关键操作：
- `POST /api/v1/runtime/resource-profiles`
- `GET /api/v1/runtime/resource-profiles/{resourceProfileId}`
- `POST /api/v1/runtime/model-capability-profiles`
- `GET /api/v1/runtime/model-capability-profiles/{modelCapabilityProfileId}`
- `GET /api/v1/runtime/adaptive-policy?projectInstanceId={projectInstanceId}`
- `POST /api/v1/runtime/decisions`

核心字段：
- `resourceProfileId`
- `projectInstanceId`
- `runtimeMode`
- `cpuCores`
- `memoryBytes`
- `gpuAvailable`
- `networkStatus`
- `localModelAvailable`
- `remoteModelAvailable`
- `budgetLimit`
- `concurrencyLimit`
- `privacyPreference`
- `modelCapabilityProfileId`
- `modelRouteId`
- `capabilityScores`
- `contextWindow`
- `structuredOutputSupport`
- `toolCallingSupport`
- `dataClassificationAllowed`
- `riskLevelAllowed`
- `evalRunRefs`
- `knownFailureModes`
- `fallbackModelRouteIds`
- `adaptiveDecision`

边界说明：
- ResourceProfile 只能作为策略输入，不能作为安全豁免。
- 降级不能绕过 ApprovalGate、审计、预算和数据分级。
- ModelCapabilityProfile 只能作为路由和评测输入，不能因为模型能力强而放宽审批、权限或数据分级。

审计点：
- 运行档位识别
- 模型能力画像创建、变更和失效
- 模型路由降级
- 任务暂停、拆分、阻塞或人工接管
- 预算耗尽

### Execution Report API

用途：生成、查看、脱敏和分享 `ExecutionReportCard`。

关键操作：
- `POST /api/v1/reports/execution-cards`
- `GET /api/v1/reports/execution-cards/{reportCardId}`
- `POST /api/v1/reports/execution-cards/{reportCardId}/share`

核心字段：
- `reportCardId`
- `schemaVersion`
- `generatedAt`
- `projectInstanceId`
- `workItemId`
- `agentRunId`
- `templateId`
- `templateVersion`
- `taskGoal`
- `inputRefs`
- `outputRefs`
- `agentActorId`
- `humanOwnerId`
- `skillRefs`
- `toolContractRefs`
- `riskLevel`
- `approvalStatus`
- `auditRefs`
- `dataClassification`
- `redactionStatus`
- `sharePermission`
- `status`
- `summary`
- `findings`
- `recommendations`
- `nextActions`
- `metrics`
- `failure`
- `extensions`

边界说明：
- `ExecutionReportCard` 的 canonical source 必须是结构化 JSON；Markdown、HTML 或 Web UI 都只是该 JSON 的渲染物。
- `schemaVersion` 从首版开始必填。后续兼容性变更只能追加可选字段；字段改名、删除或语义改变必须提升 schema version 并提供迁移说明。
- `inputRefs` 和 `outputRefs` 只能保存引用、摘要或脱敏快照，不能保存原始敏感数据。
- `metrics`、`failure` 和 `extensions` 首版可以为空对象，但字段位置必须保留。
- `extensions` 必须使用 namespaced key，不能覆盖标准字段语义。
- 公开分享必须显式授权。
- 报告卡不得包含用户私有数据、敏感字段、内部任务内容或原始模型上下文。

最小 JSON 骨架：

```json
{
  "reportCardId": "uuid",
  "schemaVersion": "execution-report-card.v1",
  "generatedAt": "2026-05-10T00:00:00Z",
  "projectInstanceId": "uuid",
  "workItemId": "uuid",
  "agentRunId": "uuid",
  "templateId": "docs_review_and_improvement",
  "templateVersion": "0.1.0",
  "taskGoal": "Review selected docs and suggest MVP improvements.",
  "inputRefs": [],
  "outputRefs": [],
  "agentActorId": "uuid",
  "humanOwnerId": "uuid",
  "skillRefs": [],
  "toolContractRefs": [],
  "riskLevel": "low",
  "approvalStatus": "not_required",
  "auditRefs": [],
  "dataClassification": "internal",
  "redactionStatus": "redacted",
  "sharePermission": "private",
  "status": "needs_review",
  "summary": "string",
  "findings": [],
  "recommendations": [],
  "nextActions": [],
  "metrics": {},
  "failure": null,
  "extensions": {}
}
```

审计点：
- 报告卡生成
- 脱敏状态变更
- 公开分享授权和撤回
- schema version 迁移或兼容渲染

### Agent Run API

用途：启动、查看、暂停、恢复和终止 agent run。

关键操作：
- `POST /api/v1/agent-runs`
- `GET /api/v1/agent-runs/{runId}`
- `POST /api/v1/agent-runs/{runId}/resume`
- `POST /api/v1/agent-runs/{runId}/cancel`

核心字段：
- `runId`
- `agentActorId`
- `workItemId`
- `graphId`
- `budgetSnapshot`
- `toolGrants`
- `checkpointRef`

边界说明：
- `budgetSnapshot` 是运行开始时的预算快照，不能由模型运行中自行扩大。
- `toolGrants` 是本次运行可用工具授权，不等同于 AgentActor 全局能力。
- `checkpointRef` 只能引用同环境运行面 checkpoint。

审计点：
- 启动、暂停、恢复、取消
- 工具授权变化
- 预算耗尽或模型路由降级
- HITL 中断与恢复

### Approval API

用途：显式审批高风险动作。

关键操作：
- `POST /api/v1/approvals`
- `GET /api/v1/approvals/{approvalId}`
- `POST /api/v1/approvals/{approvalId}/decide`

决策枚举：
- `approve`
- `reject`
- `edit_and_approve`
- `escalate`

核心字段：
- `approvalId`
- `workItemId`
- `riskLevel`
- `requestedAction`
- `requestPayloadRef`
- `policyEvaluationId`
- `approverActorId`
- `decision`
- `decisionReason`
- `rollbackRef`

边界说明：
- 审批请求创建后，原始输入引用不可变。
- `edit_and_approve` 必须保存人类修改后的 payload 引用。
- 超时不能默认批准，必须按策略升级、取消或转人工队列。

### Knowledge API

用途：知识资料、记忆片段、检索命中和沉淀物管理。

关键操作：
- `POST /api/v1/knowledge/documents`
- `POST /api/v1/knowledge/search`
- `POST /api/v1/memory/artifacts`
- `GET /api/v1/memory/artifacts/{artifactId}`

### Policy/Eval API

用途：策略、预算、评测配置与实验结果管理。

关键操作：
- `GET /api/v1/policies/{policyId}`
- `POST /api/v1/evals/runs`
- `GET /api/v1/evals/runs/{evalRunId}`
- `POST /api/v1/experiments`

### Audit API

用途：统一审计检索与追溯。

关键操作：
- `GET /api/v1/audit/events`
- `GET /api/v1/audit/events/{auditEventId}`

## ToolContract 边界

每个工具必须定义：

```json
{
  "toolName": "string",
  "description": "string",
  "inputSchemaRef": "string",
  "outputSchemaRef": "string",
  "requiredPermissions": ["string"],
  "riskLevel": "low",
  "allowedActorTypes": ["AgentActor"],
  "allowedEnvironments": ["dev", "staging"],
  "autoExecute": false,
  "budgetLimit": {
    "currency": "token",
    "amount": 10000
  },
  "auditTags": ["string"]
}
```

工具契约变更必须进入策略审查。生产高风险工具必须默认 `autoExecute=false`。

## 事件命名

v1 固定使用以下事件前缀：

- `org.*`
- `workforce.*`
- `attendance.*`
- `access.*`
- `community.*`
- `task.*`
- `agent_run.*`
- `approval.*`
- `memory.*`
- `eval.*`
- `policy.*`
- `instance.*`
- `governance_brain.*`
- `federation.*`
- `runtime.*`
- `report.*`

推荐事件：

| 事件 | 说明 |
| --- | --- |
| `org.department_changed` | 部门树发生变更 |
| `workforce.account_created` | 账号创建 |
| `workforce.employee_profile_updated` | 员工档案更新 |
| `attendance.recorded` | 新的考勤记录写入 |
| `attendance.corrected` | 补签或人工修正完成 |
| `access.role_assigned` | 角色授予完成 |
| `access.permission_changed` | 权限目录或授权关系变更 |
| `community.posted` | 新帖子发布 |
| `community.commented` | 新评论发布 |
| `task.created` | 工作项创建 |
| `task.assigned` | 工作项被分派 |
| `agent_run.started` | 智能体运行启动 |
| `agent_run.interrupted` | 进入 HITL 或失败中断 |
| `approval.requested` | 审批请求创建 |
| `approval.decided` | 审批决策完成 |
| `memory.artifact_created` | 生成新的学习沉淀 |
| `eval.run_completed` | 评测完成 |
| `policy.violation_detected` | 策略违规被发现 |
| `instance.member_changed` | 实例成员、角色或审批责任发生变化 |
| `governance_brain.task_fit_assessed` | GovernanceBrain 生成任务适配评估 |
| `governance_brain.context_conflict_reported` | 项目上下文、术语、接口或治理规则冲突被报告 |
| `governance_brain.improvement_candidate_created` | GovernanceBrain 生成受控改进候选 |
| `federation.message_received` | 收到跨实例 FederationMessage |
| `federation.message_rejected` | 跨实例消息因协议、签名、策略或 schema 被拒绝 |
| `federation.receipt_created` | 生成跨实例消息回执 |
| `federation.link_changed` | 跨实例授权连接发生变化 |
| `federation.capability_requested` | 发起跨实例能力请求 |
| `runtime.model_capability_profile_changed` | 模型能力画像创建、更新或失效 |
| `runtime.adaptive_decision_made` | 自适应运行做出降级、阻塞或人工接管决策 |
| `report.execution_card_created` | 生成执行报告卡 |

## 事件封套

所有异步事件必须包含：

```json
{
  "eventId": "uuid",
  "eventType": "task.created",
  "eventVersion": 1,
  "occurredAt": "2026-05-05T00:00:00Z",
  "env": "staging",
  "actor": {
    "actorType": "HumanActor",
    "actorId": "uuid"
  },
  "trace": {
    "requestId": "uuid",
    "projectInstanceId": "uuid",
    "workItemId": "uuid",
    "agentRunId": "uuid"
  },
  "data": {},
  "audit": {
    "auditEventId": "uuid",
    "policyEvaluationId": "uuid",
    "approvalId": "uuid"
  }
}
```

消费者必须按 `eventId` 幂等处理。事件 payload 只能追加兼容字段；破坏性变更必须提升 `eventVersion` 并记录迁移计划。

## JSON Schema 边界约束

所有对模型或工具开放的结构边界必须：

- 显式声明 `required`
- 禁止未声明字段
- 对枚举、日期、ID 和风险等级使用强约束
- 对 `employmentStatus`、`attendanceStatus`、`permissionType`、`visibilityScope` 等集中词表使用共享 schema
- 把敏感字段访问写入审计上下文

示例：

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["workItemId", "riskLevel", "status"],
  "properties": {
    "workItemId": { "type": "string", "format": "uuid" },
    "riskLevel": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
    "status": { "type": "string", "enum": ["draft", "triaged", "in_progress", "awaiting_approval", "completed"] }
  }
}
```

## 契约治理

- 接口变更必须伴随版本说明。
- 事件语义变更必须同步修改消费者文档。
- 任何新增工具都必须先有 `ToolContract`。
- 任何新增高风险动作都必须先有 `ApprovalGate` 绑定策略。
- 任何新增 HR 事实字段都必须同时定义请求边界、响应边界、事件语义和审计点。
- 任何新增 GovernanceBrain 能力都必须定义来源引用、建议边界、人工责任、审计事件和失败恢复方式。
- 任何新增生产 ModelRoute 都必须绑定 ModelCapabilityProfile、评测结果、数据分级范围、风险等级范围和回退策略。
- 任何新增跨实例能力都必须保持 FederationMessage envelope 兼容，并提供 messageType、messageVersion、payload schema、错误处理、幂等和撤销语义。
- 接口名称必须使用 v1 正式命名，不能引入未注册的历史路径或别名。
- 契约测试必须覆盖成功、权限不足、审批触发、策略拒绝、幂等重放和依赖失败。
- 面向模型或工具的结构化输出必须禁止未声明字段，并在写入控制面前再次校验。
