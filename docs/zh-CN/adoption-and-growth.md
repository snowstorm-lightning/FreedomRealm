# 传播与增长机制

## 传播目标

AI-HRMS 需要让用户在 30 秒内理解它是什么，在 5 到 10 分钟内跑通最小闭环，并能把一次执行结果转化为可分享、可复用、可贡献的资产。

传播不是单纯营销。它要帮助个人、社区和组织更快理解 AI 时代 HRMS 的新定义：AI-HRMS 管理 HumanActor、AgentActor、WorkItem、ToolContract、ApprovalGate、PolicyRule、Observation、LearningArtifact、ProjectInstance 和 DomainWorkflow，让标准化工作在明确约束下由 AI 执行，由人类设定目标、定义边界、审批高风险动作、审查结果和承担最终责任。

## 最小可传播 Demo

Demo Mode 的最小闭环：

1. 创建 `WorkItem`。
2. 分派给 `AgentActor`。
3. `AgentActor` 调用 `ToolContract`。
4. 命中高风险动作后进入 `ApprovalGate`。
5. `HumanActor` 批准、拒绝或修改。
6. 生成 `Observation`。
7. 形成 `LearningArtifact` 或 `Eval sample`。
8. 导出 `ExecutionReportCard`。

Demo 可以使用 SQLite、mock 工具、mock model 或用户自带模型 API key。它不要求 Keycloak、Temporal、完整 OTel、Langfuse 或 Grafana。

## ExecutionReportCard

每次 AI 完成任务后，可以生成可分享的 `ExecutionReportCard`。它默认是脱敏输出物，公开分享必须显式授权。

字段：

- 任务目标。
- 发起者。
- 执行者。
- 使用的 `Skill`。
- 调用的 `ToolContract`。
- 风险等级。
- 审批结果。
- 成本。
- 延迟。
- 节省时间估算。
- 失败与人工修正。
- 可复用模板引用。
- 脱敏状态。
- 公开分享许可。

## 模板传播机制

可传播资产包括：

- `Workflow Template`
- `Skill Recipe`
- `ToolContract`
- `Eval sample`
- `Failure case`
- `Review note`

首批示例模板：

- GitHub issue 分流。
- 会议纪要整理。
- 文档摘要。
- 简历筛选。
- 入职流程。
- 政策问答。
- 任务拆解。
- 资料收集。
- 日报周报。
- 开源项目维护。
- 社区贡献者 onboarding。
- 小团队任务分派。
- 客户反馈整理。

模板必须声明适用场景、输入要求、输出形状、风险等级、是否需要审批、数据分级、失败处理和评测样本。

## 案例库

案例库用于展示真实或合成场景下的 AI-HRMS 运行闭环。公开案例必须脱敏，且不能包含用户私有数据、敏感字段、内部任务内容或原始模型上下文。

案例至少记录：

- 模板名称和版本。
- 场景说明。
- 运行模式。
- 审批触发情况。
- 结果摘要。
- 失败和人工修正。
- 可复用资产引用。
- 公开授权状态。

## 指标面板

增长和质量指标应同时展示：

- 模板运行次数。
- 首次运行成功率。
- 任务完成率。
- 人工修正率。
- 审批触发准确率。
- 平均成本。
- P95 延迟。
- 失败案例数量。
- 复盘质量。
- 公开报告卡数量。
- 外部贡献模板数量。
- 多人实例数量。
- 跨实例协作次数。

这些指标不得鼓励绕过审批或隐藏失败。失败案例数量和复盘质量是健康指标，不是负面噪音。

## 贡献者声誉

贡献者可以贡献：

- code
- docs
- templates
- eval samples
- tool contracts
- failure reports
- translations
- design discussions
- review notes
- real-world usage reports

每类贡献都要可署名、可追踪、可复用。贡献者声誉应优先反映长期维护、真实使用反馈、失败复盘质量和对社区资产的改善，而不是只统计代码行数。

## 推广资产

需要沉淀的推广资产：

- README。
- 文档站。
- 2 分钟 demo 视频脚本。
- 示例模板库。
- good first issue。
- 模板贡献指南。
- 失败样本贡献指南。
- 社区挑战。
- 使用案例页面。
- 公开路线图。

## 面向不同用户的话术

| 用户 | 解释重点 |
| --- | --- |
| 个人开发者 | 用 AI-HRMS 管理自己的任务、工具、审批和学习资产，避免把工作流锁在封闭平台里 |
| 自由职业者 | 用模板和报告卡复用标准化交付，保留人工验收和客户边界 |
| 开源维护者 | 用 WorkItem、AgentActor 和 ApprovalGate 分流 issue、生成草稿、沉淀失败样本 |
| 小团队 | 多人共用一个 ProjectInstance，统一任务、权限、审批和模板 |
| 社区组织 | 用 Community Instance 管理成员协作、贡献者 onboarding 和公开 Commons 资产 |
| AI agent 开发者 | 用 ToolContract、PolicyRule 和 Eval sample 让 agent 能被治理和复盘 |
| 研究者 | 使用脱敏 SharedEvalSummary、失败分类和版本指标研究人机协作质量 |
| 企业内部创新者 | 在 Enterprise Mode 中保留 Keycloak、Temporal、LiteLLM Proxy、审计和环境隔离 |

## 增长指标

- README 首屏理解率。
- Demo 跑通时间。
- Demo 完成率。
- 首个模板运行成功率。
- 首张 ExecutionReportCard 生成率。
- 模板贡献转化率。
- 失败样本贡献数量。
- 非代码贡献者数量。
- 多人实例激活数量。
- FederationLink 试验数量。

## 隐私与公开分享规则

- 默认不公开。
- 默认不上传用户私有数据。
- 公开分享必须显式授权。
- `ExecutionReportCard` 公开前必须标注脱敏状态和分享许可。
- Commons 资产只接受用户明确发布的内容。
- `SharedEvalSummary` 只能包含聚合指标、样本类型、失败分类和版本信息。
- 敏感数据、原始上下文、内部任务和非公开日志不得进入传播资产。
