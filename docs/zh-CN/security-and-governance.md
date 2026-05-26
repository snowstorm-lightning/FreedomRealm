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
| `GovernanceBrain` | ProjectInstance 内治理型 AI 中枢 | 只能生成建议、候选和审计记录，不能拥有超级管理员权限 |

权限判断必须同时考虑 actor、环境、数据等级、业务范围、工具风险和策略版本。

ProjectInstance 内权限还必须考虑实例成员角色、审批责任、资源配额和可见范围。

`MemberCapabilityProfile` 和 `TaskFitAssessment` 只能用于任务适配建议。它们不能扩大成员权限、改变数据可见范围、降低审批要求或替代人类 owner。

## 工具治理

每个 `ToolContract` 必须声明：

- 工具名称和用途
- 输入输出 schema
- 所需权限
- 风险等级
- 预算限制
- 是否允许自动执行
- 审计标签

## 外部 Agent 接入治理

OpenClaw、Hermes Agent 和类似项目可以提高 FreedomRealm 的生态关注度，但它们必须作为受控 `ExternalConnector` 接入，不能成为绕过本地治理的旁路。

首版规则：

- 默认只允许 mock connector profile；真实 CLI、gateway、消息通道、skills、MCP server、browser、cron 和持久记忆访问默认关闭。
- 每个外部 agent provider 必须有 `ExternalAgentConnectorProfile`，声明 `provider`、`mode`、支持方向、环境、数据分级、风险等级、ToolContract、secret 引用策略和审计标签。
- checked-in mock connector profile 默认只允许 `dev` / `ci`、`public` / `internal`、`low` / `medium`；任何 `prod`、`restricted` / `sensitive`、`high` / `critical` 或 non-mock 场景都必须作为受控 stress test、候选计划或经批准的 live connector 路径处理。
- 外部 agent 的输出默认是不可信候选，只能进入 `ExecutionReportCard`、`Observation`、`DocChallengeDraft` 或后续 `WorkItem` 草稿，不能直接修改生产事实。
- `restricted` 和 `sensitive` 数据默认不得发送给外部 agent；如果需要，必须先脱敏或摘要化，通过 `ApprovalGate`，并让 `inputRefs` 指向带 `redactionStatus`、`sanitizationStatus`、`summaryStatus`、`referenceStatus` 或等价审计证据的材料。
- 外部 agent 入站结果如果携带 `restricted` / `sensitive` 数据、提出发布/通知/写入/权限变更等副作用，或要求写入核心事实源，必须保持候选状态并触发 `ApprovalGate` 或策略拒绝。
- 高风险动作、发布、外部通知、任务强制分派、权限变更、预算变更和数据共享必须回到本地 `ApprovalGate`。
- connector profile 不得保存明文 token、API key、消息账号凭据或本地 agent 配置内容，只能保存 secret ref 或 secret path。
- OpenClaw / Hermes Agent 的本地配置、消息账号、聊天记录、skills、memory、MCP 配置和执行轨迹不得被 Demo Mode 自动读取。
- 外部 agent 接入不得改变 `ExternalConnector` actor 类型，不得新增未登记 actor 类型。

安全事件包括：

- 外部 agent 访问未授权数据、消息、记忆或工具。
- 真实外部 agent CLI 在未显式配置和审批时被调用。
- 外部 agent 入站结果被直接写入生产事实或公开资产。
- connector profile 泄漏 secret 明文或跨环境复用凭据。
- 外部 agent 绕过本地审批、审计、预算、数据分级或 human owner。

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

## 数据生命周期与训练资源

数据进入 FreedomRealm 时必须尽早绑定来源、owner、用途、`ProjectInstance`、环境、数据分级和保留策略。业务主数据、协作内容、模型上下文、Observation、LearningArtifact、Eval sample、审计日志、备份和公开资产必须分开治理，不能因为进入 AI 流程就失去原始约束。

敏感数据可以在脱敏后保留为训练、评测或模型能力改进资源，但原始敏感数据不得直接作为训练资源保留。脱敏训练资源必须满足：

- 有来源引用、用途、owner、审批引用、审计事件和保留期。
- 通过脱敏和重识别风险评估。
- 继承原始数据的使用限制，除非经过明确降级审批。
- 使用外部模型供应商训练或长期存储前，必须确认供应商的数据保留、训练使用、删除、区域、加密和审计能力。
- 可撤回、可停止后续训练或共享，不破坏必要审计。

详细规则见 [data-lifecycle-and-training-resources.md](data-lifecycle-and-training-resources.md)。

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
- 每个 ModelCapabilityProfile 的数据分级、风险等级、任务类型和评测门槛
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
- 跨实例通信必须使用稳定 FederationMessage envelope、messageId 幂等、schema 校验和审计回执。
- 二次开发不能修改标准 envelope 字段语义，只能通过 CapabilityOffer、JSON Schema 和 namespaced extensions 扩展。
- CapabilityRequest 必须声明请求目标、输入引用、数据分级、预算、截止时间、审批要求和失败处理。
- SharedEvalSummary 只能包含聚合指标、样本类型、失败分类和版本信息。
- 高风险动作必须回到本实例 ApprovalGate。

## 自适应运行治理

ResourceProfile 和 AdaptiveRuntimePolicy 只能决定运行方式，不能放宽治理边界。

ModelCapabilityProfile 只能决定某个 ModelRoute 是否适合某类任务，不能因为模型能力更强而放宽权限、审批、预算、数据分级或审计要求。

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

## GovernanceBrain 治理

GovernanceBrain 必须遵守：

- 所有项目基线解释、分派建议、模型路由建议和自我迭代候选必须保留来源引用。
- 高风险 WorkItem 的分派建议必须包含人类 owner、审批责任和回滚路径。
- 自我迭代候选必须进入 LearningArtifact、Experiment、EvalRun、ApprovalGate、灰度和回滚流程。
- 成员画像、分派建议和模型能力画像变更必须审计。
- 公开或跨实例共享只能使用 SharedTemplate 或 SharedEvalSummary。

GovernanceBrain 禁止：

- 自动批准高风险动作。
- 根据模型输出直接提升权限、改变审批责任或扩大数据可见范围。
- 将草稿、讨论或模型输出当作正式文档事实。
- 把私有上下文、敏感字段或内部任务内容写入公共记忆。
- 在模型能力不足时用低成本模型输出伪装成高置信结论。

## 安全事件处理

以下情况必须作为安全事件处理：

- secret、模型 key、OIDC client secret 或数据库凭据泄漏。
- `AgentActor` 越权调用工具或访问高等级数据。
- 生产数据未经审批进入非生产环境。
- 模型上下文包含未脱敏的 `restricted` 或 `sensitive` 数据。
- 审批、审计、预算或模型网关策略被绕过。
- GovernanceBrain 越权分派、隐藏来源、替代人类 owner 或将候选直接落地。
- FederationLink 泄漏私有数据或被远程实例滥用。
- AdaptiveRuntimePolicy 降级导致安全治理被绕过。
- 敏感原文被保存为训练资源，或脱敏训练资源被发现可重识别个人、组织或内部任务。
- 撤回公开分享或训练授权后，系统仍继续用于训练、评测、公开传播或跨实例共享。

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
