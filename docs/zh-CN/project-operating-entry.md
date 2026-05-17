# 项目运行入口与任务清单

本文件是人类 owner、主 agent 和协作 agent 每次打开仓库后的默认工作入口。它不替代 README、ARCHITECTURE 或专题文档，而是回答一个更具体的问题：现在下一步做什么，如何分派，如何避免冲突，什么时候允许停止。

人类阅读以本 Markdown 为入口；机器校验和 Web Workbench 展示以 [../../config/project-operating-entry.json](../../config/project-operating-entry.json) 为事实源。该 manifest 使用 `project-operating-entry.v1`，必须通过 `pnpm validate:operating-entry`，并由 `pnpm check` 自动执行。模板 manifest、失败样本和 `evaluationSamples` 的专项根命令是 `pnpm validate:templates`。

## 使用顺序

每次开始工作先执行这 5 步：

1. 读取 [AGENTS.md](../../AGENTS.md)、[README.md](../../README.md)、[ARCHITECTURE.md](../../ARCHITECTURE.md) 和 [docs/zh-CN/README.md](README.md)。
2. 查看本文件的“当前推荐任务清单”和“分派规则”。
3. 查看 [execution-plans/README.md](execution-plans/README.md) 和 `execution-plans/active/`，确认当前计划是否仍有效。
4. 需要重新判断下一步时运行：

```text
pnpm knowledge:demo -- --query "AI-HRMS 下一步应该做什么？"
pnpm self-review
```

5. 选择一个 P0 或 P1 `WorkItem`，登记 owner、范围、验证方式和停止条件后再进入实现。

## 当前推荐任务清单

P0 是当前打开仓库后默认优先级。除非用户明确改变方向，agent 应优先从 P0 中选择最小可验证任务。

| 优先级 | 任务 | 建议 owner | 产出 | 验收 |
| --- | --- | --- | --- | --- |
| P0 | Web Workbench 第一屏继续收敛为“下一步工作台” | HumanActor + AgentActor | 三类入口、推荐下一步、报告卡预览、当前计划入口 | `pnpm web:demo` 和 `pnpm check` 通过 |
| P0 | 把 `repo_understanding_and_work_plan` 输出转成可读任务清单 | AgentActor | `WorkItem` 候选、`WorkShard` 建议、风险和验证命令 | 报告卡包含 nextActions、风险、来源引用 |
| P0 | 建立多 agent 防冲突最小规则 | HumanActor + AgentActor | `AgentWorkLease` 模板、`writeSet` 冲突规则、`MergeGate` 检查清单 | 质量门禁和执行计划同步 |
| P0 | 抬高 MVP 验收标准 | HumanActor | MVP 从“能跑通”升级为“可评价、可分派、可复盘、可继续推进” | capability、quality gates、phase 0.6 计划同步 |
| P1 | 把自我审查结果转成正式 `WorkItem` 候选 | AgentActor | 自审报告卡到候选任务的映射规则 | 不自动修改仓库，只生成候选 |
| P1 | 为首批用户可见模板补评测样本 | AgentActor | template manifest、失败样本、`evaluationSamples`、报告卡案例 | `pnpm validate:templates` 通过，样本可引用且不依赖真实连接器 |
| P2 | 真实连接器和 live model 增强 | HumanActor 审批后 | 受控增强路径 | 不改变 MVP 通过标准，不绕过 `ApprovalGate` |

## 分派规则

单 agent 适合处理范围明确、`writeSet` 单一、可以在一次验证内完成的任务。

当任务满足以下任一条件时，必须考虑拆成多个 `WorkShard`：

- 涉及 3 个以上边界上下文。
- 同时需要产品、接口、实现、测试和文档。
- 预计超过 30 到 60 分钟，且中途需要 checkpoint。
- 需要并行探索不同方案。
- 影响 `ToolContract`、`ApprovalGate`、`ExecutionReportCard`、数据分级或预算策略。

每个 `WorkShard` 必须有对应 `AgentWorkLease`。主 agent 可以自动生成 lease，但不能省略边界。当前标准字段为：

- `leaseId`、`workItemId`、`shardId`、`parentShardId`。
- `ownerAgentRole`、`objective`、`nonGoals`。
- `readSet`：允许读取的主要文件、目录或数据引用。
- `writeSet`：允许修改的文件、目录、接口、schema 或文档范围。
- `allowedToolContracts`、`forbiddenActions`，禁止动作必须覆盖真实外部连接器、生产数据、secret、公开分享和未授权高风险写入。
- `dataClassification`、`riskLevel`、`modelRoute`。
- `expectedOutputSchema`、`checkpointPolicy`、`validationCommands`。
- `deliverables`、`rollbackPlan`、`mergeGateRequirements`、`stopConditions`。

没有 `AgentWorkLease` 的 subagent 不得修改文件、配置、代码、schema 或长期文档。subagent 也不得自行扩大 `writeSet`；需要扩大时必须回到主 agent 或 human owner。

并行 `WorkShard` 的 `writeSet` 默认不得重叠。必须重叠时，需要指定统一 owner，并在 `MergeGate` 中人工复核。

## WorkShard 生命周期

多 agent 任务按以下顺序推进：

1. 主 agent 选择一个正式或候选 `WorkItem`，明确目标、风险、验证命令和停止条件。
2. 主 agent 拆分 `WorkShard`，为每个 shard 生成 `AgentWorkLease`。
3. 子 agent 在 lease 内探索、实现或评审，输出结构化 `ShardResult`，不得直接并入主线事实。
4. 主 agent 汇总 `ShardResult`，生成或更新 `ChangePacket`。
5. 进入 `MergeGate`，检查冲突、契约、数据分级、审批、测试和文档一致性。
6. `MergeGate` 通过后才允许提交或进入下一步；不通过时只能修复同范围问题、缩小范围或请求 human owner 决策。

## 防冲突规则

多 agent 协作的最小规则：

- 一个任务只能有一个最终 owner。
- 子 agent 可以探索、实现或评审，但不能独立把结果并入主线事实。
- `writeSet` 冲突时，后启动的 shard 必须等待、缩小范围或转为只读探索。
- 同一路径不得同时执行 update、delete 或重写；同一 schema、接口或命令入口不得由多个 shard 并行定义。
- 影响 `ApprovalGate`、`ToolContract`、`DataClassification`、`ExecutionReportCard`、`ModelRoute` 或 `FederationMessage` 的变更必须显式进入 `MergeGate`。
- `ChangePacket` 必须列出文件、接口影响、测试结果、风险、人工复核点和回滚方式。
- `MergeGate` 必须检查契约、文档一致性、测试、数据分级、成员权利、模型路由和审批要求。
- 高风险动作仍必须回到 `ApprovalGate`，不能因为拆成多个 agent 而降低风险等级。
- 连续两个 shard 输出互相矛盾且无法裁决时必须停止，并请求 human owner 决策。

## ChangePacket 和 MergeGate

涉及实现、文档、schema、架构或配置的合并必须形成 `ChangePacket`，至少说明：

- changedFiles、changedConcepts、interfaceImpact、schemaImpact、documentationImpact。
- securityImpact、dataLifecycleImpact、memberRightsImpact、modelRouteImpact、federationImpact。
- testsRun、validationResults、risks、rollbackPlan、followUpWorkItems、humanReviewRequired。

`MergeGate` 最小检查清单：

- `writeSet` 是否合规，是否存在未声明路径或并行冲突。
- 是否引入未登记术语，是否违反 AI-HRMS / FreedomRealm 定位。
- 是否违反技术栈方向、`ApprovalGate`、`DataClassification`、成员权利或反监控边界。
- 是否影响 `ExecutionReportCard`、`ToolContract`、`FederationMessage` 或 `ModelRoute`。
- 是否同步了相关文档、manifest 或测试。
- 是否有可运行验证和明确回滚方式。
- 是否需要 human owner 决策。

## 持续推进与停止条件

用户可以指定“在某个时间点前不要停止”。AI-HRMS 对这类请求采用质量优先解释：agent 应在指定时间前持续推进可验证路径，但不能为了不停而扩大风险、绕过审批或堆积未验证变更。

允许停止的条件：

- 用户明确要求暂停或改变方向。
- 当前 `WorkItem` 已完成，并通过约定验证。
- 触发 `ApprovalGate`、权限限制、数据分级限制或需要人工决策。
- 继续推进会要求修改未授权 `writeSet`。
- 继续推进会显著降低质量，例如无法验证、上下文混乱、依赖缺失或风险无法判断。
- 到达约定 checkpoint，并已交付清晰的 `ChangePacket` 或 `ExecutionReportCard`。

不允许停止的情况：

- 只是完成了一个子步骤，但仍有明确的同范围下一步。
- 测试或检查失败且存在合理修复路径。
- 文档、代码、执行计划或质量门禁之间出现明显不一致。
- 还没有说明当前结果、剩余风险和下一步。

持续推进的默认节奏：

1. 先完成当前最小闭环。
2. 运行对应验证。
3. 若失败，优先修复同范围问题。
4. 若成功，推进下一个同优先级小任务。
5. 到 checkpoint 时汇总 `ChangePacket`，再决定继续、拆分或等待人工确认。

## 外部实践借鉴

本仓库吸收外部实践，但不把任何供应商能力变成核心契约。

- AGENTS.md 实践说明：agent 需要稳定、可发现的仓库级入口；本仓库保留 AGENTS.md 作为规则入口，把详细知识放在专题文档中。
- GitHub Copilot cloud agent 实践说明：成熟项目应先有自定义指令、环境准备、issue 化任务，再分派 agent；本仓库把复杂任务放入 `execution-plans/active/` 和 `WorkItem` 候选。
- Claude Code subagent 实践说明：子 agent 应专责、描述清晰、工具权限最小化、纳入版本控制；本仓库用 `WorkShard` 和 `AgentWorkLease` 表达同类约束。
- Claude Code Stop hook 实践说明：停止可以被条件化，但需要防止无限运行；本仓库把停止条件绑定到质量、验证、审批和 checkpoint。
- Google developer documentation style 实践说明：先遵守项目自身风格，再借鉴通用文档风格；本仓库仍以 `docs/zh-CN/` 为 system of record。

外部资料统一登记在 [references.md](references.md)。
