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

- 默认展示首批 5 个内置模板：`repo_understanding_and_work_plan`、`knowledge_navigation_and_challenge`、`issue_pr_triage_and_review`、`personal_work_proof` 和 `docs_review_and_improvement`。
- 可在页面内切换模板，查看同一执行数据生成的报告卡、执行链、失败路径样例和 JSON / Markdown 输出。
- 额外展示 3 个内置知识问答样例，用本地 deterministic mock semantic search 生成 `AnswerCard`、`DocChallengeDraft` 和报告卡。
- 不需要登录。
- 不需要真实模型 key。
- 不调用外部连接器。
- 不读取真实 HR 数据。
- 只展示从共享 Demo engine 生成的报告卡。

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
- 默认不调用外部连接器。
- 默认不读取真实 HR 数据。
- 不自动修改文档。
- 建议输出必须由 `HumanActor` 复核后，才能另行创建文档修改 WorkItem。
- 知识答案必须带来源引用；异议必须停留在 `DocChallengeDraft`，不能绕过人工复核直接改文档。
