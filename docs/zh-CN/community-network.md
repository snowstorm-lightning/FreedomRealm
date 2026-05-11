# 社区网络与跨实例协作

## 目标

AI-HRMS 可以由一个人运行，也可以由多人共同运行。多个 AI-HRMS 实例可以在授权、信任、审计和数据分级约束下协作，但默认不互信、默认不共享私有数据、默认不允许远程实例直接调用本地高风险工具。

跨实例通信的稳定协议面以 [federation-protocol.md](federation-protocol.md) 为准。二次开发可以扩展能力和 payload，但不能修改 `FederationMessage` 标准封套语义。

## ProjectInstance

`ProjectInstance` 是一个 AI-HRMS 运行实例，也可称为 `AI-HRMS Instance`。它可以表示：

- 个人工作系统。
- 开源项目工作台。
- 小团队工作台。
- 社区组织。
- 合作社。
- 工作室。
- 企业内部团队。
- 临时项目组。

每个 ProjectInstance 都拥有自己的成员、策略、预算、审计、模板、工具契约和数据分级边界。

每个 ProjectInstance 可以拥有自己的 `GovernanceBrain`，用于解释项目基线、生成智能分派建议、协调多人协作和沉淀学习候选。GovernanceBrain 的记忆、成员画像和任务适配评估默认只属于本实例，不能默认跨实例共享。

## 单人实例

单人实例用于个人长期工作或轻量试用。它可以采用 `Tiny Mode`、`Demo Mode` 或 `Local Mode`，优先本地存储、低成本模型路由、mock 工具和人工接管。

单人实例仍然必须保留：

- WorkItem 状态。
- AgentActor 身份。
- ToolContract 边界。
- ApprovalGate 记录。
- Observation 和 LearningArtifact。

## 多人实例

多人实例支持多个 `InstanceMember` 共用同一个 ProjectInstance。成员可以拥有不同角色、权限、审批责任和可见范围。

多人实例必须增加：

- 成员身份与角色。
- MemberCapabilityProfile 和 TaskFitAssessment 的审计边界。
- 权限和审批责任。
- 模板共享范围。
- 审计查询。
- 资源配额。
- 更严格的数据分级。

## 社区实例

`Community Instance` 面向开源项目、社区组织、合作社或公开协作体。它可以引入 `CommunityActor`，与 `HumanActor` 关联，但保留项目实例内的独立角色、贡献记录和权限。

社区实例应优先支持：

- 贡献者 onboarding。
- issue 分流。
- 按贡献者技能、兴趣、可用性、信任等级和学习目标进行低风险任务建议。
- 模板贡献。
- 失败样本和复盘报告贡献。
- 公开 ExecutionReportCard。
- Commons 资产治理。

## FederationPeer

`FederationPeer` 是另一个可协作的 AI-HRMS 实例。它只表示潜在协作对象，不代表默认信任。

信任等级建议：

- `unknown`
- `known`
- `trusted`
- `verified`
- `blocked`

## FederationLink

`FederationLink` 是两个 ProjectInstance 之间的显式协作连接。必须声明：

- 对方实例身份。
- 信任等级。
- 允许共享的数据类型。
- 允许协作的 WorkItem 类型。
- 允许交换的模板类型。
- 允许暴露的能力。
- 审计要求。
- 速率限制。
- 撤销方式。

授权必须可撤销。撤销后不能继续调用能力、读取共享模板或交换评测摘要。

## FederationProtocol

实例间通信使用最小稳定协议：

- `FederationManifest`：公开实例支持的协议版本、消息类型、schema、速率限制和公开端点。
- `FederationMessage`：所有跨实例消息的统一 envelope，包含 `messageId`、`messageType`、`protocolVersion`、`FederationLink`、策略、审计和签名引用。
- `FederationReceipt`：接收方对消息接收、入队、拒绝、阻塞或需要审批的回执。

协议规则：

- `messageId` 必须幂等。
- 不认识的 messageType 不能当作成功。
- 已撤销 FederationLink 的消息必须拒绝。
- 自定义扩展必须通过 namespaced `extensions`、自定义 schema 和 `CapabilityOffer` 声明。
- 标准 envelope 不允许二次开发修改字段语义。

详细规范见 [federation-protocol.md](federation-protocol.md)。

## CapabilityOffer

`CapabilityOffer` 是一个实例对外公开的能力描述。包括：

- 能力名称。
- 输入要求。
- 输出类型。
- 风险等级。
- 是否需要人工审批。
- 成本估计。
- 延迟估计。
- 数据使用边界。
- 可用时间。
- 调用限制。

CapabilityOffer 不是远程执行许可。调用仍需符合 FederationLink、数据分级、预算和审批策略。

## CapabilityRequest

`CapabilityRequest` 是一个实例向另一个实例请求协作。包括：

- 请求目标。
- 输入引用。
- 数据分级。
- 期望输出。
- 预算。
- 截止时间。
- 审批要求。
- 回调方式。
- 失败处理。

敏感数据不得进入跨实例消息。高风险动作必须回到发起实例或本地实例的 `ApprovalGate`，不能被远程实例绕过。

GovernanceBrain 可以建议向哪个 FederationPeer 发起 CapabilityRequest，但该建议必须遵守 FederationLink、CapabilityOffer、预算、数据分级和审批策略。

## SharedTemplate

`SharedTemplate` 是可公开或定向共享的 `Workflow Template`、`Skill Recipe` 或 `ToolContract`。

共享时必须声明：

- 许可证或复用规则。
- 署名要求。
- 适用版本。
- 数据要求。
- 风险等级。
- 审批要求。
- 已知失败模式。

## SharedEvalSummary

`SharedEvalSummary` 是脱敏后的评测摘要。只能包含：

- 聚合指标。
- 样本类型。
- 失败分类。
- 版本信息。

不得包含：

- 用户私有数据。
- 敏感字段。
- 原始上下文。
- 内部任务内容。
- 可反推出个人身份的信息。

## 数据共享等级

建议等级：

- `none`
- `public_metadata`
- `templates_only`
- `anonymized_eval_summaries`
- `approved_work_collaboration`

默认等级为 `none`。任何提升都必须记录审批、审计和撤销方式。

## 跨实例 WorkItem 协作

跨实例协作可以用于：

- 请求另一个实例运行公开能力。
- 定向共享模板。
- 交换脱敏评测摘要。
- 协同处理低风险公开任务。

跨实例 WorkItem 必须保留本地 owner。本地 ProjectInstance 对目标、数据边界、审批和最终责任负责。

## 审计要求

跨实例通信必须记录：

- messageId。
- protocolVersion。
- 本地实例 ID。
- 对方实例 ID。
- FederationLink 版本。
- CapabilityOffer 或 CapabilityRequest 引用。
- 数据共享等级。
- 风险等级。
- 审批引用。
- 输入输出引用。
- 成本、延迟和失败状态。

审计记录不得复制敏感字段原文。

## 授权撤销

撤销 FederationLink 后必须：

- 停止新的 CapabilityRequest。
- 禁止远程访问本地能力。
- 停止共享新增模板或评测摘要。
- 保留历史审计。
- 标记未完成协作的失败处理方式。

## 失败处理

- 远程实例不可用：本地 WorkItem 标记为 blocked、转人工或选择其他 peer。
- 能力输出不符合 schema：拒绝写入本地控制面。
- 超预算：阻塞、降级或请求人工确认。
- 命中高风险动作：回到本实例 ApprovalGate。
- 疑似数据泄漏：冻结 FederationLink，按安全事件处理。

## v1 范围

v1 只定义 ProjectInstance、FederationLink、CapabilityOffer、CapabilityRequest、SharedTemplate 和 SharedEvalSummary 的概念与边界。v1 不实现完整分布式计算网络，不承诺完全无人自治组织，不允许跨实例协作绕过审批、审计和数据分级。

## 远期研究方向

- 实例身份与可验证声明。
- 分布式模板信誉。
- 跨实例能力发现目录。
- 隐私保护评测摘要交换。
- 社区实例互信网络。
- 与开放协议或去中心化身份的兼容性。
