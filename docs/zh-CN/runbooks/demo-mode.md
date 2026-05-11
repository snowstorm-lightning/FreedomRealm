# Demo Mode CLI Runbook

## 目标

首版 Demo Mode 采用 CLI-first。它用于跑通：

`WorkItem -> AgentActor -> ToolContract -> ApprovalGate -> Observation -> ExecutionReportCard`

首个模板是 `docs_review_and_improvement`。该模板只读取仓库文档并生成建议、失败复盘样例和报告卡，不会自动修改文档。

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
```

`--model live` 只是增强路径。未显式配置时会回退到 `mock`，且不会改变报告卡 schema、审批、审计或数据分级。

## 输出

CLI 会生成两类文件：

- `*.json`：`ExecutionReportCard` canonical source，包含 `schemaVersion`。
- `*.md`：从 JSON 渲染出的默认 Markdown。

Markdown 只是渲染物。后续 Web UI 必须读取同一份 JSON，不能复制业务逻辑或另建报告卡事实结构。

## 安全边界

- 默认不需要真实模型 key。
- 默认不调用外部连接器。
- 默认不读取真实 HR 数据。
- 不自动修改文档。
- 建议输出必须由 `HumanActor` 复核后，才能另行创建文档修改 WorkItem。

