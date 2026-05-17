# Phase 0.6 Web Workbench MVP 执行计划

## 归档记录

- 完成日期：2026-05-17。
- 验收依据：`user-approved-continuation-20260517` 批准将 Phase 0.6 从 active 归档为 completed；归档检查使用 `pnpm validate:operating-entry` 和 `pnpm check`。
- 实际交付物：CLI-first Demo Mode、静态 Web Workbench、模板 manifest、JSON-first `ExecutionReportCard`、知识导航样例、外部 agent mock connector 安全样例、自我审查入口、HTML 总报告入口、`project-operating-entry.v1` manifest 和相关校验命令。
- 与原计划偏差：未执行真实模型、真实外部 connector、GitHub issue / PR 创建、secret 读取、生产数据访问或正式 Web app 迁移；这些仍是后续审批任务或增强路径。
- 未解决风险：P2 live connectors 仍需单独 `ApprovalGate`、审计和回滚设计；模板评测样本、connector 治理同步和衰减预防 backlog 已保留为后续正式任务。
- 后续事项：继续从 [../README.md](../README.md) 的 active 计划和 [../../project-operating-entry.md](../../project-operating-entry.md) 的当前任务清单领取下一步。

## 背景和问题陈述

当前 AI-HRMS 已经具备 CLI-first Demo Mode、模板 manifest、mock model、`ToolContract` 策略判断和 JSON-first `ExecutionReportCard`。但产品层仍不足以让用户评价：用户看不到清晰第一屏、无法比较模板、无法理解执行链路，也无法判断报告卡如何成为传播资产、能力证据和后续贡献入口。

本计划把 Phase 0.6 收敛为软件层传播型 MVP：先完成 Web Workbench、模板运行、报告卡展示和知识异议闭环的最小可评价版本。现实感知层和现实执行层只作为后续探索，不进入当前 MVP 前置条件。

## 目标

- 让用户 3 分钟内看到第一张 `ExecutionReportCard`。
- 让用户 30 分钟内完成或理解一份 AI-assisted work proof。
- 让维护者和 agent 每次打开仓库后能从项目运行入口看到当前任务清单、推荐下一步和分派边界。
- 保持 CLI 与 Web 共用同一份 Demo engine、模板 manifest 和报告卡 schema。
- 提供足够完整的半落地产品骨架，使用户能评价方向，而不是只评价单个 CLI 输出。
- 为后续真实 Web app、模板扩展和知识导航打下可迁移的数据结构。

## 非目标

- 不接入真实模型 key。
- 不接入 GitHub、邮箱、云盘或其他真实外部连接器。
- 不实现登录、多租户、数据库或完整控制面。
- 不自动修改文档、代码、issue、PR 或用户资料。
- 不实现现实感知层、现实执行层、手机采集、OCR、定位或线下履约。
- 不实现公开分享页；当前只提供 JSON / Markdown 导出和静态预览。

## 用户入口

Web Workbench 第一屏提供三类入口：

- `我有目标`：用户直接描述想完成的任务。
- `我想探索`：用户从兴趣、材料、可用时间和约束开始。
- `我想看示例`：使用内置 mock 数据生成报告卡。

固定身份只作为快捷筛选，不作为必填字段。首发默认聚焦开发者和开源维护者，但不把用户锁定在单一身份。

## 当前模板范围

工程 smoke template：

- `docs_review_and_improvement`：文档 review、CLI Demo、报告卡 schema 稳定样例。

用户可见首批模板：

- `repo_understanding_and_work_plan`：项目理解、风险、下一步计划、可选 `WorkShard` 建议。
- `external_agent_connector_safety_demo`：OpenClaw / Hermes Agent 类外部 agent runtime 的受控 `ExternalConnector` profile、策略判断、mock request/result 和报告卡。
- `issue_pr_triage_and_review`：issue / PR 分类、风险、审查要点、后续 WorkItem。
- `personal_work_proof`：目标、材料和时间到 `LearningPath`、`CapabilityProof` 和小任务建议。
- `knowledge_navigation_and_challenge`：用户问题到来源定位、`AnswerCard`、`DocChallengeDraft` 和报告卡。

## 交付物

- `packages/demo`：CLI 与 Web 共用的 Demo Mode 执行层。
- `config/templates/*.json`：模板 manifest，声明风险、审批、工具契约和 mock model。
- `apps/web`：静态 Web Workbench，可展示模板、执行链路、报告卡和后续能力占位。
- `dist/web/index.html`：本地可打开的半落地产品原型。
- `dist/web/data/*.json` / `*.md`：从共享 Demo engine 生成的报告卡样例。
- `packages/knowledge`：CLI 与 Web 共用的本地 deterministic 知识导航层，生成 `SearchHit`、`AnswerCard` 和 `DocChallengeDraft`。
- `config/connectors/*.mock.json`：OpenClaw / Hermes Agent mock connector profile，用于展示外部 agent 安全接入形状。
- `config/project-operating-entry.json`：`project-operating-entry.v1` 机器事实源，用于任务清单、分派、防冲突和停止条件。
- `scripts/run-self-review.mjs`：项目自我审查入口，只生成报告卡和候选 WorkItem，不修改仓库文件。
- `scripts/render-delivery-report-html.mjs`：从有效 JSON report cards 渲染整体 HTML 交付报告。
- `scripts/validate-operating-entry.mjs`：校验项目运行入口 manifest、引用路径和 pnpm script 引用。
- `docs/zh-CN/project-operating-entry.md`：仓库打开后的任务清单、分派、防冲突和停止条件入口。
- 测试：Demo engine、CLI、报告卡契约和 workspace 校验。

## 半落地版本要求

当前半落地版本必须能让用户看到：

- 产品第一屏和三类入口。
- 首批模板列表和每个模板的状态。
- 选中模板后的 mock 报告卡。
- `WorkItem -> AgentActor -> ToolContract -> ApprovalGate -> Observation -> ExecutionReportCard` 执行链路。
- JSON canonical source 和 Markdown render 的导出入口。
- Knowledge Navigation / AnswerCard / DocChallenge 的后续占位，但明确不自动改文档。
- `Ask maintained docs` 的半落地样例：展示问题、回答、来源引用、Challenge 入口和对应 JSON 输出。
- 外部 agent connector 安全样例：展示 OpenClaw / Hermes Agent mock profile、policy decision、mock request/result 和 ApprovalGate。
- 自我审查命令入口：说明 `pnpm self-review` 用于发现项目腐烂和漂移，并在 `ai-hrms.selfReview` 扩展中生成候选 WorkItem，不产生写副作用。
- HTML 总报告入口：说明 `pnpm report:html` 只汇总 JSON report cards，不替代 Markdown 文档。
- 项目运行入口：展示当前 P0/P1/P2 任务、`WorkShard` 分派边界、`writeSet` 防冲突规则和持续推进停止条件。
- 当前短期目标和一年目标的区别。

## 架构约束

- Web 只消费 `packages/demo` 生成的数据，不复制业务逻辑。
- Web Workbench 读取 `config/project-operating-entry.json` 展示任务清单和 harness 约束，不在前端复制第二份任务清单。
- JSON `ExecutionReportCard` 是事实源；HTML 和 Markdown 都只是渲染物。
- mock 输出必须稳定、结构完整、可测试，并明确标记为 mock。
- live model 只作为未来增强路径，不能影响 MVP 闭环通过标准。
- 本地知识导航默认使用 `local-mock-semantic`，真实 embedding / file search 只能作为增强路径，不改变 AnswerCard、DocChallengeDraft 和报告卡契约。
- 高风险或有副作用动作必须进入 `ApprovalGate`，当前只生成建议。
- 学习沉淀、评测样本和报告卡都必须保留数据分级、脱敏状态和分享许可。
- OpenClaw / Hermes Agent 接入首版只能走 mock connector profile；真实 CLI、gateway、消息、skills、memory、MCP 和 secret 访问默认关闭。
- 外部 agent 入站结果只能作为候选，不能直接修改文档、代码、issue、PR、生产事实或公开资产。
- HTML 只用于整体交付或阶段汇总报告；单次报告卡继续默认 JSON + Markdown。

## 风险与缓解措施

| 风险 | 缓解 |
| --- | --- |
| Web 与 CLI 逻辑分叉 | 把执行逻辑放在 `packages/demo`，Web build 只调用共享 engine |
| 用户误解 mock 为真实模型分析 | 报告卡和 UI 明确显示 mock route |
| 范围扩散到真实连接器 | 当前模板只读取本地文档或 pasted context |
| 外部 agent 绕过本地治理 | 外部 agent 只作为 ExternalConnector profile，所有 medium/high 风险和真实执行都触发 ApprovalGate 或策略拒绝 |
| HTML 报告替代事实源 | HTML 只从 JSON report cards 渲染，Markdown 仍是默认单次阅读物 |
| 过早承诺现实层能力 | RealityCapture 只保留研究备忘录，不进入 MVP 主线 |
| 报告卡泄漏私有数据 | 默认 `sharePermission=private`，公开分享后续另做审批和脱敏 |
| AI 建议替代人类 owner | 所有模板输出均为候选建议，审批状态默认需要人工复核 |

## 测试与验收

必须通过：

```text
pnpm demo
pnpm demo -- --template repo_understanding_and_work_plan
pnpm knowledge:demo -- --query "AI-HRMS 下一步应该做什么？"
pnpm demo -- --template external_agent_connector_safety_demo
pnpm self-review
pnpm report:html
pnpm validate:operating-entry
pnpm validate:templates
pnpm web:demo
pnpm check
```

验收标准：

- `pnpm web:demo` 能生成 `dist/web/index.html`。
- Web 原型展示首批模板、报告卡预览和执行链路。
- Web 原型展示 3 个内置知识问答样例、来源引用和 Challenge draft 入口。
- Web 使用共享 Demo engine 生成的 JSON 报告卡。
- `pnpm knowledge:demo` 生成 AnswerCard、DocChallengeDraft 和引用二者的 ExecutionReportCard。
- 所有报告卡通过 `validateExecutionReportCard`。
- `pnpm validate:templates` 能校验首批模板 manifest、failure samples 和 `evaluationSamples`。
- `pnpm check` 通过。
- 文档同步说明新增目录、命令和约束。
- `project-operating-entry.md` 能作为下一轮任务选择和 agent 分派入口。
- `config/project-operating-entry.json` 通过 `validateProjectOperatingEntry`，并被 Web Workbench 读取展示。

Phase 0.6 完成度不只看 smoke test，还必须满足可评价证据：

- 首屏证据：Web Workbench 第一屏能看到 FreedomRealm / AI-HRMS 双名定位、Demo Mode、mock route、JSON source、三类入口、推荐下一步和无 live side effects。
- 运行证据：`pnpm demo`、`pnpm demo -- --template repo_understanding_and_work_plan`、`pnpm web:demo` 和 `pnpm check` 都能在无模型 key、无真实连接器、无生产数据条件下通过。
- 报告卡证据：Web 和 Markdown 都只渲染 JSON `ExecutionReportCard`；页面必须提供 canonical JSON 链接。
- 模板治理证据：模板列表必须展示 risk、approval、route 和 share 边界，且这些 badges 只从 `ExecutionReportCard` JSON 字段派生。
- 工作计划证据：`repo_understanding_and_work_plan` 必须在 `extensions["ai-hrms.workPlan"]` 中生成候选 `WorkItem` 和建议 `WorkShard`，并标记为需要 human review 的候选材料。
- 治理证据：Web Workbench 必须展示 `AgentWorkLease` 字段、`writeSet` policy、`MergeGate`、停止条件、P2 live connector 的 human owner / ApprovalGate 边界。
- 交互证据：entry mode 选择应更新推荐模板，Knowledge Challenge 交互只能生成 draft review 提示，不得修改文档。
- 浏览器证据：本地浏览器检查应确认无 console error、无横向溢出、关键入口和候选任务可见。

## 后续迭代

1. 把静态 Web 原型迁移为真正的前端应用，但仍读取同一数据契约。
2. 增加 Knowledge Navigation and Challenge Loop 最小版。
3. 为三个用户可见模板补更细的输入 schema、输出 schema 和评测样本。
4. 增加公开案例库草案，但公开分享必须先完成脱敏和许可。
5. 基于真实反馈决定是否进入真实连接器或 live model。
