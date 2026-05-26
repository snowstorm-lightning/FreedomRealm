# ADR-0011: 项目正式更名为 FreedomRealm

## 状态

Accepted

## 背景

项目早期名称为 AI-HRMS，并通过 ADR-0004 扩展了 AI 时代 HRMS 的定义。该定义仍然有效：系统管理 `HumanActor`、`AgentActor`、`WorkItem`、`ToolContract`、`ApprovalGate`、`PolicyRule`、`Observation`、`LearningArtifact`、`ProjectInstance`、`GovernanceBrain` 和 `DomainWorkflow`，让标准化工作在明确约束下由 AI 执行，由人类负责目标、边界、审批、验收和最终责任。

随着项目从传统 HRMS 叙事扩展到个人、社区、开源项目、小团队、工作室、合作社、企业内部团队和跨实例协作，当前名称需要从 AI-HRMS 正式切换为 FreedomRealm。

## 决策

项目正式更名为 FreedomRealm。

从本 ADR 起：

- 当前项目名、仓库名、产品叙事、包名、crate 名、命名空间、示例环境资源名前缀和默认展示文案统一使用 FreedomRealm / `freedomrealm`。
- AI-HRMS 仅作为历史名称、旧文档上下文、迁移说明或兼容别名出现，不能再作为当前项目名。
- ADR-0004 中关于“保留 AI-HRMS 名称”的命名决策被本 ADR 取代；ADR-0004 的 AI 时代 HRMS 定义、传统 HRMS 能力保留和治理边界继续有效。
- 更名不改变审批、审计、预算、数据分级、模型路由治理、跨实例协作、个人与社区优先原则或 Enterprise Mode 的强治理要求。
- 未来如果需要保留旧 `ai-hrms` 协议、endpoint、schema namespace 或 extension key 兼容层，必须明确标注为 legacy alias，并通过评测、文档和迁移窗口管理。

## 后果

### 正面

- 当前项目名称与个人、社区、开源协作和多实例治理愿景更一致。
- 文档、包名、环境资源、协议示例和 Web Workbench 展示可以收敛到同一个名称。
- 后续传播不再需要长期维持 FreedomRealm / AI-HRMS 双名定位。

### 负面

- 需要一次性更新文档、脚本、测试、包元数据、环境样例、协议示例和 GitHub 仓库名称。
- 已生成的旧 JSON、报告卡或外部集成可能仍带 `ai-hrms` 命名空间；如果需要读取旧数据，必须设计兼容读取或迁移。
- 历史 ADR 和归档执行计划中会继续出现 AI-HRMS，读者需要通过本 ADR 理解命名演进。

## 替代方案

- 继续保留 AI-HRMS：减少迁移成本，但继续增加传播解释成本。
- 长期使用 FreedomRealm / AI-HRMS 双名：短期兼容性更强，但会让当前项目身份持续模糊。
- 改成通用 Work OS 名称：更宽泛，但会削弱 HRMS 根基、人类责任边界和治理系统定位。

## 验证方式

- README、AGENTS、ARCHITECTURE、docs/zh-CN 入口和愿景文档使用 FreedomRealm 作为当前项目名。
- `package.json`、workspace package、Rust crate、环境样例、extension key、schema namespace、external agent direction 和测试期望使用 `freedomrealm` 命名空间。
- `pnpm validate:operating-entry` 和 `pnpm check` 通过。
