# 传播与增长机制

## 传播目标

AI-HRMS 需要让用户在 30 秒内理解它是什么，在 5 到 10 分钟内跑通最小闭环，并能把一次执行结果转化为可分享、可复用、可贡献的资产。

传播不是单纯营销。它要帮助个人、社区和组织更快理解 AI 时代 HRMS 的新定义：AI-HRMS 管理 HumanActor、AgentActor、WorkItem、ToolContract、ApprovalGate、PolicyRule、Observation、LearningArtifact、ProjectInstance、GovernanceBrain 和 DomainWorkflow，让标准化工作在明确约束下由 AI 执行，由人类设定目标、定义边界、审批高风险动作、审查结果和承担最终责任。

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

Demo 可以使用 SQLite、mock 工具和 mock model 跑通。用户自带模型 API key 或本地模型只作为 live model 增强路径。它不要求 Keycloak、Temporal、完整 OTel、Langfuse 或 Grafana。

## 软件层 MVP 优先

现实感知层和现实执行层当前只保留为长期方向和假设登记，不进入当前 MVP 的交付主线。当前阶段优先完成软件层传播型 MVP：

- Web-first onboarding：让用户不用理解完整架构，也能开始一次任务。
- 模板运行：至少一个模板可以稳定生成报告卡，后续扩展到多类 work proof。
- 报告卡分享：`ExecutionReportCard` 是传播资产、能力证据和后续案例库入口。
- 能力路径：从用户目标和材料生成候选 `LearningPath`、`GrowthWorkItem` 和 `CapabilityProof`。
- 开源可试用：保留 CLI 作为可测试内核，Web UI 读取同一份执行数据。

现实任务采集、手机相机、OCR、定位、扫码、线下执行和服务市场暂不作为 MVP 前置条件。相关想法只进入后续探索队列，必须等软件层闭环有真实用户、模板运行数据和报告卡传播数据后再决定是否进入实现。

MVP 采用 CLI-first、Web UI-follow：

- CLI 负责让 Demo Mode 可运行、可测试、可复现。
- CLI 必须生成 JSON 形式的 `ExecutionReportCard` 作为事实源，并默认导出 Markdown 渲染物。
- 默认 `mock` 模式必须在无真实模型 key 的情况下生成固定、结构完整且有真实感的样例输出。
- 可选 `live` 模式只增强分析质量，不能改变报告卡 schema、审批、审计和数据分级语义。
- 极简 Web UI 在后续读取同一份执行数据，用于展示工作台、审批台、报告卡和文档教学入口。
- Web UI 不能重新实现一套绕过 CLI 数据契约、策略和审计语义的业务逻辑。

## 自由身份入口

传播型 MVP 不能要求用户先准确说出自己是谁。很多人处在转型、失业、兼职、学习、创作或探索阶段，工作也常常跨越程序员、设计师、写作者、运营者、创作者和小团队组织者等边界。

因此 onboarding 应同时提供三种入口：

- 固定入口：为程序员、设计师、写作者、创作者、小团队组织者、开源维护者等提供快速模板。
- 目标入口：用户直接描述“我想完成什么”“我想证明什么能力”“我想把什么现实任务做成可交付结果”。
- 探索入口：用户不需要先选择身份，只提供兴趣、已有材料、可用时间、设备和约束，由系统生成候选 `LearningPath`、`GrowthWorkItem` 和模板建议。

身份标签只能作为导航和解释工具，不能成为权限、能力、贡献价值或发展路径的硬分类。AI-HRMS 应允许用户在不同任务中使用不同身份叙事，并允许用户撤回、修改或降低相关画像的可见范围。

## Web-first Onboarding

CLI 是当前可测试内核，但传播型 MVP 的默认体验应走向 Web-first onboarding：用户打开页面后无需理解完整架构，先选择固定入口、目标入口或探索入口，完成一次最小任务，并得到一张可保存、可复盘、可选择分享的 `ExecutionReportCard`。

推荐表述为：

```text
CLI-tested core, Web-first onboarding, reality layer later.
```

约束：

- CLI 保留为执行内核、测试 harness 和高级用户入口。
- Web UI 只读取同一份执行数据、模板 manifest 和 `ExecutionReportCard`，不能复制业务逻辑。
- 现实感知和现实执行只作为后续探索，不阻塞软件层 MVP。
- 所有入口都必须遵守同一套 `ToolContract`、`ApprovalGate`、审计、数据分级和分享许可。

### Web MVP 第一屏

第一屏目标不是解释所有概念，而是让用户立刻进入一次可复盘的 AI 协作任务。首屏应围绕一个主动作组织：

```text
Generate your first AI-assisted work proof.
```

首屏结构：

- 顶部一句话说明：AI-HRMS 把 AI 协作变成可复核、可审批、可分享的工作证明。
- 三个入口并列展示：
  - 我有目标：用户直接描述想完成的任务。
  - 我想探索：用户提供兴趣、材料、时间和约束，由系统推荐路径。
  - 我想看示例：使用内置 demo 数据直接生成报告卡。
- 一个主按钮：生成第一张报告卡。
- 一个次按钮：查看 CLI / GitHub / 文档。
- 首屏下方只展示一张示例 `ExecutionReportCard` 预览，不展示复杂平台架构。

首屏不得要求用户先注册、先选择固定身份、先配置模型 key、先连接外部工具或先理解完整术语。固定身份只作为快捷筛选，不作为必填字段。

最短流程：

1. 用户选择入口或使用示例。
2. 系统推荐一个模板和输入要求。
3. 用户确认或编辑目标。
4. Demo 使用 mock model 运行。
5. 生成 JSON-first `ExecutionReportCard` 和可读报告卡视图。
6. 用户可以下载、复制、继续改进或创建下一步 `GrowthWorkItem`。

Web UI 必须读取与 CLI 相同的模板 manifest、执行数据和报告卡 schema。任何 Web-only 状态都只能是展示状态，不能成为独立业务事实。

## 最合适传播方案

当前最合适的传播方案不是“先做完整平台”，而是“先做一个能被立刻试用、能解释信任问题、能生成可分享结果的小工具”。

定位：

```text
AI-HRMS Workbench: turn AI-assisted work into a reviewable proof.
```

首发体验必须满足：

- 无登录可试用，至少有 mock/demo 数据。
- 3 分钟内看到第一张报告卡。
- 30 分钟内完成一份 AI-assisted work proof。
- 默认展示 AI 输出需要人工复核，而不是宣称自动替代人。
- 报告卡可复制、下载或生成分享页，但默认私有。
- GitHub repo、文档、模板 manifest 和示例报告卡同时可见。

传播顺序：

1. 先面向开发者和开源维护者。原因是他们能理解 CLI、GitHub、PR、issue、测试和 agent 风险，也最容易给出高质量反馈。
2. 再扩展到设计师、写作者和创作者。通过 Web-first onboarding、示例输入和报告卡降低门槛。
3. 最后再验证小团队和社区组织者。此时需要多人 ProjectInstance、权限、审批和协作视图。

首发渠道组合：

- GitHub：作为可信资产和贡献入口。
- Hacker News / Show HN：适合可直接试用的开源工具，不适合只发 waitlist 或纯愿景文章。
- 开发者社区：围绕“AI 输出几乎对但不完全对”“如何复核 AI work”写技术文章和案例。
- 中文社区：用更直白的转型主题触达程序员、设计师、写作者和创作者，例如“把一次 AI 协作变成可复盘作品证明”。
- 短视频或图文：只展示一次任务从输入到报告卡，不讲完整架构。

首发内容应避免：

- 空泛宣称“重新定义 HRMS”但没有可试用产物。
- 只展示 CLI 输出而没有 Web 入口或报告卡截图。
- 把 AI 说成完全替代人。
- 把用户绑定到单一身份。
- 把现实任务、3D、外卖式履约等远期方向提前包装成当前能力。

首发指标：

- 访问到首次运行转化率。
- 首张报告卡生成率。
- 报告卡分享或下载率。
- 反馈 issue 数量和质量。
- 模板贡献或改进建议数量。
- 用户是否能复述“AI-HRMS 管理 AI 协作的任务、工具、审批、审计和报告卡”。

## 能力证明型 Workbench

为了吸引处在 AI 冲击中的开发者、设计师、写作者、画家、运营者和其他知识工作者，MVP 不应只展示“agent 会运行”，而应帮助用户产出第一份可展示的能力证据。

传播型目标：

```text
30 分钟内让用户完成一次 AI-assisted work proof。
```

这个 work proof 至少包括：

- 一个明确目标。
- 一组输入引用。
- 一次受控 AI 协作过程。
- 人工复核或修正点。
- 一张 JSON-first 的 `ExecutionReportCard`。
- 可选的 `CapabilityProof`、`LearningPath` 或下一步 `GrowthWorkItem`。

首批模板应覆盖多种自由路径，而不是只覆盖单一职业身份。为了避免范围扩散，传播型 Web MVP 先只做 4 个用户可见模板；`docs_review_and_improvement` 保留为工程 smoke template 和文档基线模板。

用户可见首批 4 个模板：

- `repo_understanding_and_work_plan`：面向开发者、开源维护者和转型技术人。输入仓库说明、目录摘要或关键文件引用；输出项目理解、风险、下一步工作计划和可选 `WorkShard` 建议。不自动改代码。
- `knowledge_navigation_and_challenge`：面向所有需要可信答案的用户。输入问题和可选文档范围；输出带来源引用的 `AnswerCard`、`DocChallengeDraft` 和报告卡。不自动修改文档。
- `issue_pr_triage_and_review`：面向开源维护者、小团队和开发者。输入 issue、PR 描述、diff 摘要或 review 文字；输出分类、风险、建议 owner、审查要点和后续 WorkItem。不自动评论或合并。
- `personal_work_proof`：面向不确定身份的探索者、设计师、写作者、创作者和转型人群。输入目标、已有材料和可用时间；输出候选 `LearningPath`、可执行小任务、能力证明摘要和第一张报告卡。

模板 0：

- `docs_review_and_improvement`：继续作为 CLI Demo、文档协作和报告卡 schema 的稳定样例。它可以在 Web 中作为“看示例”入口，但不是传播型 MVP 的唯一主线。

## 文档教学入口

早期采用路径默认用户具备较好的自学能力，因此最重要的增长资产不是复杂教学系统，而是能让用户快速跑通的文档教材。

MVP 文档教学入口必须覆盖：

- AI-HRMS 是什么，以及它与传统 HRMS、泛泛 agent framework 的区别。
- Demo Mode 如何启动。
- 首个模板如何运行。
- `WorkItem`、`AgentActor`、`ToolContract`、`ApprovalGate`、`Observation` 和 `ExecutionReportCard` 的关系。
- 失败后如何查看复盘和报告卡。
- 如何贡献模板、失败案例或文档修正。

`KeywordHelpOverlay` 可作为后续体验增强，通过快捷键或聚焦关键词弹窗展示术语解释、来源文档、示例和下一步链接，但它不应成为 MVP 跑通的前置条件。

## ExecutionReportCard

每次 AI 完成任务后，可以生成可分享的 `ExecutionReportCard`。它默认是脱敏输出物，公开分享必须显式授权。

`ExecutionReportCard` 的 canonical source 是 JSON。Markdown、HTML、Web UI 卡片和案例库页面都只能从该 JSON 渲染。首版可以只默认导出 Markdown，但必须同时保存 JSON，并从第一版开始包含 `schemaVersion`。

字段：

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

首版可以让 `metrics`、`failure` 和 `extensions` 为空，但不能省略这些扩展位置。后续新增成本、延迟、节省时间估算、多模型对比、完整 trace 或跨实例共享记录时，应追加兼容字段，而不是改变已有字段语义。

## 模板传播机制

可传播资产包括：

- `Workflow Template`
- `Skill Recipe`
- `ToolContract`
- `Eval sample`
- `Failure case`
- `Review note`
- `TaskFitAssessment`
- `ModelCapabilityProfile`

首批示例模板：

- `repo_understanding_and_work_plan`。
- `issue_pr_triage_and_review`。
- `personal_work_proof`。
- `knowledge_navigation_and_challenge`。
- `docs_review_and_improvement`。

后续模板池：

- 会议纪要整理。
- 政策问答。
- 任务拆解。
- 资料收集。
- 日报周报。
- 开源项目维护。
- 社区贡献者 onboarding。
- 小团队任务分派。
- 客户反馈整理。
- 作品集重组。
- 内容产品化。

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

贡献者声誉不能压缩成全局单一贡献分，也不能把拒绝 AI 建议分派、响应速度、在线时长或模型推断作为负面贡献依据。成员权利和贡献记录规则见 [member-rights-and-contribution.md](member-rights-and-contribution.md)。

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
| 小团队 | 多人共用一个 ProjectInstance，用 GovernanceBrain 辅助任务分派、权限边界、审批和模板复用 |
| 社区组织 | 用 Community Instance 管理成员协作、贡献者 onboarding 和公开 Commons 资产 |
| AI agent 开发者 | 用 ToolContract、PolicyRule 和 Eval sample 让 agent 能被治理和复盘 |
| 研究者 | 使用脱敏 SharedEvalSummary、失败分类和版本指标研究人机协作质量 |
| 企业内部创新者 | 在 Enterprise Mode 中保留 Keycloak、Temporal、LiteLLM Proxy、审计和环境隔离 |

这些话术只用于降低首次理解成本，不应把用户锁定到单一身份。若用户选择“自由探索”，系统应从目标、材料、设备、时间和风险偏好反推合适模板。

## 现实任务闭环后续探索

AI-HRMS 的长期增长不能只依赖“生成代码”或“生成内容”。但现实感知层和现实执行层当前仍不明朗，不能挤占软件层 MVP 的实现和传播资源。

后续如果软件层 MVP 证明有真实采用，再评估是否把手机和普通设备变成受控输入源：

- 手机相机：照片、视频、现场状态、作品、货架、设备、空间、损坏情况。
- OCR 和扫码：票据、标签、库存、物流单、合同片段和设备编号。
- 定位和时间：签到、到场、路线、服务窗口和交付时点。
- 录音和转写：访谈、会议、客户反馈和现场说明。
- 表单和附件：人工确认、验收、补充说明和争议记录。

这些输入进入系统后应成为受数据分级约束的 `Observation`，而不是默认训练资源。现实任务方向只有在具备明确用户、明确付费场景、明确数据边界和明确人工验收方式后，才进入实现计划。

商业化路径优先考虑：

- B2B/团队订阅：管理现实任务、审批、审计和报告卡。
- 任务市场抽成：连接需求方、执行者和复核者。
- 认证报告卡：把 `ExecutionReportCard` 做成可验证交付凭证。
- 培训与转型：把 `LearningPath`、`CapabilityProof` 和真实任务模板连接起来。
- 垂直 DomainPack：门店巡检、现场服务、创意生产、开源维护、社区运营等。

## 增长指标

- README 首屏理解率。
- Demo 跑通时间。
- Demo 完成率。
- CLI 首次运行成功率。
- Web 首次完成率。
- 自由探索入口完成率。
- 首份 AI-assisted work proof 生成率。
- 首个模板运行成功率。
- 首张 ExecutionReportCard 生成率。
- 报告卡被打开或分享的次数。
- 模板贡献转化率。
- 失败样本贡献数量。
- 非代码贡献者数量。
- CapabilityProof 生成数量。
- LearningPath 转化为 GrowthWorkItem 的比例。
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
- 脱敏训练资源不得默认成为公开传播资产；公开前必须重新经过显式授权、脱敏检查和分享许可确认。
