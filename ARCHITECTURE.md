# Architecture Summary

AI-HRMS 采用“Core Control Plane + GovernanceBrain + Agent Runtime + Workflow Backbone + Adaptive Runtime + Federation/Commons 扩展层”的结构。它保留传统 HRMS 的组织、账号、员工档案、考勤、权限和协作内容能力，同时扩展为 AI 时代的人类与智能体资源管理系统。

## Why This Shape

- 控制面保留事实、权限、审批、审计和 HR 主数据真相。
- GovernanceBrain 连接项目上下文、成员画像、任务分派、模型能力画像和学习候选，辅助长期演化但不拥有超级权限。
- Agent Runtime 专注 agent graph、tool-calling、上下文组装、状态记忆、人类中断和恢复。
- Temporal 承担跨系统长流程、补偿、超时、人工审批和恢复。
- Adaptive Runtime 让 Tiny、Demo、Local、Community 和 Enterprise 五种档位共享核心抽象，但不共享安全豁免。
- Federation/Commons 扩展层通过稳定 `FederationProtocol` 支持实例授权协作、模板共享和脱敏评测摘要交换，默认不互信、不共享私有数据。

## Core Components

- Web 控制台：Next.js 16.2 + React 19 + TypeScript 6.0
- AI-HRMS Core Control Plane：长期生产方向采用 Go 服务主干，承载事实、权限、审批、审计、ProjectInstance、WorkItem、ReportCard 和 Federation Gateway；当前 Node.js / pnpm 仍用于 Web、Demo 和仓库脚本
- Policy / Contract / Protocol Kernel：采用 Rust，用于 `ToolContract`、`PolicyRule`、`DataClassification`、`FederationMessage` 和 `ExecutionReportCard` 等高治理契约校验
- Agent Runtime：Python 可用于 LangGraph、AI adapter、evals 和模型实验，但不默认拥有核心事实写入权
- Workflow Backbone：Temporal
- Adaptive Runtime Layer：Resource Profile Detector、Adaptive Model Router、Adaptive Task Scheduler
- GovernanceBrain：项目上下文图谱、TaskFitAssessment、ModelCapabilityProfile、受控自我迭代建议
- Identity：Keycloak，Enterprise Mode 必选，轻量档位可降级为本地身份或单用户模式
- Model Gateway：LiteLLM Proxy 或受控 ModelRoute
- Observability：OpenTelemetry Collector + Grafana/Loki/Tempo + Langfuse self-host，轻量档位可降级
- Template & Commons Layer：Workflow Template、Skill Recipe、ToolContract、Eval sample、Failure case、Review note
- Federation Gateway / Federation Connector：FederationLink、CapabilityOffer、CapabilityRequest、SharedTemplate、SharedEvalSummary
- FederationProtocol：FederationManifest、FederationMessage、FederationReceipt 和版本兼容规则
- Execution Report Generator：生成脱敏的 ExecutionReportCard

## Running Modes

| 模式 | 目的 | 架构边界 |
| --- | --- | --- |
| `Tiny Mode` | 低配设备、教学、轻量试用 | 文件存储或 SQLite，mock model 或手动执行，最小 UI 或 CLI |
| `Demo Mode` | 5 到 10 分钟跑通最小闭环 | SQLite、mock 工具、用户自带模型 API key、ExecutionReportCard |
| `Local Mode` | 个人长期使用 | 本地数据库、可选 Docker Compose、本地或远程模型、基础审计 |
| `Community Mode` | 多人实例 | 多用户、角色权限、审批流、模板共享、资源配额、可选 FederationLink |
| `Enterprise Mode` | 企业和强治理组织 | Keycloak、Temporal、PostgreSQL、LiteLLM Proxy、OTel、Grafana/Loki/Tempo/Langfuse、环境隔离和备份恢复 |

## Key Boundaries

- 控制面负责事实、权限、审批、审计，以及组织、账号、员工档案、考勤、协作内容、ProjectInstance、模板和报告卡等核心事实。
- GovernanceBrain 负责项目理解、任务适配建议、多人协调建议、模型能力治理建议和学习候选生成，写入结果必须通过控制面、策略、评测和审批。
- Agent Runtime 负责推理、工具选择、上下文拼装和状态化执行，不负责 HR 主数据真相。
- Temporal 负责跨服务工作流与人工闸门。
- Adaptive Runtime 只能决定降级、路由、并发、预算和人工接管，不能改变审批、安全、审计或数据分级规则。
- Federation Gateway / Connector 只处理授权协作、能力发现、模板共享和脱敏摘要交换，不允许远程实例直接绕过本地控制面。
- FederationProtocol 是跨实例唯一稳定通信面，二次开发不得修改标准 message envelope 语义，只能通过 CapabilityOffer、schema 和 namespaced extensions 扩展。
- PostgreSQL 在 Enterprise Mode 中承载事务数据、事件 outbox、知识索引元数据与首期 pgvector 检索能力；轻量档位可以使用 SQLite 或文件存储解释核心抽象。

## Non-Negotiable Constraints

- 控制面不直接承载 agent 推理图执行逻辑。
- Agent Runtime 不直接写入 HR 主数据真相。
- 长流程、审批、超时和补偿由 Temporal 管理；轻量档位若不启用 Temporal，必须保留等价的审计和人工闸门语义。
- 所有生产模型调用必须经过 LiteLLM Proxy 或受控 ModelRoute。
- 每个生产 `ModelRoute` 必须绑定可追溯的 `ModelCapabilityProfile`、评测结果、适用任务类型、数据分级和回退策略。
- 所有高风险动作必须经过 `ApprovalGate`。
- GovernanceBrain 不能替代人类 owner，不能用模型输出直接决定权限、审批责任、风险等级或生产发布。
- `dev`、`ci`、`staging`、`prod` 不得复用数据库、身份、模型 key、长期记忆或生产数据。
- 学习结果不能直接进入生产，必须先经过评测、审批、灰度和回滚设计。
- 跨实例通信默认拒绝，必须显式授权、审计并可撤销。
- 跨实例通信必须使用稳定 FederationMessage envelope、幂等 messageId、协议版本和 schema 校验。
- 敏感数据不得默认跨实例传输。
- 高风险跨实例动作必须回到本实例 `ApprovalGate`。
- 模型供应商通过 `ModelRoute` 抽象，核心契约不得绑定单一厂商。
- 自适应降级不能绕过安全治理。
- Enterprise Mode 保留现有强治理架构。

## Deep Links

- 详细架构蓝图：[docs/zh-CN/architecture-blueprint.md](docs/zh-CN/architecture-blueprint.md)
- 业务边界与角色模型：[docs/zh-CN/business-blueprint.md](docs/zh-CN/business-blueprint.md)
- 治理型 AI 中枢：[docs/zh-CN/governance-ai-brain.md](docs/zh-CN/governance-ai-brain.md)
- 自适应运行体系：[docs/zh-CN/adaptive-runtime.md](docs/zh-CN/adaptive-runtime.md)
- 社区网络与跨实例协作：[docs/zh-CN/community-network.md](docs/zh-CN/community-network.md)
- 跨实例通信协议：[docs/zh-CN/federation-protocol.md](docs/zh-CN/federation-protocol.md)
- 接口契约：[docs/zh-CN/api-contracts.md](docs/zh-CN/api-contracts.md)
- 安全治理：[docs/zh-CN/security-and-governance.md](docs/zh-CN/security-and-governance.md)
- 环境隔离：[docs/zh-CN/environment-isolation.md](docs/zh-CN/environment-isolation.md)
- 质量门禁：[docs/zh-CN/quality-gates.md](docs/zh-CN/quality-gates.md)
