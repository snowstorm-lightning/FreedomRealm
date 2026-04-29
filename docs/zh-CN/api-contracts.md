# v1 接口契约

## 契约原则

- 同步 API 使用 OpenAPI 描述
- 异步事件使用 AsyncAPI 描述
- 结构边界使用 JSON Schema 描述
- 前端以 Zod 校验边界，运行面以 Pydantic 校验边界
- 所有正式接口都必须挂在 `/api/v1/` 之下

## 同步响应封套

- 正常响应统一返回 `data` 与 `meta`，必要时附带 `audit` 引用。
- 分页响应统一在 `meta.pagination` 中声明 `total`、`page`、`pageSize` 或游标信息。
- 错误响应统一返回 `error.code`、`error.message`、`error.details`，不得混用字符串化错误。
- 同步响应必须统一封套和分页元数据，但字段命名以 v1 正式契约为准。

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
- 接口名称必须使用 v1 正式命名，不能引入未注册的历史路径或别名。
