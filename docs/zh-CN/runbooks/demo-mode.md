# Demo Mode Runbook

## 目标

首版 Demo Mode 采用 CLI-tested core、Web-first onboarding 的顺序。CLI 负责可测试执行内核，Web Workbench 读取同一份模板 manifest、执行数据和 `ExecutionReportCard`，不能复制业务逻辑。

Demo Mode 用于跑通：

`WorkItem -> AgentActor -> ToolContract -> ApprovalGate -> Observation -> ExecutionReportCard`

首个模板是 `docs_review_and_improvement`。该模板只读取仓库文档并生成建议、失败复盘样例和报告卡，不会自动修改文档。

传播型 Web MVP 的首个用户可见模板是 `repo_understanding_and_work_plan`。它用于项目理解、风险识别、下一步工作计划和可选 `WorkShard` 建议，也不会自动修改代码或文档。

## 命令

从仓库根目录执行：

```text
pnpm demo
```

默认行为：

- 模板：`docs_review_and_improvement`
- 模型路径：`mock`
- 输入文档：README、中文文档入口、MVP 文档和架构蓝图
- 输出目录：`dist/demo-mode/`

可选参数：

```text
pnpm demo -- --input docs/zh-CN/api-contracts.md --input docs/zh-CN/quality-gates.md
pnpm demo -- --out dist/demo-mode/custom
pnpm demo -- --model live
pnpm demo -- --template repo_understanding_and_work_plan
pnpm demo -- --template knowledge_navigation_and_challenge --query "AI-HRMS 下一步应该做什么？"
pnpm demo -- --template external_agent_connector_safety_demo
```

`--model live` 只是增强路径。未显式配置时会回退到 `mock`，且不会改变报告卡 schema、审批、审计或数据分级。

## 输出

CLI 会生成两类文件：

- `*.json`：`ExecutionReportCard` canonical source，包含 `schemaVersion`。
- `*.md`：从 JSON 渲染出的默认 Markdown。

Markdown 只是渲染物。后续 Web UI 必须读取同一份 JSON，不能复制业务逻辑或另建报告卡事实结构。

## Web Workbench

从仓库根目录执行：

```text
pnpm web:demo
```

默认输出：

- `dist/web/index.html`：静态 Web Workbench。
- `dist/web/data/*.json`：Web 预览使用的 JSON `ExecutionReportCard`。
- `dist/web/data/*.md`：从同一 JSON 渲染出的 Markdown。

Web Workbench 当前是静态 demo build：

- 默认展示 7 个内置模板：`repo_understanding_and_work_plan`、`knowledge_navigation_and_challenge`、`external_agent_connector_safety_demo`、`issue_pr_triage_and_review`、`personal_work_proof`、`project_self_review_and_decay_prevention` 和 `docs_review_and_improvement`。
- 可在页面内切换模板，查看同一执行数据生成的报告卡、执行链、失败路径样例和 JSON / Markdown 输出。
- 页面还会读取 `config/project-operating-entry.json`，展示 `Next Workbench`、当前任务清单、`AgentWorkLease`、`writeSet`、`MergeGate` 和 checkpoint / stop 条件。
- 报告卡预览会显示 human decision checkpoint，来源是 JSON 报告卡中的 `status`、`approvalStatus`、`humanOwnerId`、`nextActions` 和 demo `ApprovalGate`，用于说明哪些动作必须由人复核后才能继续。
- `Candidate WorkItems` 和 `Candidate WorkShards` 必须显式显示候选状态、owner、`approvalRequired`、`writeSet` 和验证命令；它们不是已经接受的分派，也不会自动升级为正式 WorkItem。
- 额外展示 3 个内置知识问答样例，用本地 deterministic mock semantic search 生成 `AnswerCard`、`DocChallengeDraft` 和报告卡。
- 不需要登录。
- 不需要真实模型 key。
- 不调用外部连接器。
- 不读取真实 HR 数据。
- 只展示从共享 Demo engine 生成的报告卡。

## External Agent Connector Safety Demo

从仓库根目录执行：

```text
pnpm demo -- --template external_agent_connector_safety_demo
```

默认行为：

- 读取 `config/connectors/openclaw.mock.json` 和 `config/connectors/hermes-agent.mock.json`。
- 生成 `ExternalAgentRunRequest` 和 `ExternalAgentRunResult` 的 deterministic mock。
- 通过策略判断记录 policy decision。
- 在 `ExecutionReportCard.extensions["ai-hrms.externalAgent"]` 中记录 connector、request、result 和策略原因。

该路径不会启动真实 OpenClaw / Hermes Agent CLI，不读取消息账号、聊天记录、skills、memory、MCP 配置或本地 secret。外部 agent 输出只作为候选输入，不能直接修改文档、代码、issue、PR、生产事实或公开资产。

## Self Review

从仓库根目录执行：

```text
pnpm self-review
```

默认行为：

- 模板：`project_self_review_and_decay_prevention`
- 输出目录：`dist/self-review/`
- 输出 JSON `ExecutionReportCard` 和 Markdown render。
- 只生成发现、风险、候选后续 WorkItem 和复盘建议。
- 候选 WorkItem 写入 `ExecutionReportCard.extensions["ai-hrms.selfReview"].candidateWorkItems`，包含来源 finding / recommendation、owner、风险、`readSet`、`writeSet`、验收标准和验证命令。

该命令不自动修改仓库文档、代码、issue、PR 或配置。自审发现必须由 human owner 决定是否转为正式 WorkItem。

## Delivery HTML Report

从仓库根目录执行：

```text
pnpm report:html
```

默认行为：

- 从 `dist/demo-mode/`、`dist/self-review/` 和 `dist/web/data/` 收集有效 `ExecutionReportCard` JSON。
- 输出 `dist/reports/delivery-report.html`。
- 跳过非报告卡 JSON，例如 `AnswerCard` 和 `DocChallengeDraft`。

HTML 只是整体交付或阶段汇总报告渲染物。单次报告卡的 canonical source 仍是 JSON，默认阅读物仍是 Markdown。

Delivery HTML 也会显示 human decision checkpoint，帮助读者在阶段汇总中看到 owner 决策、`ApprovalGate` 状态和候选下一步。该区块只渲染已有报告卡字段，不创建新的事实源、不改变审批语义，也不会把候选 WorkItem 自动转成正式工作。

## Knowledge Navigation + Challenge Loop

从仓库根目录执行：

```text
pnpm knowledge:demo -- --query "AI-HRMS 下一步应该做什么？"
```

默认行为：

- 模板：`knowledge_navigation_and_challenge`
- 搜索路径：`local-mock-semantic`
- 输入文档：`README.md`、`ARCHITECTURE.md` 和 `docs/zh-CN/**/*.md`
- 输出目录：`dist/knowledge-demo/`

输出文件：

- `AnswerCard` JSON：带 `schemaVersion=answer-card.v1`、问题、回答、来源引用、置信度、限制说明和下一步行动。
- `DocChallengeDraft` JSON：带 `schemaVersion=doc-challenge-draft.v1`、被挑战来源、异议文本、证据引用、草稿状态和人工复核要求。
- `ExecutionReportCard` JSON / Markdown：记录本次知识导航执行链，并在 `outputRefs` 中引用 AnswerCard 和 DocChallengeDraft。

该路径不调用真实 embedding、真实模型、GitHub API 或其他外部连接器，不自动修改文档。若用户认为某个来源过期或不完整，只生成异议草稿和后续 `WorkItem` 建议。

## 安全边界

- 默认不需要真实模型 key。
- 默认不调用真实外部连接器；外部 agent 安全 demo 只使用 mock connector profile。
- 默认不读取真实 HR 数据。
- 不自动修改文档。
- 建议输出必须由 `HumanActor` 复核后，才能另行创建文档修改 WorkItem。
- 知识答案必须带来源引用；异议必须停留在 `DocChallengeDraft`，不能绕过人工复核直接改文档。
