# FreedomRealm

FreedomRealm 是 AI 时代的人类与智能体资源管理系统。它把人类参与者、AI 智能体、任务、工具、审批、策略、预算、审计、评测、模板、学习沉淀和跨实例协作统一到一个可治理的项目运行平面中。

FreedomRealm 不是传统 HRMS 的简单改名，也不是泛化的 agent framework。它保留组织、成员、权限、协作与传统 HRMS 能力，同时扩展出 `HumanActor`、`AgentActor`、`WorkItem`、`ToolContract`、`ApprovalGate`、`ProjectInstance`、`GovernanceBrain` 和 `ExecutionReportCard` 等面向人机协作的新契约。

## Project Status

| 项目项 | 当前状态 |
| --- | --- |
| 阶段 | 早期工程与开源化准备阶段 |
| 事实源 | `docs/zh-CN/` 是设计、治理、流程和后续实现的 system of record |
| 可运行内容 | Demo Mode CLI、静态 Web Workbench、知识导航 demo、自我审查报告、Go control-plane mock endpoints |
| 生产可用性 | 尚不交付生产 HRMS、真实连接器、真实模型路由、数据库、Temporal、Keycloak 或完整 ApprovalGate |
| 许可证 | 最终许可证未定，见 [LICENSE-CANDIDATES.md](LICENSE-CANDIDATES.md) |
| 贡献入口 | [CONTRIBUTING.md](CONTRIBUTING.md)、[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)、[SECURITY.md](SECURITY.md) |

当前仓库优先把架构、治理边界、接口契约、Demo Mode、报告卡、模板、评测和最小控制面骨架沉淀为可验证资产。所有 mock endpoint 都只用于契约验证和本地演示，不写生产事实，不触发真实工作流，不访问 secret、生产数据或外部账号。

## Core Ideas

- 人类设定目标、定义边界、审批高风险动作、审查结果并承担最终责任。
- AI 在策略、预算、工具、数据分级和审计约束下执行、分析、生成候选和沉淀反馈。
- 每个 `WorkItem`、`ToolContract`、`ApprovalGate` 和 `ExecutionReportCard` 都应可追溯、可评测、可复盘。
- `GovernanceBrain` 只能生成项目理解、智能分派、多人协调、模型能力治理和自我迭代候选，不能替代人类 owner。
- 多个 `ProjectInstance` 可以通过授权的 `FederationLink` 协作，但默认不互信、不共享私有数据、不绕过本地审批。
- 个人、开源维护者、小团队、社区和多人协作体优先；商业参与不能重定向项目基本方向。

## What Works Today

- `pnpm demo`：运行本地 deterministic Demo Mode，生成 `ExecutionReportCard` JSON 和 Markdown。
- `pnpm web:demo`：生成静态项目学习系统和治理工作台。
- `pnpm knowledge:demo`：运行本地 mock 知识导航与异议闭环。
- `pnpm self-review`：生成项目自我审查与衰减预防报告卡。
- `pnpm check`：运行仓库级验证，包括模板、环境、文档入口、开源资产、测试和 Go control-plane 检查。
- `apps/control-plane`：提供 Go 标准库 HTTP skeleton 和 mock v1 `WorkItem` / `ApprovalGate` endpoints。

Go control-plane 当前暴露以下 mock-only 接口：

```text
GET  /healthz
GET  /metadata
POST /api/v1/work-items
GET  /api/v1/work-items/{workItemId}
POST /api/v1/work-items/{workItemId}/transition
POST /api/v1/approvals
GET  /api/v1/approvals/{approvalId}
POST /api/v1/approvals/{approvalId}/decide
```

这些接口返回 deterministic mock 响应和审计引用。高风险或敏感请求只会返回 `approval_required` 与事件预览，不会创建真实审批队列、通知、Temporal workflow 或持久化事实。

## Quick Start

Prerequisites:

- Node.js `>=24.0.0 <26.0.0`
- pnpm `10.x`
- Go，用于验证或运行 `apps/control-plane`

Install dependencies:

```text
pnpm install --frozen-lockfile=false
```

Run the full repository check:

```text
pnpm check
```

Run the local demo loop:

```text
pnpm demo
```

Generate the static web experience:

```text
pnpm web:demo
```

Run knowledge navigation:

```text
pnpm knowledge:demo -- --query "FreedomRealm 下一步应该做什么？"
```

Run project self-review:

```text
pnpm self-review
```

Run the Go control plane locally:

```text
cd apps/control-plane
go test ./...
go vet ./...
go run ./cmd/control-plane
```

The default control-plane address is `127.0.0.1:8080`. Override it with `FREEDOMREALM_CONTROL_PLANE_ADDR`.

## Outputs

| Command | Main output |
| --- | --- |
| `pnpm demo` | `dist/demo-mode/` |
| `pnpm web:demo` | `dist/web/index.html` and `dist/web/workbench.html` |
| `pnpm knowledge:demo` | `AnswerCard`、`DocChallengeDraft` and linked `ExecutionReportCard` |
| `pnpm self-review` | `project_self_review_and_decay_prevention` report card |
| `pnpm report:html` | `dist/reports/delivery-report.html` |

`ExecutionReportCard` 的 canonical source 是带 `schemaVersion` 的 JSON。Markdown、HTML 和 Web UI 都只是渲染物。

## Repository Layout

```text
apps/
  control-plane/        Go control-plane skeleton and mock v1 endpoints
  web/                  Static web learning system and governance workbench builder
config/
  environments/         Environment profiles and isolation policy inputs
  templates/            Demo templates, failure samples and evaluation samples
docs/zh-CN/             Canonical Chinese documentation and execution plans
packages/
  contracts/            Shared report-card and contract helpers
  demo/                 Demo Mode engine and tests
  knowledge/            Local deterministic knowledge navigation
  policy/               Policy and environment validation helpers
scripts/                Repository validation, demo and report commands
```

## Core Concepts

- `HumanActor`：设定目标、审批高风险动作、验收结果并承担最终责任的人类参与者。
- `AgentActor`：在策略、预算、工具和审计约束下执行工作的 AI 执行者。
- `WorkItem`：最小可管理工作单元，可被领取、拆解、执行、暂停、升级或关闭。
- `ToolContract`：工具的结构化权限边界、输入输出 schema、风险等级和审计标签。
- `ApprovalGate`：高风险动作前的显式人工闸门。
- `PolicyRule`：身份、预算、工具、审批、数据访问和发布策略。
- `Observation`：运行日志、指标、trace、反馈、输出和失败样本。
- `LearningArtifact`：可进入评测、审批、灰度和回滚流程的学习沉淀。
- `ProjectInstance`：一个 FreedomRealm 运行实例，可由个人、团队、社区或企业内部团队运行。
- `GovernanceBrain`：辅助项目理解、智能分派、多人协调、模型能力治理和受控自我迭代的治理型 AI 中枢。
- `ModelCapabilityProfile`：描述模型能力、适用边界、评测结果、成本和降级依据的画像。
- `ExecutionReportCard`：记录一次执行的目标、输入输出引用、风险、审批、发现、失败、修正和分享许可。

## Running Modes

| Mode | Purpose | Boundary |
| --- | --- | --- |
| `Tiny Mode` | 低配设备、教学和轻量试用 | 文件存储或 SQLite，mock model 或人工执行，最小 UI 或 CLI |
| `Demo Mode` | 5 到 10 分钟首次体验 | mock 工具、可选用户自带模型 key、报告卡导出 |
| `Local Mode` | 个人长期使用 | 本地数据库、可选 Docker Compose、本地或远程模型、基础审计 |
| `Community Mode` | 多人共用实例 | 多用户、角色权限、审批流、模板共享、资源配额、可选 `FederationLink` |
| `Enterprise Mode` | 企业和强治理组织 | Keycloak、Temporal、PostgreSQL、LiteLLM Proxy、OpenTelemetry、完整审批和备份恢复 |

自适应运行可以在本地模型、远程模型、mock 模型和人工接管之间降级，但不能绕过审批、安全、审计、预算或数据分级。

## Governance and Safety Boundaries

- 控制面不直接承载 agent 推理图执行逻辑。
- Agent Runtime 不直接写入 HR 主数据真相。
- 生产模型调用必须经过 LiteLLM Proxy 或受控 `ModelRoute`。
- 生产 `ModelRoute` 必须绑定 `ModelCapabilityProfile`、评测结果、数据分级范围、风险等级范围和回退策略。
- 所有高风险动作必须存在 `ApprovalGate`。
- 敏感数据不得以原文作为训练、评测或模型能力改进资源保留。
- 跨实例协作必须使用 `ProjectInstance`、`FederationLink`、`CapabilityOffer`、`CapabilityRequest`、`SharedTemplate` 和 `SharedEvalSummary` 语言。
- 跨实例通信必须保持 `FederationMessage` envelope、`FederationManifest`、`FederationReceipt` 和协议版本兼容。
- 真实 connector、live model、生产数据、secret、外部 issue / PR 创建和 Commons 发布都不是默认授权能力。

## Documentation

- [AGENTS.md](AGENTS.md)：agent 工作规则、知识索引和强制约束入口。
- [ARCHITECTURE.md](ARCHITECTURE.md)：总体架构摘要与关键边界。
- [docs/zh-CN/README.md](docs/zh-CN/README.md)：中文文档库总索引。
- [docs/zh-CN/project-operating-entry.md](docs/zh-CN/project-operating-entry.md)：当前任务、分派、防冲突和停止条件入口。
- [docs/zh-CN/api-contracts.md](docs/zh-CN/api-contracts.md)：接口、事件、请求边界、响应边界和审计点。
- [docs/zh-CN/security-and-governance.md](docs/zh-CN/security-and-governance.md)：身份、策略、预算、审计与合规边界。
- [docs/zh-CN/open-source-strategy.md](docs/zh-CN/open-source-strategy.md)：开源策略、许可证候选、商标和反商业捕获。
- [docs/zh-CN/roadmap.md](docs/zh-CN/roadmap.md)：阶段路线图。

## Contributing

FreedomRealm 欢迎 code、docs、templates、eval samples、failure reports、translations、design discussions、review notes 和 usage reports。

Before opening a pull request:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Check [docs/zh-CN/execution-plans/README.md](docs/zh-CN/execution-plans/README.md) for active work.
3. Keep the change scoped to a clear `WorkItem`, issue or execution plan.
4. Run `pnpm check` and `git diff --check`.

Do not include secret、生产数据、敏感原文、真实 connector 配置、未授权外部账号信息，或任何绕过 `ApprovalGate`、审计、预算、数据分级、`ModelRoute` 和 human review 的变更。

## Roadmap

Near-term engineering priorities:

- Stabilize mock v1 control-plane contracts and keep `/metadata` aligned with route descriptors.
- Keep Demo Mode, Web Workbench, templates, eval samples and report cards deterministic and reproducible.
- Choose the final project license and clarify trademark / official compatibility rules through human owner and community governance.
- Expand implementation only after the relevant docs, API contracts, audit points, evaluation rules and rollback paths are updated.

See [docs/zh-CN/roadmap.md](docs/zh-CN/roadmap.md) and [docs/zh-CN/execution-plans/README.md](docs/zh-CN/execution-plans/README.md) for maintained planning context.

## License

FreedomRealm has not selected a final project license yet. [LICENSE-CANDIDATES.md](LICENSE-CANDIDATES.md) is decision material, not legal advice and not a license grant.
