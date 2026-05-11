# 能力发展与 MVP 收敛

## 定位

AI-HRMS 的长期目标不是只把工作自动化，而是让每个 `HumanActor` 的能力在输入和输出两侧都得到更充分发挥：系统应能帮助成员理解任务、学习知识、发现显性和潜在能力，并把个人成长、集体生产效率和 Commons 资产沉淀连成正循环。

但当前阶段必须优先回答一个更现实的问题：项目如何活下来。MVP 的目标不是一次性实现完整能力发展系统，而是用最小闭环证明 AI-HRMS 的新定义可理解、可运行、可复盘、可分享、可继续贡献。

## 当前假设

- 早期参与者默认具备较好的自学能力。
- 当前最重要的是提供快捷、清晰、可运行的学习材料，而不是先构建复杂教学引擎。
- 教材形态先以文档为主，必要时配合最小示例、模板和 Demo Mode。
- 学习材料应服务实际运行路径：看完后能创建 `WorkItem`、理解 `ToolContract`、触发 `ApprovalGate`、查看 `Observation` 并导出 `ExecutionReportCard`。
- 成员学习能力、学习速度和偏好不同，系统未来可以支持不同 `TeachingStrategy`，但 MVP 不依赖该能力。

## 长期能力发展模型

### CapabilityDiscovery

`CapabilityDiscovery` 用于发现成员已经具备或可能具备的能力。输入可以包括成员自述、兴趣、学习目标、已完成贡献、review 记录、`WorkItem` 结果、失败复盘和人工确认。

约束：

- 只能生成候选发现，不能自动生成绩效、惩罚、排名或强制分派结论。
- 必须受 [member-rights-and-contribution.md](member-rights-and-contribution.md) 约束。
- 成员应能查看、修正、降低可见范围或撤回相关画像。

### TeachingMaterial

`TeachingMaterial` 是面向学习和上手的教材资产。MVP 阶段优先使用文档教材，结构应包含：

- 这是什么。
- 为什么重要。
- 最小运行路径。
- 核心概念。
- 常见失败。
- 可复制模板。
- 下一步入口。

### LearningPath

`LearningPath` 是围绕某个角色、任务、模板或 `DomainPack` 的学习路径。它应尽量贴近真实工作，而不是抽象课程。

MVP 只需要一条最短路径：从 README 进入 Demo Mode，跑通一个模板，生成一张 `ExecutionReportCard`。

### TeachingStrategy

`TeachingStrategy` 描述系统如何教学。长期可以包括文档、示例、问答、练习、pair review、任务反馈和错题复盘。

MVP 的 `TeachingStrategy` 固定为 document-first：先把文档写清楚，再补示例和模板。

### GrowthWorkItem

`GrowthWorkItem` 是同时具备生产价值和学习价值的 `WorkItem`。它可以被 AI 推荐给成员，但成员领取应保持自愿；拒绝、延后、缩小范围或转交不构成负面贡献。

### CapabilityProof

`CapabilityProof` 是能力证据，不是单一能力分。它可以来自完成的任务、文档改进、模板贡献、review、评测样本、失败复盘或公开案例。

`CapabilityProof` 只能按上下文解释，不能自动压缩成全局排名或个人绩效结论。

### KeywordHelpOverlay

`KeywordHelpOverlay` 是后续文档体验能力：用户在阅读文档时，可以通过快捷键或聚焦关键词唤起弹窗，快速查看术语解释、来源文档、示例、相关概念和下一步链接。

该能力对快速学习有价值，但不进入 MVP 阻塞项。MVP 先用清晰文档、术语表链接和最小教程解决上手问题。

## MVP 生存优先级

当前最小目标：

1. 30 秒内让新用户理解 AI-HRMS 不是传统 HRMS，也不是泛泛 agent framework。
2. 5 到 10 分钟内跑通 Demo Mode 最小闭环。
3. 至少跑通一个低连接器依赖、低敏感数据依赖的模板。
4. 能看到 `WorkItem`、`AgentActor`、`ToolContract`、`ApprovalGate`、`Observation` 和 `ExecutionReportCard` 的完整关系。
5. 能把一次执行结果转化为可分享、可复用、可贡献的资产。

建议首个 MVP 模板优先选择“文档摘要与改进建议”，原因是它可以直接使用仓库文档，不依赖外部连接器，不需要真实 HR 敏感数据，也能展示报告卡、失败复盘和模板复用。GitHub issue 分流、政策问答和社区 onboarding 可以作为下一批模板。

## MVP 入口决策

MVP 采用 CLI-first、Web UI-follow 的执行顺序。

首版 CLI 负责证明核心闭环可运行、可测试、可复现：

- 创建合成或本地文档驱动的 `WorkItem`。
- 使用首个模板触发 `AgentActor`。
- 通过 mock/stub `ToolContract` 展示工具边界。
- 在高风险或模拟高风险节点触发 `ApprovalGate`。
- 生成 `Observation`、失败复盘和 `ExecutionReportCard`。
- 将 `ExecutionReportCard` 保存为 JSON canonical source，并默认渲染为 Markdown，便于传播和后续 Web UI 读取。

极简 Web UI 不作为首版阻塞项。它应在 CLI 闭环稳定后读取同一份执行数据和报告卡，用于展示工作台、审批台、报告卡、文档教学入口和后续 `KeywordHelpOverlay`。Web UI 不应重新实现一套独立业务逻辑，也不应绕过 CLI 已验证的 schema、策略和审计语义。

这个顺序的原因是：CLI 更适合当前仓库的文档、契约、策略和测试阶段；Web UI 更适合后续传播和非技术用户理解。两者共享数据契约，而不是形成两个产品。

## 开工前需求校准

如果以下问题没有形成明确答案，MVP 可能技术上跑通，但对采用没有意义：

1. 首批用户是谁：个人开发者、开源维护者、小团队、社区组织还是企业内部创新者。
2. 首个模板解决什么真实痛点，而不是只展示 agent 会调用工具。
3. 用户跑完 Demo 后获得什么可复用资产：报告卡、模板、失败案例、改进建议或贡献入口。
4. 5 到 10 分钟跑通的验收标准是什么：从 clone 仓库开始，还是从依赖安装完成后开始。
5. Demo 是否必须在无真实模型 key 的情况下可完成，还是允许用户自带 API key 增强效果。
6. 首个模板是否需要真实外部连接器；若需要，是否会把 MVP 复杂度推高。
7. `ExecutionReportCard` 最小字段是什么，哪些字段只是后续增强。
8. 失败路径如何体现价值：失败时是否能生成可理解的复盘、下一步建议和可贡献样本。
9. 文档教学是否足够让新用户独立完成，不依赖作者口头解释。
10. 哪些能力必须明确排除，防止 MVP 范围膨胀。

当前建议答案：

- 首批用户优先面向个人开发者、开源维护者和早期社区贡献者。
- 首个模板优先选择文档摘要与改进建议。
- Demo 默认使用 mock model 跑通；用户自带模型 API key 只作为 live model 增强输出质量，不影响闭环完成。
- 首版交付物是 CLI 执行记录、JSON 报告卡、Markdown 报告卡渲染物、首个模板说明和失败复盘样例。
- 验收时间从依赖准备完成、执行 Demo 命令开始计算；后续再把安装和环境诊断纳入更严格指标。

## ExecutionReportCard 首版决策

`ExecutionReportCard` 的首版设计遵循 JSON-first：

- JSON 是事实源。
- Markdown 和 HTML 是渲染物。
- Web UI 后续只能读取同一份 JSON 展示，不能另建一套报告卡事实结构。
- JSON 从首版开始必须包含 `schemaVersion`。
- 首版字段可以少，但身份、任务引用、模板引用、输入输出引用、执行者、工具、治理、数据、结果和扩展骨架必须稳定。

首版最小骨架：

- 身份：`reportCardId`、`schemaVersion`、`generatedAt`。
- 任务引用：`projectInstanceId`、`workItemId`、`agentRunId`。
- 模板引用：`templateId`、`templateVersion`。
- 输入输出引用：`inputRefs`、`outputRefs`。
- 执行者：`agentActorId`、`humanOwnerId`。
- 工具：`skillRefs`、`toolContractRefs`。
- 治理：`riskLevel`、`approvalStatus`、`auditRefs`。
- 数据：`dataClassification`、`redactionStatus`、`sharePermission`。
- 结果：`status`、`summary`、`findings`、`recommendations`、`nextActions`。
- 扩展：`metrics`、`failure`、`extensions`。

首版可以让 `metrics`、`failure` 和 `extensions` 为空，但不能省略。后续扩展应优先追加可选字段；字段改名、删除或语义改变必须提升 schema version 并提供迁移说明。

## 模型路径首版决策

MVP 默认模型路径采用 `mock`，可选增强路径采用 `live`。

`mock` 模式：

- 是默认模式，不需要真实模型 API key。
- 输出固定、稳定、可测试，不使用随机结果。
- 对 `docs_review_and_improvement` 返回结构化样例结果。
- 输出应具备真实感，至少包含摘要、2 到 4 个发现、2 到 4 条建议、是否需要人工审查、失败路径样例和完整 `ExecutionReportCard` JSON。
- 不应假装已经完成真实深度理解；报告卡应标记模型路由为 mock，并说明输出来自内置样例。

`live` 模式：

- 是可选模式，需要用户自带模型 API key 或本地模型配置。
- 只增强分析质量，不改变 MVP 闭环、schema、审批、审计和报告卡结构。
- 输出必须经过与 mock 模式相同的结构校验、数据分级、脱敏和审批判断。

无论使用 `mock` 还是 `live`，CLI 都必须生成同一 schema 的 JSON `ExecutionReportCard`。MVP 的通过标准不能依赖 live model。

## MVP 非目标

- 不实现完整自适应教学引擎。
- 不实现 `KeywordHelpOverlay`。
- 不实现复杂 `CapabilityDiscovery` 或潜能挖掘。
- 不把成员画像用于自动绩效、排名、处罚或强制分派。
- 不交付生产级 HR 高风险决策自动化。
- 不实现生产级跨实例协作网络。
- 不要求真实外部连接器、完整企业身份系统、完整观测栈或完整工作流引擎。
- 不要求真实模型 API key；live model 不能成为 MVP 跑通前置条件。

## 十二项缺口的 MVP 重排

从项目生存角度看，十二项缺口不应平均推进，而应按“能否让项目被理解、被运行、被传播、被信任”排序。

P0：直接影响 MVP 存活与传播。

- 产品体验与信息架构：必须让用户知道第一屏做什么、如何跑通 Demo、如何看懂报告卡。
- 扩展生态供应链：模板、`ToolContract` 和 `DomainPack` 是传播入口，首批要有最小 manifest、版本和风险声明。
- 完整数据生命周期：尤其是报告卡、样本和脱敏训练资源，否则公开分享和学习飞轮无法建立信任。
- 法律与贡献资产权属：模板、文档、失败案例和 AI 生成内容的授权边界必须先有草案。
- 实例生命周期：最小 `ProjectInstance` 创建、导出、删除和成员退出语义会影响本地优先和个人使用。
- 外部连接器治理：MVP 可以少接连接器，但必须声明连接器不是无边界工具调用。

P1：影响可信度和后续放大。

- 威胁模型。
- Secure SDLC。
- 通知、审批超时和升级链路。
- HR 高风险决策伦理。
- 人的权利与反监控边界。

这些不是当前演示的主线，但如果缺失，会阻碍社区和组织采用。尤其成员权利不是为了削弱系统能力，而是为了让长期主导生态不变成新的压迫结构。

P2：进入多人、长期和生产化后必须补齐。

- SLO、容量、运维阈值。

## 下一轮讨论队列

MVP 讨论建议按以下顺序推进：

已决策：首版入口采用 CLI-first，极简 Web UI 在 CLI 闭环稳定后读取同一份执行数据做展示。

接下来需要讨论：

1. 首个模板：确认文档摘要与改进建议是否作为首版模板。
2. 最小教程：README、Demo 教程、术语表和模板说明如何组织。
3. 最小数据模型：`WorkItem`、`AgentActor`、`ToolContract`、`ApprovalGate` 和 `Observation` 的字段切片。
4. 验收指标：如何证明 5 到 10 分钟可以跑通。
5. MVP 后的第一项体验增强：再评估 `KeywordHelpOverlay`。
