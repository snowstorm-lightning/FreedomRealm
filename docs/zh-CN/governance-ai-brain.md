# 治理型 AI 中枢

## 定位

`GovernanceBrain` 是每个 `ProjectInstance` 内长期陪伴项目演化的治理型 AI 中枢。它帮助成员理解项目、拆解工作、协调协作、沉淀学习和提出改进候选，但不是超级管理员，也不拥有绕过 `ApprovalGate`、`PolicyRule`、预算、审计、数据分级或回滚流程的权限。

它的设计目标是降低大型项目的理解成本，让个人、社区和组织都能在明确责任链下使用 AI 协调长期演化。

## 核心职责

### 1. 项目上下文图谱

`GovernanceBrain` 维护面向推理和协作的项目上下文图谱，至少连接：

- README、架构、业务蓝图、接口契约、ADR、执行计划、评测基线和术语表。
- `WorkItem`、`AgentRun`、`ApprovalGate`、`Observation`、`LearningArtifact`、`Experiment`、`EvalRun` 和 `ExecutionReportCard`。
- `InstanceMember`、`AgentActor`、`ToolContract`、`PolicyRule`、`ModelRoute` 和 `ModelCapabilityProfile`。
- 失败案例、人工修正、Review note、回滚记录和被拒绝的候选方案。

图谱中的每个结论都必须保留来源引用、版本、环境、数据分级、可信度和失效条件。讨论记录、草稿和模型输出不能默认等同于正式文档。

### 2. 当前基线解释

`GovernanceBrain` 必须能回答：

- 当前项目处于哪个阶段。
- 哪些文档是 system of record。
- 哪些设计已经被 ADR 或路线图确认。
- 哪些内容只是候选、草案或待评测结论。
- 某个建议会影响哪些接口、事件、角色、审批、评测和回滚路径。

当文档存在冲突时，它只能生成冲突报告或 Review note，不能自行选择一个版本写入生产规则。

### 3. 智能分派与协作协调

`GovernanceBrain` 可以为 `WorkItem` 生成 `TaskFitAssessment`，建议由哪个 `HumanActor`、`CommunityActor`、`AgentActor` 或跨实例能力协作处理。

分派建议至少考虑：

- 成员技能、兴趣、学习目标和偏好任务类型。
- 当前负载、可用时间、时区、上下文切换成本和 SLA。
- 历史交付质量、返工率、review 质量和协作响应。
- 数据可见范围、权限、审批责任和可承担风险等级。
- 是否适合由 AI 先生成草稿、由人类 review，或必须由人类直接处理。
- 公平性与成长性，避免长期把重复、低价值或高压力任务固定分配给少数成员。

AI 可以作为 contributor 执行或协助，但高风险任务仍必须有明确的人类 owner。社区和企业场景中，AI 分派不能替代责任归属。

AI 分派默认是建议，不是命令。成员有权拒绝、延后、协商、缩小范围或转交 `GovernanceBrain` 的建议分派；拒绝建议分派本身不得被自动记为负面贡献、低信任或低价值。正式责任只能来自成员主动领取、人工确认、既有岗位职责、维护者承诺或已确认的 `WorkItem`。

分派建议必须说明：

- 为什么建议该成员或协作能力。
- 是否需要先征询成员意愿。
- 当前负载和数据可见范围是否支持该建议。
- 成员拒绝后的替代方案。
- 对个人权益和集体目标的影响。

`GovernanceBrain` 不得基于成员画像自动生成个人绩效结论、惩罚建议、机会排除建议或忠诚度、态度和动机推断。

### 4. 多人开发协调

`GovernanceBrain` 可以：

- 将目标拆成可审查的 `WorkItem`。
- 标注依赖、冲突、并行边界和 review 链路。
- 发现长期阻塞、重复工作、接口漂移和文档不一致。
- 生成同步摘要、决策记录和交接说明。
- 在风险升高、权限不足、预算耗尽或模型信心不足时转人工。

它不能在没有权限和审批的情况下重新分配高风险责任、扩大成员可见范围或合并高风险变更。

### 5. 受控自我迭代

`GovernanceBrain` 可以从 `Observation`、人工修改、失败样本、审批结果和 `SharedEvalSummary` 中生成改进候选，包括：

- prompt 候选。
- workflow 分支候选。
- 工具选择策略候选。
- 文档一致性修正候选。
- 模板、评测样本、失败分类和 Review note。
- `ModelRoute` 和模型能力匹配建议。

所有候选必须进入 `LearningArtifact`、`Experiment`、`EvalRun`、人工审批、灰度和回滚流程。它不能直接修改生产代码、生产策略、预算、权限、模型路由或高风险工具配置。

## 模型能力治理

不同模型在推理、编码、长上下文、结构化输出、工具调用、中文理解、稳定性、速度、成本和安全表现上差异明显。AI-HRMS 不应把模型简单分成“好模型”和“差模型”，而应把模型能力登记为可评测的 `ModelCapabilityProfile`。

### ModelCapabilityProfile 最低字段

- `modelRouteId`
- `provider`
- `modelName`
- `deploymentType`：`local`、`remote`、`mock`
- `capabilityScores`：推理、代码、长上下文、结构化输出、工具调用、检索配合、多语言、安全拒答和一致性
- `contextWindow`
- `structuredOutputSupport`
- `toolCallingSupport`
- `dataClassificationAllowed`
- `riskLevelAllowed`
- `latencyBudget`
- `costBudget`
- `evalRunRefs`
- `knownFailureModes`
- `fallbackModelRouteIds`
- `owner`
- `version`

### 路由原则

- 架构推理、跨文档一致性、高风险 review、策略候选和模型路由变更应优先使用强推理模型，并要求引用依据和差异说明。
- 分类、抽取、格式化、低风险摘要、模板填充和重复性草稿可使用低成本模型，但输出必须受 schema、评测和抽检约束。
- 代码修改、迁移、测试生成和 CI 修复必须按代码评测样本、仓库规则和可验证结果选择模型。
- 高敏数据优先本地模型、摘要化、脱敏或人工处理；本地模型不可用不等于可以自动把敏感原文发给远程模型。
- 模型信心不足、路由无合格候选、评测低于阈值或任务风险高于模型授权范围时，必须阻塞、升级到更强模型或转人工。
- 同一任务可以使用多模型交叉检查，但交叉检查结果仍只是建议，不能绕过审批。

### 评测要求

每个进入生产的 `ModelRoute` 必须绑定对应 `ModelCapabilityProfile` 和 `EvalRun`。评测必须按任务类型、风险等级、数据分级和运行档位拆分，至少覆盖：

- 任务完成率。
- 结构化输出合规率。
- 工具调用合规率。
- 审批触发准确率。
- 敏感数据处理正确率。
- 幻觉率或无依据断言率。
- 人工修正率。
- 成本与延迟。
- 回滚和失败样本。

模型升级、模型降级、供应商切换和本地/远程路由切换都属于可审计变更。影响生产的变更必须经过评测、审批、灰度和回滚。

## 记忆与知识卫生

`GovernanceBrain` 的长期记忆必须遵守：

- 记忆必须引用来源，不能保存无法追溯的“经验结论”作为事实。
- 草稿、讨论、模型输出、失败样本和正式文档必须分级存储。
- 过期知识必须有失效条件或复核周期。
- 用户可以查看、修正、撤回或降低自己贡献的记忆可见范围。
- 公开或跨实例共享只能使用 `SharedTemplate` 或 `SharedEvalSummary`，不得共享私有上下文、敏感字段或内部任务内容。

成员画像、贡献记录和公平分析报告的治理边界见 [member-rights-and-contribution.md](member-rights-and-contribution.md)。涉及敏感数据脱敏后进入训练、评测或模型能力改进资源时，必须遵守 [data-lifecycle-and-training-resources.md](data-lifecycle-and-training-resources.md)。

## 最小实现路径

### Phase 1 最小能力

- 文档和 ADR 的可追溯检索。
- `InstanceMember` 的能力、兴趣、可用性、负载、权限和风险责任字段。
- `TaskFitAssessment` 的只读分派建议。
- `ModelCapabilityProfile` 和模型路由评测引用。
- 治理型 AI 中枢的审计事件和报告摘要。

### Phase 2 学习能力

- 从 `Observation`、失败样本和人工修正生成候选 `LearningArtifact`。
- 对任务分派、模型路由和 prompt/workflow 候选进行离线评测。
- 生成模型能力差异报告和任务适配报告。

### Phase 3 协调能力

- 多人、多 AgentActor 和跨实例协作的依赖协调。
- 受控自动分派低风险任务。
- 基于评测和审批逐步扩大自动执行范围。

## 禁止事项

`GovernanceBrain` 不得：

- 充当绕过本地审批、审计、预算和数据分级的超级 Agent。
- 自动批准高风险动作。
- 将学习结果直接覆盖生产配置。
- 将敏感数据因为模型能力不足或本地资源不足而外发。
- 默认跨实例共享私有数据或原始上下文。
- 用模型输出直接决定成员权限、审批责任或风险等级。
- 隐藏模型、成本、依据、失败和人工修正记录。
