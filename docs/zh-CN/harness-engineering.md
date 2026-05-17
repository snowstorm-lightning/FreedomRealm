# Harness Engineering 范式

## 定义

本项目中的 harness engineering 指：人类不直接把注意力花在堆砌实现细节上，而是优先设计环境、结构、约束、反馈回路和知识布局，使智能体能够持续产出可靠工作。

## 在本仓库中的落地方式

### 1. AGENTS.md 只是目录

- `AGENTS.md` 只放规则入口和导航
- 详细知识分散到专题文档中
- 避免单一超长 instruction 文件腐化

### 2. 仓库即知识底座

- 愿景、架构、策略、ADR、执行计划、评测基线都版本化入仓
- 不依赖外部知识库作为唯一真相来源

### 3. 计划是一等资产

- 复杂工作进入 `execution-plans/active/`
- 完结后归档并保留决策记录
- 技术债与已知约束需要显式登记

### 4. 评测驱动演化

- 学习结果不能直接上线
- 必须先形成样本、指标、评测和对照结果

### 5. 约束编码化

- 能机械检查的规则不要只写成口头约定
- 命名、边界、风险级别、审批触发条件、预算策略都应可检查

### 6. 反馈闭环可复用

- 每个重要产出都应能回到样本、评测、审批或复盘。
- 失败案例和人工修正不是噪音，必须进入后续评测覆盖。
- 任何新约束如果能由 lint、schema、contract test 或 eval 检查，就不应只停留在口头说明。

### 7. 治理中枢受控

- GovernanceBrain 可以帮助理解项目、建议分派、协调多人协作和生成候选，但不能成为超级管理员。
- TaskFitAssessment、ModelCapabilityProfile 和学习候选必须能回到来源、评测、审批、审计和回滚。
- 模型能力差异必须通过评测和路由策略处理，不能用模型名、供应商或价格替代质量判断。

### 8. 跨平台命令优先

- 仓库脚本应优先写成 OS-neutral 命令，避免把开发者绑定到 Windows、Linux、macOS 或某个 shell。
- 可跨平台安装的工具可以作为前置条件，关键是声明版本、锁定依赖和提供安装路径。
- Docker/devcontainer 用于屏蔽复杂服务依赖和系统库差异，不应替代所有简单 CLI 工具。
- 当脚本必须使用 OS-specific 能力时，必须给出替代路径或明确适用范围。

### 9. 大型项目按 WorkShard 协作

当项目超过单个 agent 的稳定上下文、注意力和验证能力时，AI-HRMS 应把项目拆成多个 `WorkShard`，由不同 `AgentActor` 或 `HumanActor` 在明确边界内处理。这里借鉴操作系统思想：`WorkItem` 类似进程，`ToolContract` 类似受控系统调用，`ProjectInstance` 类似命名空间，`Adaptive Task Scheduler` 类似调度器，`ApprovalGate` 类似特权边界，`Observation` 类似运行日志和审计 journal。

多 agent 协作不应靠“大家都看完整仓库”来维持秩序，而应靠以下机制：

- `WorkShard`：把一个大 `WorkItem` 切成可独立理解、实现和验证的子工作面。
- `AgentWorkLease`：每个执行者领取工作前声明身份、目标、`readSet`、`writeSet`、允许工具、禁止动作、数据分级、风险等级、`ModelRoute`、checkpoint、交付物、回滚方式和合并要求。
- `writeSet`：声明可写文件、目录、接口或文档范围。多个并行 shard 的 `writeSet` 默认不得重叠。
- `ChangePacket`：每个 shard 交付的结构化结果，至少包含变更摘要、文件列表、接口影响、测试结果、风险、人工复核点和回滚说明。
- `MergeGate`：合并前的门禁，负责检查 `writeSet` 冲突、契约变更、测试结果、文档一致性和人工审批要求。

同一 ProjectInstance 内的多 agent 协作必须保留统一 owner。子 agent 可以并行探索、实现或评审，但不能各自把结果直接并入主线事实。最终合并必须通过 `MergeGate`，并生成总 `ExecutionReportCard` 或汇总型 `Observation`。

`AgentWorkLease` 的推荐字段与项目运行入口 manifest 保持一致：

```text
leaseId
workItemId
shardId
parentShardId
ownerAgentRole
objective
nonGoals
readSet
writeSet
allowedToolContracts
forbiddenActions
dataClassification
riskLevel
modelRoute
expectedOutputSchema
checkpointPolicy
validationCommands
deliverables
rollbackPlan
mergeGateRequirements
stopConditions
```

其中 `writeSet`、`dataClassification`、`riskLevel`、`modelRoute` 和 `stopConditions` 是防止越权扩张的关键字段。没有 lease 的 subagent 只能做只读探索；需要写入时必须先由主 agent 或 human owner 授权。子 agent 不能自行接触 secret、生产数据、真实外部连接器，也不能把候选输出直接变成正式 `WorkItem`、公开资产或训练资源。

`WorkShard` 生命周期：

1. 由主 agent 或 human owner 明确 `WorkItem`、目标、验收和停止条件。
2. 拆分 shard，并为每个 shard 生成 `AgentWorkLease`。
3. shard 在 lease 内执行，输出 `ShardResult`，包含文件读取、文件修改、决策、风险、验证结果和未解决问题。
4. 主 agent 汇总为 `ChangePacket`。
5. `MergeGate` 检查 `writeSet`、契约、测试、文档、数据分级、审批和成员权利。
6. 合并后输出总 `ChangePacket`、必要的 `ExecutionReportCard` 或候选后续 `WorkItem`。

防冲突规则：

- 并行 shard 的 `writeSet` 默认必须互斥。
- 同一路径不得同时执行 update、delete 或重写；同一 schema、接口、命令或长期文档段落不得由多个 shard 并行定义。
- 必须重叠时，后启动的 shard 等待、缩小范围或转为只读；如果仍需并行，必须指定统一 owner 并在 `MergeGate` 人工复核。
- 影响 `ApprovalGate`、`ToolContract`、`DataClassification`、`ExecutionReportCard`、`ModelRoute` 或 `FederationMessage` 的变更不能被低风险 shard 顺带合入。
- 连续两个 shard 输出互相矛盾且无法裁决时停止推进，生成待 human owner 决策的问题清单。

推荐拆分边界：

- 按模块拆分：`apps/web`、`apps/control-plane`、`apps/agent-runtime`、`packages/contracts`、`packages/policy`。
- 按领域拆分：模板、报告卡、审批、成员权利、Federation、现实任务采集。
- 按工作类型拆分：探索、实现、测试、文档、评审、迁移。
- 按风险拆分：低风险自动执行，高风险只生成候选并进入 `ApprovalGate`。

不推荐拆分的情况：

- 需求仍不清楚。
- 多个 agent 必须频繁修改同一组文件。
- 没有稳定 schema、测试或合并门禁。
- 变更会影响审批、安全、数据分级、预算或生产策略，但没有人类 owner。

### 10. 上下文容量提醒

当满足以下任一条件时，系统或主 agent 应提醒用户考虑拆成多个 `WorkShard`：

- 影响 3 个以上边界上下文。
- 预计需要读取或修改的文件超过单次上下文可稳定处理范围。
- 任务预计超过 30 到 60 分钟，且需要中途 checkpoint。
- 同时涉及产品策略、接口契约、实现、测试和文档。
- agent 已开始反复压缩上下文、遗漏约束、混淆术语或无法说明完整影响面。
- 一次变更会影响多个 `ToolContract`、`ApprovalGate`、`ExecutionReportCard` 或数据分级规则。

提醒只意味着建议拆分，不意味着强制分派。`HumanActor` 仍可选择继续单 agent、小范围收敛或先补执行计划。

## 推荐仓库结构

```text
README.md
AGENTS.md
ARCHITECTURE.md
docs/
  zh-CN/
    adr/
    evals/
    execution-plans/
packages/
config/
```

当前阶段只保留已使用的正式目录。未来服务实现阶段的完整目标结构以 [developer-experience.md](developer-experience.md) 为准，不为尚未实现的服务创建空目录。

## 对未来实现的要求

- 每个 agent 角色必须有目标、输入上下文、允许工具、禁止动作和中断点
- 每个 GovernanceBrain 能力必须有来源引用、建议边界、人工 owner、审计事件和失败恢复
- 每个高风险流程必须有审批闸门和回滚设计
- 每个重要输出必须定义评测标准
- 每个新增脚本或本地运行入口必须通过开发环境可移植性门禁
- 每个并行 `WorkShard` 必须声明完整 `AgentWorkLease`、`writeSet`、交付物和合并门禁
- 多 agent 交付必须通过 `MergeGate` 验证冲突、契约、测试、文档、数据分级、成员权利和人工复核点

## 文档完备性要求

新增或修改核心文档时，至少检查：

- 是否说明目标、非目标和适用范围。
- 是否绑定已有术语，避免引入未登记的新词。
- 是否说明 owner、输入、输出、状态、权限、审计和失败恢复。
- 是否说明环境隔离、数据分级和模型网关边界。
- 是否符合 [developer-experience.md](developer-experience.md) 的跨平台命令和文件组织约束。
- 是否存在与 ADR、API 契约、质量门禁或路线图冲突。
- 是否给出实现阶段可验证的验收标准。

## Agent 工作方式

- 先读导航文档，再读专题文档，不把单个文件当全局事实。
- 每次打开仓库后先进入 [project-operating-entry.md](project-operating-entry.md)，确认当前推荐任务清单、分派边界、`writeSet` 和停止条件。
- 修改架构、治理、评测、接口或发布规则时，同步更新相关专题文档。
- 复杂变更先登记执行计划；完成后归档或更新状态。
- 对不确定的技术基线，优先查官方资料并回写引用或 ADR。
- 对高风险自治能力，先补 `ApprovalGate`、评测、审计和回滚设计，再讨论自动执行。
- 当用户要求 agent 持续推进到某个时间点时，应按 checkpoint 持续完成同范围、可验证的下一步；不得为了“不停止”而扩大 `writeSet`、降低测试要求、绕过 `ApprovalGate` 或访问未授权数据。
