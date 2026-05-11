# AI-HRMS

AI-HRMS 是 AI 时代的人类与智能体资源管理系统。它把 `HumanActor`、`AgentActor`、`WorkItem`、`ToolContract`、`ApprovalGate`、`PolicyRule`、`Observation`、`LearningArtifact`、`ProjectInstance`、`GovernanceBrain` 和 `DomainWorkflow` 统一管理，让标准化工作可以在明确约束下由 AI 执行，由人类设定目标、定义边界、审批高风险动作、审查结果和承担最终责任。

## AI 时代 HRMS 的定义

AI 时代的 HRMS 不只管理传统员工、组织、考勤、档案、审批和协作内容。它还要管理人类参与者、AI 智能体、技能、工具、任务、审批、策略、预算、审计、评测、学习沉淀、模板、实例成员和实例间协作关系。

AI-HRMS 面向个人、多人协作组织、社区、开源项目、小型工作室、合作社、企业内部团队和更复杂组织。当前项目仍然叫 AI-HRMS，本轮不处理正式更名，也不把项目改写成泛泛的 agent framework。

## 愿景

- AI 执行、分析、生成候选、调用工具、整理反馈、沉淀样本。
- 人类设定目标、判断价值、定义边界、审批高风险动作、治理社区和承担责任。
- 每个动作可追溯。
- 每个高风险动作可审批。
- 每次失败可复盘。
- 每个改进可评测。
- 每次发布可灰度和回滚。
- 每个实例可由一个人运行，也可由多个人共同运行。
- 多个实例可以在授权、信任、审计和数据分级约束下协作。

## 当前状态

- 当前仓库仍以文档、ADR、执行计划、评测基线和最小工程守卫为主，不交付生产 HR 业务代码。
- 已保留 `packages/contracts`、`packages/demo`、`packages/knowledge`、`packages/policy`、`config/environments` 和 `config/templates`，用于把报告卡契约、Demo Mode、知识导航、环境隔离和 `ToolContract` 高风险边界转成可测试规则。
- `docs/zh-CN/` 是设计与后续实现阶段的主要 system of record。
- 传统 HRMS 能力继续保留，企业私有化部署作为 `Enterprise Mode` 保留。

## 核心抽象

- `HumanActor`：设定目标、审批高风险动作、验收结果并承担最终责任的人类参与者。
- `AgentActor`：在策略、预算、工具和审计约束下执行工作的 AI 执行者。
- `WorkItem`：最小可管理工作单元，可被人类或智能体领取、拆解、执行、暂停、升级或关闭。
- `ToolContract`：工具的结构化权限边界、输入输出 schema、风险等级和审计标签。
- `ApprovalGate`：高风险动作前的显式人工闸门。
- `PolicyRule`：身份、预算、工具、审批、数据访问和发布策略。
- `Observation`：运行日志、指标、trace、反馈、输出和失败样本。
- `LearningArtifact`：可进入评测、审批、灰度和回滚流程的学习沉淀。
- `ProjectInstance`：一个 AI-HRMS 运行实例，可由个人、团队、社区或企业内部团队运行。
- `GovernanceBrain`：ProjectInstance 内长期陪伴项目演化的治理型 AI 中枢，用于项目理解、智能分派、多人协调、模型能力治理和受控自我迭代；它不能替代人类 owner，也不能绕过审批、审计、预算和数据分级。
- `ModelCapabilityProfile`：用于描述模型在推理、代码、长上下文、结构化输出、工具调用、安全、成本和延迟等方面能力的评测画像，是 `ModelRoute` 选择和降级的依据。
- `DomainWorkflow`：面向 HR、开源维护、社区运营、项目协作等领域的可复用工作流。

## 最小可运行闭环

5 到 10 分钟 Demo Mode 的目标是跑通：

1. 创建 `WorkItem`。
2. 分派给 `AgentActor`。
3. `AgentActor` 调用 `ToolContract`。
4. 命中高风险动作后进入 `ApprovalGate`。
5. `HumanActor` 批准、拒绝或修改。
6. 生成 `Observation`。
7. 形成 `LearningArtifact` 或 `Eval sample`。
8. 导出 `ExecutionReportCard`。

`ExecutionReportCard` 用于展示任务目标、输入输出引用、执行者、使用的 Skill、调用的 ToolContract、风险等级、审批结果、发现、建议、失败与人工修正、脱敏状态和公开分享许可。它的事实源是带 `schemaVersion` 的 JSON；Markdown、HTML 和 Web UI 都只是渲染物。

MVP 执行顺序采用 CLI-first、Web UI-follow。首版 CLI 用于跑通最小闭环，保存 JSON `ExecutionReportCard` 并默认导出 Markdown；极简 Web UI 在 CLI 闭环稳定后读取同一份执行数据，用于展示工作台、审批台、报告卡和文档教学入口。

Demo Mode 默认使用 `mock` 模式，无需真实模型 key；`live` 模式只作为用户自带模型 API key 或本地模型的增强路径，不能改变 schema、审批、审计、数据分级或报告卡结构。

首版 CLI 已提供 `docs_review_and_improvement` 模板：

```text
pnpm demo
```

默认输出写入 `dist/demo-mode/`：JSON 是 `ExecutionReportCard` 的 canonical source，Markdown 是从 JSON 渲染出的默认阅读版本。更多参数见 [docs/zh-CN/runbooks/demo-mode.md](docs/zh-CN/runbooks/demo-mode.md)。

静态 Web Workbench 可通过同一 Demo engine 生成：

```text
pnpm web:demo
```

默认输出写入 `dist/web/index.html`，展示 `repo_understanding_and_work_plan`、`knowledge_navigation_and_challenge`、`issue_pr_triage_and_review`、`personal_work_proof` 和 `docs_review_and_improvement`，并包含 3 个内置知识问答样例。

知识导航与异议闭环可单独运行：

```text
pnpm knowledge:demo -- --query "AI-HRMS 下一步应该做什么？"
```

该命令使用本地 deterministic mock semantic search，不需要 embedding、模型 key 或外部连接器，会生成 `AnswerCard`、`DocChallengeDraft` 和引用二者的 `ExecutionReportCard`。

## 运行档位

| 档位 | 用途 | 特征 |
| --- | --- | --- |
| `Tiny Mode` | 低配设备、旧电脑、轻量试用和教学 | 文件存储或 SQLite，mock model、远程低成本模型或手动执行模式，单用户、低并发、最小 UI 或 CLI |
| `Demo Mode` | 首次体验 | 5 到 10 分钟跑通最小闭环，可用 SQLite、mock 工具和用户自带模型 API key |
| `Local Mode` | 个人长期使用 | 本地数据库，可选 Docker Compose，可选本地模型或远程模型，基础权限、审计、模板库和评测样本 |
| `Community Mode` | 多人共用实例 | 多用户、角色权限、审批流、审计查询、模板共享、资源配额和可选 FederationLink |
| `Enterprise Mode` | 企业和强治理组织 | Keycloak、Temporal、PostgreSQL、LiteLLM Proxy、OpenTelemetry、Grafana/Loki/Tempo/Langfuse、环境隔离、备份恢复和完整 ApprovalGate |

自适应运行通过 `ResourceProfile`、`AdaptiveRuntimePolicy`、`Adaptive Model Router` 和 `Adaptive Task Scheduler` 选择本地模型、远程模型、mock 模型或人工接管。资源降级不能绕过审批、安全、审计、预算和数据分级。

## 个人与社区优先

AI-HRMS 优先服务个人、自由职业者、开源维护者、小团队、社区组织和多人协作体。商业公司可以参与和使用，但项目方向不能被商业公司重定向。

每类贡献都应可署名、可追踪、可复用，包括 code、docs、templates、eval samples、tool contracts、failure reports、translations、design discussions、review notes 和 real-world usage reports。

## 跨实例协作

多个 `ProjectInstance` 可以通过 `FederationLink` 显式协作。协作语言包括 `FederationPeer`、`CapabilityOffer`、`CapabilityRequest`、`SharedTemplate` 和 `SharedEvalSummary`。

跨实例规则：

- 默认不互信。
- 默认不共享私有数据。
- 默认不允许远程实例直接调用本地高风险工具。
- 跨实例协作必须显式授权。
- 跨实例通信必须记录审计。
- 授权必须可撤销。
- 敏感数据不得进入跨实例消息。
- 高风险动作必须回到本实例 `ApprovalGate`。

## 传播与模板生态

AI-HRMS 的传播重点是让用户快速理解、试用、分享和贡献。可复用资产包括：

- `Workflow Template`
- `Skill Recipe`
- `ToolContract`
- `Eval sample`
- `Failure case`
- `Review note`

首批模板方向包括 GitHub issue 分流、会议纪要整理、文档摘要、简历筛选、入职流程、政策问答、任务拆解、资料收集、日报周报、开源项目维护、社区贡献者 onboarding、小团队任务分派和客户反馈整理。

## 开源与反商业捕获

AI-HRMS 的反商业捕获策略是组合式的，而不是承诺许可证可以绝对阻止剽窃：

- 许可证候选包括 `AGPL-3.0`、`Apache-2.0`、`MIT`、`MPL-2.0` 和非标准 source-available 方案。
- 推荐初稿是优先评估 `AGPL-3.0 + 商标规则 + 开放协议 + 社区治理 + Commons 资产治理`。
- 代码可以开源，项目名称、Logo、官方兼容认证和官方发行版标识可以由商标和治理规则保护。
- 核心契约不得绑定单一云平台、单一模型供应商、单一中心服务器或单一商业 API。
- 许可证、商标策略和官方兼容认证需要人工确认；相关说明不是法律意见。

## 文档入口

- [AGENTS.md](AGENTS.md)：Agent 协作规则、知识索引和约束入口。
- [ARCHITECTURE.md](ARCHITECTURE.md)：总体架构摘要与关键边界。
- [docs/zh-CN/README.md](docs/zh-CN/README.md)：中文解释文档库总索引。
- [docs/zh-CN/open-source-strategy.md](docs/zh-CN/open-source-strategy.md)：开源战略与反商业捕获。
- [docs/zh-CN/adoption-and-growth.md](docs/zh-CN/adoption-and-growth.md)：传播、Demo、报告卡和模板增长机制。
- [docs/zh-CN/governance-ai-brain.md](docs/zh-CN/governance-ai-brain.md)：治理型 AI 中枢、智能分派和模型能力治理。
- [docs/zh-CN/member-rights-and-contribution.md](docs/zh-CN/member-rights-and-contribution.md)：成员拒绝权、贡献机制和 AI 分派边界。
- [docs/zh-CN/capability-development-and-mvp.md](docs/zh-CN/capability-development-and-mvp.md)：能力发展愿景、文档教学优先和 MVP 生存优先级。
- [docs/zh-CN/data-lifecycle-and-training-resources.md](docs/zh-CN/data-lifecycle-and-training-resources.md)：数据生命周期、脱敏训练资源和撤回删除规则。
- [docs/zh-CN/community-network.md](docs/zh-CN/community-network.md)：ProjectInstance 与跨实例协作。
- [docs/zh-CN/federation-protocol.md](docs/zh-CN/federation-protocol.md)：跨实例通信协议和二次开发兼容性规则。
- [docs/zh-CN/adaptive-runtime.md](docs/zh-CN/adaptive-runtime.md)：资源自适应运行体系。
- [docs/zh-CN/developer-experience.md](docs/zh-CN/developer-experience.md)：跨平台开发体验与文件组织规划。
- [docs/zh-CN/community-governance.md](docs/zh-CN/community-governance.md)：社区治理和企业参与边界。

## 路线图摘要

- `Phase 0.5`：AI-HRMS repositioning and adaptive demo foundation。
- `Phase 0.6`：Template and report-card growth loop。
- `Phase 0.7`：Community contribution foundation。
- `Phase 1`：AI-HRMS Core 基础能力，保留传统 HRMS 能力，并最小实现 `AgentActor`、`WorkItem`、`ApprovalGate`、`GovernanceBrain`、`ModelCapabilityProfile`、`AdaptiveRuntimePolicy`、`ExecutionReportCard` 和 `ProjectInstance`。
