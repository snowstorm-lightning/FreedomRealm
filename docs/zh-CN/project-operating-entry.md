# 项目运行入口与任务清单

本文件是人类 owner、主 agent 和协作 agent 每次打开仓库后的默认工作入口。它不替代 README、ARCHITECTURE 或专题文档，而是回答一个更具体的问题：现在下一步做什么，如何分派，如何避免冲突，什么时候允许停止。

人类阅读以本 Markdown 为入口；机器校验、项目学习系统首页和 Web Workbench 展示以 [../../config/project-operating-entry.json](../../config/project-operating-entry.json) 为事实源。该 manifest 使用 `project-operating-entry.v1`，必须通过 `pnpm validate:operating-entry`，并由 `pnpm check` 自动执行。模板 manifest、失败样本和 `evaluationSamples` 的专项根命令是 `pnpm validate:templates`。

## 使用顺序

每次开始工作先执行这 5 步：

1. 读取 [AGENTS.md](../../AGENTS.md)、[README.md](../../README.md)、[ARCHITECTURE.md](../../ARCHITECTURE.md) 和 [docs/zh-CN/README.md](README.md)。
2. 查看本文件的“当前推荐任务清单”和“分派规则”。
3. 查看 [execution-plans/README.md](execution-plans/README.md) 和 `execution-plans/active/`，确认当前计划是否仍有效。
4. 需要重新判断下一步时运行：

```text
pnpm knowledge:demo -- --query "FreedomRealm 下一步应该做什么？"
pnpm self-review
```

5. 选择一个 P0 或 P1 `WorkItem`，登记 owner、范围、验证方式和停止条件后再进入实现。

## 当前推荐任务清单

P0 是当前打开仓库后默认优先级。除非用户明确改变方向，agent 应优先从 P0 中选择最小可验证任务。

| 优先级 | 状态 | 任务 | 建议 owner | 产出 | 验收 |
| --- | --- | --- | --- | --- | --- |
| P0 | implemented-in-repo (`0e0733e`, `a5d5e50`, `2d1973c`) | 项目学习系统首页与 Web Workbench 拆页落地 | HumanActor + AgentActor | 项目学习首页、多页面导航、任务化学习路径、完整工作台独立页面、三类入口、推荐下一步、报告卡预览、当前计划入口、Review Prompts、Running Modes、Owner Decision Queue、active plan 状态提示、人工复核 decay prevention backlog、canonical view hash 深链 | `pnpm web:demo` 和 `pnpm check` 通过 |
| P0 | implemented-in-repo (`81ce7ab`, `0532341`, `49cb758`, `db3bfc1`) | 把项目运行入口提升为可校验 manifest | AgentActor | `project-operating-entry.v1` manifest、validator、根命令、hardening evidence 校验 | `pnpm validate:operating-entry` 和 `pnpm check` 通过 |
| P0 | implemented-in-repo (`365bb77`) | 建立多 agent 防冲突最小规则 | HumanActor + AgentActor | `AgentWorkLease` 模板、`writeSet` 冲突规则、`MergeGate` 检查清单 | 每个 `WorkShard` 都能声明 `readSet`、`writeSet`、验证命令和回滚说明；并行 `writeSet` 默认 non-overlapping；高风险动作不能因拆分绕过 `ApprovalGate` |
| P1 | implemented-in-repo (`f6c3cb7`, `59d2adb`, `5f7cadb`) | 同步外部 agent connector 治理文档与测试 | HumanActor + AgentActor | `ExternalConnector` 治理文档同步说明、`ApprovalGate` 与数据分级一致性检查、相关策略测试更新 | `pnpm check` 通过；不启用真实 connector；保留 `candidate-work-item-001` 来源和 `user-approved-continuation-20260517` 人工批准记录 |
| P1 | implemented-in-repo (`2bc71d5`) | 建立人工复核的衰减预防 backlog | HumanActor | human-reviewed decay prevention backlog、正式 `WorkItem` 记录、来源追踪 | `pnpm self-review` 和 `pnpm check` 通过；保留 `candidate-work-item-002` 来源和 `user-approved-continuation-20260517` 人工批准记录；2026-05-19 human owner 复核接受当前 backlog 台账 |
| P1 | implemented-in-repo (`578b08f`, `bae8140`, `72aa79d`) | 为首批用户可见模板补评测样本 | AgentActor | template manifest、失败样本、`evaluationSamples`、报告卡案例 | `pnpm validate:templates` 和 `pnpm check` 通过，样本可引用且不依赖真实连接器；失败样本保留 `expectedBlockingPoint`、`humanReviewStatus` 和 `reproducibleInputRefs`；`evaluationSamples` 保留输入引用、数据分级、用途限定、保留期和数据来源边界 |
| P1 | implemented-in-repo (`138f653`, `21b24fe`, `87d543a`, `6f87114`, `cca2884`, `70fb1f4`) | 加固本地 CLI 与验证入口的工作区边界 | AgentActor | CLI 参数值防护、Demo / Knowledge / self-review 输出边界、Delivery HTML 输入输出边界、manifest override、template directory override 和环境验证路径边界 | `pnpm web:demo`、`pnpm test` 和 `pnpm check` 通过；不启用真实 connector、live model、secret、生产数据或外部写入 |
| P2 | blocked-needs-human-owner | 真实连接器和 live model 增强 | HumanActor 审批后 | 受控增强路径 | 不改变 MVP 通过标准，不绕过 `ApprovalGate` |

自我审查晋升记录：`dist/self-review/report-02cd1888-6f32-495e-b171-da73d311a116.json` 中的 `candidate-work-item-001` 和 `candidate-work-item-002` 已经由 `user-approved-continuation-20260517` 批准，从候选材料晋升为正式 P1 任务。该批准不授权执行 P2 live connectors、创建外部 issue / PR、访问 secret 或扩大数据分级边界。

已验证但不单独形成 WorkItem 的契约加固记录在 `config/project-operating-entry.json` 的 `extensions["freedomrealm.validatedHardening"]` 中：

- `eff88fd`：补充 `AnswerCard` confidence 校验与测试。
- `419e7d7`：补充 `ExecutionReportCard.dataClassification` 校验与测试。
- `7a380d6`：补充知识来源行号范围校验与测试。

### 衰减预防 Backlog

机器事实源在 `extensions["freedomrealm.decayPreventionBacklog"]` 中保留人工复核后的衰减预防 backlog。该 backlog 只用于追踪自我审查候选项的来源、owner、风险、`readSet`、`writeSet`、验证命令、人工批准引用和实现引用；它不授权 `pnpm self-review` 修改仓库，不自动创建 issue / PR，不自动公开 Commons 资产，也不把候选结论变成成员义务。

当前记录：

- `candidate-work-item-001` 已映射到 `p1-connector-governance-sync`，状态为 `implemented-in-repo`，实现引用为 `f6c3cb7`、`59d2adb` 和 `5f7cadb`。
- `candidate-work-item-002` 已映射到 `p1-decay-prevention-backlog`，状态为 `implemented-in-repo`，实现引用为 `2bc71d5`；2026-05-19 human owner 已复核接受当前 backlog 台账。
`pnpm validate:operating-entry` 会校验任务状态、已实现任务的 `implementationRefs`，并检查 backlog 中已实现候选与正式任务实现引用是否漂移。通过 `FREEDOMREALM_OPERATING_ENTRY_PATH` 覆盖 manifest 路径时，目标仍必须解析到仓库工作区内部，不能读取仓库外文件。

### 当前 Human Owner 决策点

以下条目是候选决策，不是自动分派。拒绝、延后、缩小范围或转交都不能成为负面贡献信号。

Go Core Control Plane skeleton 在进入实现前仍需要 human owner 确认：

- Go module import path。
- HTTP 框架：标准库优先、chi、Echo 或其他。
- Rust policy / contract / protocol kernel 集成方式：CLI、FFI、sidecar、WASM 或 generated bindings。
- 首期 endpoint 范围：只暴露 health / metadata，还是加入 mock v1 contract endpoints。
- 本地存储：文件、SQLite，或暂不持久化。

真实 connector / live model 增强仍停留在 P2，不自动推进。进入设计或实现前至少需要确认：

- 生产 external agent run 默认策略是直接 policy denial，还是进入 `ApprovalGate`。
- `ExternalAgentRunRequest` 是否需要显式增加 redaction / sanitization 字段，用于 restricted / sensitive 出站数据。
- 是否允许任何真实外部连接器、secret、账号、消息记录、MCP 配置、skills、memory 或生产数据进入本轮 readSet / writeSet；默认答案仍是否。

Active execution plans 状态清理已在 2026-05-19 完成：

- `phase-0-doc-foundation.md`、`phase-0-5-freedomrealm-repositioning.md` 和 `phase-1-environment-isolation-guard.md` 已归档到 `docs/zh-CN/execution-plans/completed/`。
- `phase-1-go-control-plane-skeleton.md` 继续保留为 active，等待 human owner 关闭 Go module import path、HTTP 框架、Rust kernel 集成方式、首期 endpoint 范围和本地存储策略。

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
- `expectedOutputSchema`、`checkpointPolicy`、`verificationCommands`。
- `deliverables`、`rollbackPlan`、`mergeGateRequirements`、`stopConditions`。

最小 `AgentWorkLease` 模板如下。字段名必须与 `config/project-operating-entry.json` 的 `leaseTemplate.requiredFields` 保持一致；执行者可以缩小值域，但不能省略 `readSet`、`writeSet`、`verificationCommands` 或 `rollbackPlan`：

```json
{
  "leaseId": "lease-YYYYMMDD-short-id",
  "workItemId": "p0-multi-agent-conflict-guard",
  "shardId": "docs-conflict-rules",
  "parentShardId": null,
  "ownerAgentRole": "AgentActor",
  "objective": "在授权范围内完成一个可验证子任务",
  "nonGoals": ["不启用真实 connector", "不访问 secret 或生产数据"],
  "readSet": ["config/project-operating-entry.json", "docs/zh-CN/project-operating-entry.md"],
  "writeSet": ["docs/zh-CN/project-operating-entry.md"],
  "allowedToolContracts": ["repo.read", "repo.write.docs", "test.local"],
  "forbiddenActions": ["live connector execution", "secret access", "production data access", "ApprovalGate bypass"],
  "dataClassification": "public-docs-only",
  "riskLevel": "low",
  "modelRoute": "local-analysis",
  "expectedOutputSchema": "ShardResult",
  "checkpointPolicy": "完成同范围改动后输出 ChangePacket 并运行验证命令",
  "verificationCommands": ["pnpm validate:operating-entry", "pnpm check"],
  "deliverables": ["更新后的文档或测试"],
  "rollbackPlan": "回退本 shard 涉及的提交或恢复 writeSet 中列出的文件",
  "mergeGateRequirements": ["writeSet non-overlap", "docs and manifest field names match"],
  "stopConditions": ["需要扩大 writeSet", "触发 ApprovalGate", "触发 dataClassification 限制"]
}
```

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

冲突处理默认表：

| 冲突信号 | 默认处理 | 可覆盖条件 |
| --- | --- | --- |
| 两个 shard 声明同一路径、schema、接口或命令入口的 `writeSet` | 后启动 shard 等待、缩小范围或转为只读探索 | human owner 指定统一 owner，并在 `MergeGate` 人工复核 |
| 低风险 shard 顺带修改 `ApprovalGate`、`ToolContract`、`DataClassification`、`ExecutionReportCard`、`ModelRoute` 或 `FederationMessage` | 阻断合并，并把该影响拆成独立高风险候选 | human owner 重新授权新的 `AgentWorkLease` 和验证命令 |
| shard 需要读取 secret、生产数据、真实 connector 凭证或未授权 MCP 配置 | 立即停止该 shard | 只有显式审批、数据分级和审计设计齐备后才能重开 |
| 两个 `ShardResult` 对事实、接口或治理边界给出互相矛盾结论 | 不选择任一结论并生成待决问题 | human owner 裁决，或补充只读调查 shard |

## ChangePacket 和 MergeGate

涉及实现、文档、schema、架构或配置的合并必须形成 `ChangePacket`，至少说明：

- changedFiles、changedConcepts、interfaceImpact、schemaImpact、documentationImpact。
- securityImpact、dataLifecycleImpact、memberRightsImpact、modelRouteImpact、federationImpact。
- testsRun、validationResults、risks、rollbackPlan、followUpWorkItems、humanReviewRequired。

`MergeGate` 最小检查清单：

- `writeSet` 是否合规，是否存在未声明路径或并行冲突。
- 是否引入未登记术语，是否违反 FreedomRealm 定位。
- 是否违反技术栈方向、`ApprovalGate`、`DataClassification`、成员权利或反监控边界。
- 是否影响 `ExecutionReportCard`、`ToolContract`、`FederationMessage` 或 `ModelRoute`。
- 是否同步了相关文档、manifest 或测试。
- 是否有可运行验证和明确回滚方式。
- 是否需要 human owner 决策。

## 持续推进与停止条件

用户可以指定“在某个时间点前不要停止”。FreedomRealm 对这类请求采用质量优先解释：agent 应在指定时间前持续推进可验证路径，但不能为了不停而扩大风险、绕过审批或堆积未验证变更。

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
