# 安全治理

## 治理目标

- 保证人类对高风险行为保有最终控制权
- 保证智能体获得的是最小必要权限
- 保证所有敏感动作都可追溯、可解释、可回滚

## 身份与访问

- 统一身份平台：Keycloak
- 接入协议：OIDC、SAML、LDAP、AD
- 人类与智能体身份分离建模
- `AgentActor` 不能复用 `HumanActor` 会话
- 不同环境的 OIDC client、service account、AgentActor 注册记录和密钥必须独立，详见 [environment-isolation.md](environment-isolation.md)

### 身份类型

| 类型 | 用途 | 默认限制 |
| --- | --- | --- |
| `HumanActor` | 员工、HR、主管、管理员、审批人 | 必须绑定组织身份和角色 |
| `CommunityActor` | 社区贡献者、维护者、实例成员 | 必须绑定 ProjectInstance 内角色和可见范围 |
| `AgentActor` | 智能体执行者 | 不能登录 UI，不能复用人类 session |
| `ServiceAccount` | CI、部署、迁移、备份、网关调用 | 只授予单一职责所需权限 |
| `ExternalConnector` | 受控外部系统连接器 | 必须登记出网目的和审计标签 |

权限判断必须同时考虑 actor、环境、数据等级、业务范围、工具风险和策略版本。

ProjectInstance 内权限还必须考虑实例成员角色、审批责任、资源配额和可见范围。

## 工具治理

每个 `ToolContract` 必须声明：

- 工具名称和用途
- 输入输出 schema
- 所需权限
- 风险等级
- 预算限制
- 是否允许自动执行
- 审计标签

## 数据分级

建议至少采用四级数据分级：

- `public`
- `internal`
- `restricted`
- `sensitive`

规则：

- `restricted` 和 `sensitive` 默认不允许进入外部模型上下文
- 若确需外发，必须通过脱敏、摘要或审批策略

| 等级 | 示例 | 模型上下文规则 | 导出规则 |
| --- | --- | --- | --- |
| `public` | 公开制度、公开公告 | 可进入模型上下文 | 可导出，仍需审计 |
| `internal` | 内部流程、普通协作内容 | 可进入受控模型上下文 | 按权限导出 |
| `restricted` | 员工档案、考勤明细、内部评价 | 默认不得外发，需摘要或脱敏 | 需权限和审计，批量导出触发审批 |
| `sensitive` | 身份证、银行卡、薪酬、合同、健康信息 | 默认禁止进入外部模型上下文 | 默认触发 ApprovalGate |

## 网络治理

- 运行面不允许自由出网
- 仅模型网关与少数受控连接器可出网
- 外部调用必须记录模型、路由、耗时、成本和调用方
- `dev`、`ci`、`staging`、`prod` 默认互不可达，跨环境访问必须登记、审批、审计且默认只读
- 跨实例通信默认拒绝，必须通过 `FederationLink` 显式授权
- 跨实例消息必须记录审计，且敏感数据不得进入跨实例消息

## 审批治理

以下行为默认触发 `ApprovalGate`：

- 薪酬、雇佣、岗位、合同事实变更
- 外部正式通知发送
- 高敏数据读取或导出
- 策略、预算、模型路由调整
- 生产学习结果发布

### ApprovalGate 最低字段

- 审批请求 id
- 关联 WorkItem
- 请求动作和风险等级
- 输入引用与输出引用
- 策略判断引用
- 审批人和审批链
- 决策、理由和时间
- 修改后 payload 引用
- 回滚引用

审批不能只保存一个布尔值。

## 预算与策略

策略至少覆盖：

- 每个 AgentActor 的日/月预算
- 每个 ProjectInstance 的资源预算和并发上限
- 每种模型的可用范围
- 高风险工具白名单
- 允许的知识域
- 最大自动执行步数
- FederationLink 的信任等级、数据共享等级、速率限制和撤销方式
- AdaptiveRuntimePolicy 的降级、阻塞和人工接管条件

策略评估结果至少包含：

- `policyVersion`
- `matchedRules`
- `decision`：`allow`、`deny`、`require_approval`、`escalate`
- `riskLevel`
- `reason`
- `budgetImpact`
- `auditTags`

## 审计模型

审计事件至少记录：

- `who`
- `what`
- `why`
- `when`
- `input_refs`
- `output_refs`
- `policy_evaluations`
- `approval_refs`
- `rollback_refs`

审计事件还必须包含：

- `env`
- `trace_id`
- `work_item_id`
- `agent_run_id`
- `data_classification`
- `risk_level`
- `before_refs`
- `after_refs`

高敏数据审计应记录引用和摘要，不应在审计日志中复制明文字段。

## Federation 治理

跨实例协作必须满足：

- 默认不互信。
- 默认不共享私有数据。
- 默认不允许远程实例直接调用本地高风险工具。
- FederationLink 必须显式授权并可撤销。
- CapabilityRequest 必须声明请求目标、输入引用、数据分级、预算、截止时间、审批要求和失败处理。
- SharedEvalSummary 只能包含聚合指标、样本类型、失败分类和版本信息。
- 高风险动作必须回到本实例 ApprovalGate。

## 自适应运行治理

ResourceProfile 和 AdaptiveRuntimePolicy 只能决定运行方式，不能放宽治理边界。

资源不足时允许：

- 降级模型。
- 使用 mock/stub。
- 限制并发。
- 暂停高成本任务。
- 转人工或阻塞。

资源不足时禁止：

- 绕过 ApprovalGate。
- 跳过审计。
- 降低数据分级。
- 将敏感原文自动发送到远程模型。
- 伪造工具成功。

## 安全事件处理

以下情况必须作为安全事件处理：

- secret、模型 key、OIDC client secret 或数据库凭据泄漏。
- `AgentActor` 越权调用工具或访问高等级数据。
- 生产数据未经审批进入非生产环境。
- 模型上下文包含未脱敏的 `restricted` 或 `sensitive` 数据。
- 审批、审计、预算或模型网关策略被绕过。
- FederationLink 泄漏私有数据或被远程实例滥用。
- AdaptiveRuntimePolicy 降级导致安全治理被绕过。

处理流程：

1. 立即冻结相关 token、工具、模型路由或 AgentActor。
2. 保留审计证据和受影响数据引用。
3. 执行密钥轮换、权限回收或策略回滚。
4. 复盘根因，补充质量门禁和评测样本。
5. 在安全治理文档或 ADR 中记录需要长期保留的决策变化。

## 合规优先级

v1 先满足：

- 最小权限
- 审批闭环
- 敏感数据出境控制
- 可观测与审计完整性

更细粒度的法规适配在后续阶段扩展。
