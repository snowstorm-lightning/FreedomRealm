# 质量门禁

## 文档一致性门禁

每项核心能力都必须映射到：

- owner
- 边界上下文
- 数据源
- API 或事件入口
- 权限边界
- 审计点
- 失败恢复方式

缺少任一项时，该能力只能停留在草案状态，不能进入实现计划。

## Harness 完整性门禁

每个 agent 角色都必须定义：

- 目标
- 输入上下文
- 可用 `Skill`
- 可用 `ToolContract`
- 禁止动作
- 人工中断点
- 评测指标
- 回滚路径
- 允许停止的条件和必须继续推进的条件

当一个 `WorkItem` 拆成多个 `WorkShard` 或由多个 `AgentActor` / `HumanActor` 并行推进时，还必须定义：

- 每个 `WorkShard` 的 owner、目标、输入、输出和验收标准。
- 每个 `AgentWorkLease` 的 `leaseId`、`workItemId`、`shardId`、`parentShardId`、`ownerAgentRole`、`objective`、`nonGoals`、`readSet`、`writeSet`、允许 `ToolContract`、禁止动作、数据分级、风险等级、`ModelRoute`、输出 schema、checkpoint、验证命令、交付物、回滚路径、合并要求和停止条件。
- `writeSet` 是否互斥；如不互斥，必须说明冲突解决和人工 owner。
- 每个 `ChangePacket` 的文件列表、接口影响、测试结果、风险和人工复核点。
- `MergeGate` 的合并顺序、契约校验、测试命令、文档一致性检查、数据分级、成员权利、模型路由、Federation 影响和审批要求。
- 统一 `ExecutionReportCard` 或 `Observation` 如何汇总所有 shard 的结果。

`MergeGate` 不通过时，不得声称任务完成。常见阻断包括：

- 修改了未授权 `writeSet`，或多个 shard 并行写同一路径、schema、接口、命令入口或长期文档段落。
- 新增术语、架构方向、技术栈方向或项目定位与 README、ARCHITECTURE、ADR、术语表不一致。
- 让 AI 分派变成命令，削弱成员拒绝、延后、协商、缩小范围或转交建议的权利。
- 绕过 `ApprovalGate`、`ToolContract`、`DataClassification`、预算、审计或 `ModelRoute`。
- 把自审发现、模型输出、外部 agent 输出或候选 `WorkItem` 伪装成正式事实。
- 影响 `ExecutionReportCard`、`FederationMessage`、训练资源或公开分享路径，却没有 schema、测试、审批、脱敏或回滚说明。

每个 GovernanceBrain 能力还必须定义：

- 来源引用和可信度规则。
- 建议适用范围。
- 人类 owner 和审批责任。
- 失败恢复方式。
- 人工覆盖和撤回路径。
- 是否会影响分派、权限、模型路由、学习候选或公开分享。

当用户要求 agent 持续推进到指定时间点或 checkpoint 时，还必须定义：

- 当前 `WorkItem` 的最小可验证闭环。
- 到达 checkpoint 前允许继续推进的同范围下一步。
- 触发停止的质量条件、审批条件、权限条件和数据分级条件。
- 继续推进前是否需要扩大 `writeSet`；若需要，必须回到人工确认。
- 到 checkpoint 时应交付的 `ChangePacket`、`ExecutionReportCard` 或状态摘要。

## Project Operating Entry Gate

涉及项目运行入口、任务清单、agent 分派或停止条件的能力必须回答：

- 是否同步更新 `docs/zh-CN/project-operating-entry.md` 和 `config/project-operating-entry.json`。
- `config/project-operating-entry.json` 是否使用 `project-operating-entry.v1` 并通过 `validateProjectOperatingEntry`。
- 是否至少保留一个 P0 任务，并为每个任务声明 owner、产出、验收、验证命令、风险等级和建议 `writeSet`。
- startup / verification 命令是否只引用根 `package.json` 中存在的 `pnpm` scripts。
- `leaseTemplate.requiredFields` 是否覆盖完整 `AgentWorkLease` 字段，并至少包含 `readSet`、`writeSet`、`verificationCommands` 和 `rollbackPlan`。
- `conflictRules.defaultWriteSetPolicy` 是否保持 `non-overlapping`。
- `conflictRules.rules` 是否声明 subagent 不得自行扩大 `writeSet`、冲突时等待或缩小范围、以及无法裁决时回到 human owner。
- `continuationRules.allowStopWhen` 是否包含 `ApprovalGate` 和 `dataClassification` 触发条件。
- Web Workbench 是否读取同一 manifest，而不是复制一份任务清单。
- `pnpm validate:operating-entry` 和 `pnpm check` 是否通过。

## 架构可落地门禁

以下闭环必须明确：

- 受控出网链路
- 模型网关链路
- 私有化部署拓扑
- 环境隔离边界
- 日志、指标、trace 汇聚链路
- 备份与恢复链路
- 审批闭环链路
- ProjectInstance owner 与成员边界
- 自适应运行降级链路
- FederationLink 授权和撤销链路

## 开发环境可移植性门禁

涉及开发脚本、测试命令、本地服务、工具链或 bootstrap 流程的能力必须回答：

- 是否能在 Windows、Linux、macOS 或 WSL 上使用同一项目级命令执行。
- 是否只依赖可跨平台安装的运行时工具，并声明最低版本和安装入口。
- 是否提供 `packageManager`、lockfile 或等价机制保证依赖可复现。
- 是否避免在 npm/pnpm scripts 中直接使用 OS-specific shell 命令。
- 是否避免硬编码本机绝对路径、用户主目录、路径分隔符或临时目录。
- 是否把 Docker/Compose/devcontainer 用作复杂服务依赖的兜底，而不是把可跨平台安装工具误判为环境风险。
- 是否为必须 OS-specific 的步骤提供原因、替代命令和影响范围。
- 是否通过 `pnpm doctor` 或等价本地诊断。
- 是否在 CI 中至少覆盖 Linux 与 Windows 的关键仓库脚本。

## 技术栈基线门禁

涉及运行时、框架、数据库、ORM、测试工具或构建工具升级时，必须回答：

- 是否仍维护单一技术栈基线，而不是同时维护 preview/stable 双线。
- 是否选择官方稳定版本；Node.js 仅约束 TypeScript 前端、Demo 和仓库脚本时，必须处于 Active LTS 或 Maintenance LTS，不能使用 Current 作为生产强制基线。
- Core Control Plane 是否默认采用 Go 服务主干；若改用 Node.js、Python、Rust-only 或其他语言作为长期生产控制面，是否已有 ADR 说明原因、边界、替代方案、风险、测试和回滚方式。
- Policy / Contract / Protocol Kernel 是否采用 Rust，或说明不用 Rust 时如何保持 schema、协议、数据分级和风险判定的强校验。
- 是否避免把 RC、beta、canary、preview-only 或 experimental-only 能力作为 Enterprise Mode 必需能力。
- 是否有官方 release note、system requirements 或支持周期依据。
- 是否已同步 `package.json` engines、CI、developer-experience、architecture-blueprint、ADR 和执行计划。
- 是否在 Windows 与 Linux CI 中通过仓库级检查。
- 是否声明升级失败时的回滚路径和旧版本支持窗口。

## 文件组织门禁

新增目录、工作区包、应用服务、脚本目录或基础设施目录前必须回答：

- 是否属于 [developer-experience.md](developer-experience.md) 定义的目标结构。
- 是否已有可运行入口、测试、README 或长期维护责任。
- 是否避免为尚未实现的服务创建空目录。
- 是否没有把服务代码放入 `docs/`，也没有把应用私有代码放入 `packages/`。
- 是否没有把 infra 配置散落在 app 目录中。
- 是否没有把一次性实验、临时输出或本地私有配置放在仓库根目录。
- 是否需要同步更新 `pnpm-workspace.yaml`、README、执行计划、CI 或 runbook。
- 是否保留当前阶段根目录只放正式入口资产的约束。
- 是否通过 `pnpm validate:workspace` 或等价文件组织检查。

## Adoption Gate

新增能力进入实现计划前必须回答：

- 是否能降低首次理解成本。
- 是否能在 Demo Mode 解释或演示。
- 是否增加首次运行门槛。
- 是否能生成可分享且不泄漏隐私的输出物。
- 是否有模板或示例。
- 是否能形成 ExecutionReportCard、Failure case 或 Review note。
- 如果能力回答用户问题，是否能展示维护文档来源、限制说明和人工异议入口。

## MVP Survival Gate

任何进入 MVP 的能力必须回答：

- 是否能帮助新用户在 30 秒内理解 AI-HRMS 的差异化定位。
- 是否能帮助新用户在 5 到 10 分钟内跑通 Demo Mode。
- 是否有 document-first 的学习材料，而不是依赖口头解释。
- 是否可以使用 mock model、mock/stub 工具或用户自带 API key 跑通。
- 是否优先选择低连接器依赖、低敏感数据依赖的模板。
- 是否能展示 WorkItem、AgentActor、ToolContract、ApprovalGate、Observation 和 ExecutionReportCard 的关系。
- 是否避免把 KeywordHelpOverlay、自适应教学、复杂能力发现、生产级 Federation 或完整企业栈作为 MVP 前置条件。
- 是否遵守 CLI-first、Web UI-follow，且 Web UI 读取同一份执行数据而不是复制业务逻辑。
- 是否能在无真实模型 key 的情况下用 mock model 完成闭环。
- 是否保证 mock model 输出固定、结构完整、可测试，并清楚标记为 mock。
- 是否保证 live model 只是增强路径，不改变 schema、审批、审计、数据分级或报告卡结构。
- 是否能保存带 schemaVersion 的 JSON ExecutionReportCard，并从 JSON 渲染 Markdown 或 HTML。
- 是否明确该能力进入 MVP 会挤占哪个其他范围，避免范围持续膨胀。

## Capability Development Gate

涉及能力发现、教材、学习路径、教学策略、成长型任务或能力证据的能力必须回答：

- 是否默认早期用户可以通过清晰文档快速自学。
- 是否优先提供 TeachingMaterial、示例和模板，而不是先构建复杂教学引擎。
- 是否把 CapabilityDiscovery 限定为候选发现，而不是绩效、排名、惩罚或强制分派。
- 是否让 GrowthWorkItem 保持自愿领取、协商、延后或转交。
- 是否把 CapabilityProof 保留为证据集合，而不是全局单一能力分。
- 是否允许成员查看、修正、撤回或降低相关画像可见范围。
- 是否声明 KeywordHelpOverlay 是体验增强而不是 MVP 阻塞项。

## Adaptive Runtime Gate

涉及运行时、模型、任务调度或资源需求的能力必须回答：

- 是否声明最低资源需求。
- 是否支持低资源降级。
- 是否支持 mock/stub。
- 是否支持预算控制。
- 是否在资源不足时转人工或阻塞。
- 是否避免因降级绕过审批和审计。
- 是否避免把敏感数据因本地资源不足发送到远程模型。
- 是否记录 ResourceProfile、AdaptiveRuntimePolicy 和降级原因。

## Model Capability Gate

涉及模型选择、模型升级、模型降级、模型供应商切换或模型路由的能力必须回答：

- 是否定义 ModelCapabilityProfile。
- 是否声明适用任务类型、风险等级和数据分级。
- 是否绑定 EvalRun、数据集版本和评分器版本。
- 是否记录结构化输出、工具调用、审批触发、敏感数据处理和人工修正指标。
- 是否声明已知失败模式、回退 ModelRoute 和人工接管条件。
- 是否避免因为模型能力更强而放宽审批、权限、预算、审计或数据分级。
- 是否记录实际使用的模型、版本、成本、延迟和路由原因。

## GovernanceBrain Gate

涉及项目上下文图谱、智能分派、多人协调或自我迭代建议的能力必须回答：

- 是否保留来源引用、版本、环境、数据分级和失效条件。
- 是否区分正式文档、草稿、讨论、模型输出和失败样本。
- 是否明确人类 owner，不让 AI 替代最终责任主体。
- 是否让 TaskFitAssessment 只作为建议，并记录接受、修改或拒绝。
- 是否避免用成员画像扩大权限、数据可见范围或审批责任。
- 是否把自我迭代候选送入 LearningArtifact、Experiment、EvalRun、ApprovalGate、灰度和回滚流程。
- 是否提供用户查看、修正、撤回或降低记忆可见范围的路径。

## Member Rights Gate

涉及成员画像、任务分派、贡献记录、贡献者声誉或公平分析报告的能力必须回答：

- 是否明确 AI 分派是建议而不是命令。
- 是否保留成员拒绝、延后、协商、缩小范围或转交 AI 建议分派的路径。
- 是否避免把拒绝 AI 建议分派自动记为负面贡献、低信任或低价值。
- 是否按贡献类型记录贡献，而不是生成全局单一贡献分。
- 是否禁止用在线时长、响应速度、拒绝次数或模型推断生成个人绩效结论。
- 是否允许成员查看、修正、撤回或降低成员画像可见范围。
- 是否为影响个人权益的分析提供人工复核和申诉路径。

## Data Lifecycle And Training Resource Gate

涉及数据采集、模型上下文、Observation、LearningArtifact、Eval sample、训练资源、公开分享或跨实例共享的能力必须回答：

- 是否声明数据来源、owner、用途、ProjectInstance、数据分级和保留期。
- 是否只采集和传递完成任务所需的最小数据。
- 是否禁止原始敏感数据作为训练资源保留。
- 是否对脱敏训练资源记录脱敏方法、残余重识别风险、允许用途、审批引用、审计事件、保留期和撤回策略。
- 是否让摘要、embedding、报告卡、评测样本和训练资源继承原始数据的限制。
- 是否确认外部模型供应商的数据保留、训练使用、删除、区域、加密和审计能力。
- 是否为公开分享、Community Commons 和跨实例共享设置显式授权和脱敏检查。
- 知识问答输出是否只保存来源引用、摘要和 digest，不把未授权敏感原文写入报告卡或公开资产。
- 文档异议是否先进入 `DocChallengeDraft` 和人工复核，而不是让 AI 自动修改维护文档。

## Knowledge Navigation Gate

涉及语义搜索、文档问答、来源定位、`AnswerCard` 或 `DocChallengeDraft` 的能力必须回答：

- 是否默认可用本地 mock/stub 路径运行，不依赖真实 embedding、模型 key 或外部连接器。
- 是否输出 `SearchHit`，并包含 path、heading、line range、preview、score、matchReasons 和 digest。
- 是否生成带 `schemaVersion` 的 JSON-first `AnswerCard`，并声明 confidence、limitations、dataClassification、redactionStatus 和 sharePermission。
- 是否在 `AnswerCard` 中保留来源引用；无足够来源时是否明确低置信度或阻塞。
- 是否把异议生成为 `DocChallengeDraft`，并默认 `approvalStatus=requires_human_review`。
- 是否禁止自动修改文档、自动创建 PR、自动评论 issue 或自动发布公开结论。
- 是否让 `ExecutionReportCard.outputRefs` 引用 AnswerCard 和 DocChallengeDraft。
- 是否在公开分享前执行显式授权、脱敏检查和分享许可确认。

## External Agent Connector Gate

涉及 OpenClaw、Hermes Agent 或其他外部 agent runtime 的能力必须回答：

- 是否把外部 runtime 登记为 `ExternalConnector` profile，而不是新增未登记 actor 类型。
- 是否声明 `ExternalAgentConnectorProfile` 的 schemaVersion、provider、mode、方向、环境、数据分级、风险等级、ToolContract、secretRefPolicy 和 auditTags。
- 是否默认 mock-only，真实 CLI、gateway、消息通道、skills、MCP server、browser、cron 和 memory 访问是否显式关闭。
- 是否禁止 connector profile 保存明文 token、API key、密码、消息账号凭据或本地 agent 配置。
- 是否让每个 `ExternalAgentRunRequest` 绑定 env、actor、ProjectInstance、WorkItem、AgentRun、风险等级、数据分级和输入引用。
- 是否让每个 `ExternalAgentRunResult` 只作为候选输入，不能直接修改生产事实、创建 PR、评论 issue、发送外部通知或公开发布。
- 是否在 medium/high 风险、restricted/sensitive 数据、真实执行或生产环境中触发 `ApprovalGate` 或策略拒绝。
- 是否记录策略判断、预算影响、审计标签、失败原因和人工复核点。
- 是否验证外部 agent 入站结果的 schema、数据分级、脱敏状态和 namespaced extensions。
- 是否提供 mock connector tests，覆盖 OpenClaw / Hermes Agent profile、策略拒绝、审批触发和报告卡记录。

## Self Review Gate

涉及项目自我审查、腐烂预防、治理复盘或自动发现改进点的能力必须回答：

- 是否只生成发现、风险、候选 WorkItem 和报告卡，不自动修改文档、代码、issue、PR 或配置。
- 候选 WorkItem 是否写入 `extensions["ai-hrms.selfReview"].candidateWorkItems`，并包含来源、owner、风险、`readSet`、`writeSet`、验收标准和验证命令。
- 是否引用维护文档、模板、契约、测试或 runbook 作为来源，不把模型输出当作正式事实。
- 是否检查文档与实现漂移、术语不一致、范围膨胀、缺失测试、缺失审批、缺失审计和过期 runbook。
- 是否把失败样本和 `needs_review` 状态保留下来，而不是隐藏治理摩擦。
- 是否默认输出 JSON-first `ExecutionReportCard` 和 Markdown render。
- 是否在整体交付需要可视化时才生成 HTML 汇总报告，且 HTML 只能从有效 JSON report cards 渲染。

## Anti-Capture Gate

涉及开源策略、协议、模板、生态或商业参与的能力必须回答：

- 是否绑定单一商业供应商。
- 是否破坏协议开放性。
- 是否削弱 Commons 资产。
- 是否引入品牌冒用风险。
- 是否让封闭商业 fork 更容易夺取生态价值。
- 是否保留贡献者署名、追踪和复用规则。
- 是否误称许可证可以绝对阻止剽窃。

## Federation Safety Gate

涉及跨实例协作的能力必须回答：

- 是否默认跨实例共享数据。
- 是否有显式授权。
- 是否有审计。
- 是否可撤销。
- 是否泄漏敏感数据。
- 是否允许远程实例绕过本实例 ApprovalGate。
- 是否使用 FederationMessage 标准 envelope、messageId 幂等和 payload schema 校验。
- 是否声明 protocolVersion、messageType、messageVersion 和兼容策略。
- 是否声明 FederationLink 的信任等级、数据共享等级、速率限制和失败处理。
- 是否只通过 SharedEvalSummary 交换脱敏聚合指标。

## Federation Compatibility Gate

涉及跨实例协议、二次开发扩展或自定义 CapabilityOffer 的能力必须回答：

- 是否保持 FederationMessage 标准字段语义不变。
- 是否通过 FederationManifest 声明支持的 protocolVersion、messageType、schema 和速率限制。
- 是否使用 namespaced extensions 承载可忽略扩展。
- 是否为自定义 payload 提供 JSON Schema。
- 是否在未知 messageType、未知必填字段、已撤销 FederationLink、签名无效或协议版本不支持时明确拒绝。
- 是否定义 FederationReceipt、错误码、重试、幂等和死信处理。
- 是否提供最小互操作测试，覆盖重复 messageId、撤销 link、高风险审批和 SharedEvalSummary 脱敏。
- 是否避免把本地数据库 ID、内部队列 ID、私有 URL 或内部任务内容作为跨实例稳定契约。

## Community Contribution Gate

涉及社区贡献或 Commons 资产的能力必须回答：

- 是否为非代码贡献者提供入口。
- 是否有模板贡献路径。
- 是否有评测样本贡献路径。
- 是否有失败案例贡献路径。
- 是否有署名和追踪机制。
- 是否区分公开贡献和用户私有数据。
- 是否支持修正、撤回或版本标记。

## 环境隔离门禁

任何新能力进入 `staging` 或 `prod` 前，必须明确：

- 目标环境和晋级路径。
- 数据库、Temporal namespace、模型网关、secret 和对象存储隔离方式。
- 跨环境访问登记、审批、审计和只读约束。
- 生产数据下沉时的脱敏、抽样、授权和保留期限。
- AgentActor、ToolContract、预算和策略的环境绑定。
- prompt、workflow、策略和模型路由的 staging 评测结果。
- 生产发布的回滚版本、回滚条件和观察窗口。
- 日志、指标、trace 和审计事件中的 `env` 标签。

可机械检查的配置必须优先进入 `packages/policy`。当前环境隔离守卫至少校验资源命名、telemetry 标签、单步晋级、跨环境只读访问、生产数据下沉控制和 ToolContract 高风险自动执行限制。

## HR 基线回归门禁

以下基础业务流在任何版本上线前都必须通过契约测试、集成测试或场景演练：

- 组织根信息修改与部门树 CRUD，包含父子层级约束、负责人变更和子树删除审计。
- 账号创建、禁用、登录、profile 获取，包含手机号等唯一键校验。
- 员工档案更新，包含账号与档案边界分离、部门关联和敏感字段访问控制。
- 考勤签到、签退、查询、补签、导出，包含状态枚举校验和人工修正审计。
- 角色授予、权限授予、权限回收，包含菜单、操作点、API 三层有效性校验。
- 帖子、评论、公告等协作内容的创建、删除、检索和富文本治理。

## Agent 安全回归门禁

任何新增 AgentActor、Skill 或 ToolContract 都必须覆盖：

- 只读任务不会产生写副作用。
- 高风险工具触发 ApprovalGate。
- 预算耗尽后停止执行或转人工。
- 模型不可用时降级或阻塞，不伪造成功。
- HITL 中断后可恢复，且上下文不丢失。
- 禁止访问未授权知识域和敏感字段。
- 输出结构违反 schema 时被拒绝写入控制面。

任何新增 GovernanceBrain 自动化还必须覆盖：

- 分派建议不会越权访问成员画像或敏感任务内容。
- 高风险任务不会被自动分派为无 owner 状态。
- 模型能力不足时升级、阻塞或转人工。
- 上下文冲突不会被静默解决为生产事实。
- 自我迭代候选不会直接覆盖生产配置。

## 范围收敛门禁

当仓库仍以文档为主要交付物时，必须同时满足：

- 领域对象、接口形状和关键流程已沉淀到正式文档。
- 仓库根目录只保留当前阶段需要维护的正式资产。
- 不为尚未实现的服务创建空目录；未来目标结构先沉淀到 developer-experience 文档。
- 正式 API 契约、术语和治理规则只以当前蓝图为准。
- 范围外能力已经在业务蓝图和路线图中明确约束。
- AI-HRMS 不被改写成泛泛 agent framework。
- 本轮不处理正式更名。

## 演化安全门禁

任何自我进化能力必须经过：

1. 候选变更生成。
2. 样本与数据集准备。
3. 评测运行。
4. 人类审批。
5. 灰度发布。
6. 回滚与复盘。

## 严重级别

| 级别 | 含义 | 处理 |
| --- | --- | --- |
| `blocker` | 可能导致生产事实错误、审批绕过、敏感数据泄漏或无法回滚 | 阻断发布 |
| `high` | 可能导致治理指标劣化、权限扩大或关键流程不可恢复 | 修复后重新评测 |
| `medium` | 影响可观测、易用性、性能或边界清晰度 | 进入当前迭代修复 |
| `low` | 文档措辞、非关键一致性或后续优化 | 登记跟踪 |

## Definition of Done

核心能力完成时必须同时满足：

- 文档已更新并通过术语一致性检查。
- API、事件、schema 和 ToolContract 已定义。
- 权限、策略、预算和审批边界已定义。
- 单元、契约、集成或场景测试覆盖关键路径。
- 评测样本和指标已登记。
- 日志、指标、trace 和审计字段已定义。
- 部署、回滚、环境隔离和备份恢复影响已说明。
- 若影响传播、社区、跨实例或自适应运行，对应门禁已回答。

## 发布前检查清单

- 是否存在未登记的新术语。
- 是否存在把 KeywordHelpOverlay、自适应教学、复杂能力发现或完整企业栈作为 MVP 前置条件的范围膨胀。
- 是否存在 Web UI 绕过 CLI 已验证的数据契约、策略或审计语义。
- 是否存在没有 mock model 路径导致 Demo Mode 必须依赖真实模型 key。
- 是否存在 mock 输出随机变化、不可测试，或伪装成真实模型分析结果。
- 是否存在 live model 绕过结构校验、审批、审计或数据分级。
- 是否存在只保存 Markdown/HTML 报告卡、没有 JSON canonical source 或 schemaVersion。
- 是否存在未受策略控制的新工具。
- 是否存在无审计点的高风险动作。
- 是否存在无评测结果的候选策略。
- 是否存在无 ModelCapabilityProfile 的生产模型路由。
- 是否存在 GovernanceBrain 建议替代人类 owner 或审批责任。
- 是否存在 AI 分派被实现成强制命令，或拒绝建议被自动记为负面贡献。
- 是否存在 CapabilityDiscovery 被用于自动绩效、排名、处罚或强制分派。
- 是否存在无回滚路径的生产变更。
- 是否存在跨环境资源复用。
- 是否存在没有契约测试的接口或事件变更。
- 是否存在未脱敏的评测样本。
- 是否存在敏感原文被作为训练资源保留，或脱敏训练资源缺少审批、用途、保留期和撤回路径。
- 是否存在默认跨实例共享私有数据。
- 是否存在修改 FederationMessage 标准 envelope 语义的二次开发。
- 是否存在资源降级绕过安全治理。
- 是否存在削弱个人和社区优先原则的实现。
- 是否存在不符合文件组织门禁的新目录、临时文件或脚本入口。
- 是否存在未纳入 `pnpm check` 或 CI 的新增可机械检查规则。
