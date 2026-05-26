# ADR-0010: Go 控制面与 Rust 治理内核语言方向

## 状态

Accepted

## 背景

ADR-0009 将 FreedomRealm 的短期技术栈基线统一到 Node.js 24 LTS、NestJS 11、Prisma ORM 6.x、PostgreSQL 18 和 Python Agent Runtime。这一决策适合当时的文档底座、Demo Mode、静态 Web Workbench 和仓库脚本阶段，但它把长期生产 Core Control Plane 也默认放在 Node.js / NestJS 上。

FreedomRealm 的新会话规则要求长期生产架构更偏向类型安全、可审计、可本地部署、可长期维护、可治理的语言与运行时。控制面负责事实、权限、审批、审计、ProjectInstance、WorkItem、ApprovalGate、PolicyRule、ExecutionReportCard 和 Federation 等核心边界，不应由 agent runtime 或临时 demo 工具链默认承载。

因此需要新增后续 ADR，保留 ADR-0009 的“单一稳定基线、避免 Current/RC 作为生产强制依赖、跨平台可验证”原则，但修正长期 Core Control Plane 的默认语言方向，并明确 Rust 在治理内核中的位置。

## 决策

FreedomRealm 的长期生产 Core Control Plane 默认采用 Go。Rust 默认用于 Policy / Contract / Protocol Kernel。

分层语言方向如下：

- 前端与 Web Workbench：TypeScript，继续用于 Web UI、报告卡展示、审批台、模板市场、文档交互和前端状态管理。
- Demo、仓库脚本和轻量 glue code：Node.js 可以继续使用，当前 pnpm workspace、Demo Mode、静态 Web Workbench 和校验脚本不需要立即迁移。
- Core Control Plane Service：Go，负责事实、权限、审批、审计、WorkItem 状态、ProjectInstance 管理、ReportCard 服务、Federation Gateway、本地部署服务和云原生部署入口。
- Policy / Contract / Protocol Kernel：Rust，负责 ToolContract 校验、PolicyRule 执行、DataClassification 继承检查、FederationMessage envelope 校验、ExecutionReportCard schema 校验、风险等级判定、CLI 校验器和可选 WASM 插件。
- Agent Runtime 与 AI 生态适配：Python 可用于 LangGraph、模型实验、evals、数据分析、embedding / retrieval 原型、外部 agent adapter 和快速 proof-of-concept。

Python 不默认拥有核心事实写入权。Python agent 输出必须进入控制面校验、审计和必要审批，不能绕过 ToolContract、ApprovalGate、PolicyRule、DataClassification 或 ExecutionReportCard schema。

Node.js 不再是长期生产 Core Control Plane 的默认主语言。若未来仍希望在生产控制面采用 Node.js / NestJS，必须新增 ADR 说明原因、边界、替代方案、风险、测试、回滚方式和治理影响。

NestJS 不作为长期生产控制面默认实现。它仍可作为 TypeScript-only 原型、mock adapter、教学样例或迁移前临时服务使用，但不得承载长期事实源、审批、审计、权限、策略或数据分级边界。

面向 Windows 个人用户、Tiny Mode、Demo Mode 和 Local Mode，Go 控制面应优先支持单二进制分发和本地 SQLite / 文件存储路径。Rust 内核应作为已编译库、CLI validator、WASM 组件或内部 crate 被调用，避免把个人用户和早期贡献者暴露在全量 Rust 后端编译门槛下。

## 后果

- ADR-0009 中关于控制面采用 Node.js / NestJS 的部分被本 ADR 取代。
- ADR-0009 中关于“只采用稳定版本、避免 Current/RC 作为 Enterprise Mode 强制依赖、升级必须同步文档和验证”的原则继续有效。
- 当前仓库的 pnpm、Node.js 脚本、Demo Mode、静态 Web Workbench 和校验脚本继续保留，不触发工程迁移。
- Phase 1 进入真实服务实现前，需要为 Go 控制面 skeleton 和 Rust 治理内核边界新增或更新 execution plan，至少说明 API 框架、数据库访问、迁移、FFI / CLI / WASM 调用边界、测试、部署和回滚方式。
- Web Workbench 和报告卡展示仍保持 TypeScript 优先，不因控制面语言方向变化而阻断 MVP 闭环。
- Agent Runtime 可以继续使用 Python，但必须通过控制面、策略、审批和审计边界写入候选结果。
- Windows 个人用户路径优先得到 Go 单二进制和 mock / SQLite 本地闭环，不要求先安装完整企业栈、真实模型 key 或 Rust 构建链。

## 替代方案

- 继续使用 Node.js / NestJS 作为长期控制面默认主语言：短期开发快、与现有 pnpm workspace 一致，但与新的类型安全、审计、长期治理和生产控制面方向不一致。
- 立即全量迁移仓库到 Go 与 Rust：会破坏当前 Demo Mode 和 Web Workbench 的 MVP 节奏，属于过早迁移。
- 全部后端都采用 Rust：契约和策略内核更强，AI 也容易借助编译器定位错误，但 API 服务、Windows 本地分发、云原生运维和社区贡献门槛可能更高。
- 全部后端都采用 Go：部署与服务工程更直接，但策略 / 协议内核的强类型和安全边界需要额外约束，难以充分利用 Rust 编译器对高治理契约的错误预防能力。

## 安全、审批、审计和回滚影响

- 安全：该决策不放宽任何 ApprovalGate、PolicyRule、DataClassification、ModelRoute 或 Federation 边界。
- 审批：高风险动作仍必须经过 ApprovalGate；语言选择不能降低风险等级。
- 审计：控制面语言变化后仍必须保留同等或更强的 AuditEvent、PolicyEvaluation 和 ExecutionReportCard 可追溯性。
- 回滚：当前为文档决策，不触发代码迁移；未来实现阶段必须为服务迁移、数据库迁移和发布路径单独定义回滚计划。

## 后续工作

- 同步 `ARCHITECTURE.md`、`architecture-blueprint.md`、`developer-experience.md`、`deployment-and-operations.md` 和 `quality-gates.md` 中的控制面技术栈描述。
- 在 Phase 1 真实服务实现前，新增或更新执行计划，定义首个 Go Core Control Plane skeleton 和 Rust Policy / Contract / Protocol Kernel 的调用边界。
- 若新增 Go 或 Rust 服务 / 包目录，必须满足文件组织门禁：有可运行入口、测试、README 或长期维护责任，不创建空目录。
