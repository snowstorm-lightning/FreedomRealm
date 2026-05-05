# 人机协作流程

## 设计目标

系统中的每一项工作都必须能回答四个问题：

1. 谁提出目标？
2. 谁实际执行？
3. 谁承担审批责任？
4. 从执行结果中学到了什么？

## WorkItem 生命周期

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Triaged
    Triaged --> AssignedToHuman
    Triaged --> AssignedToAgent
    AssignedToHuman --> InProgress
    AssignedToAgent --> InProgress
    InProgress --> AwaitingApproval
    InProgress --> Blocked
    Blocked --> InProgress
    AwaitingApproval --> Approved
    AwaitingApproval --> Rejected
    Rejected --> InProgress
    Approved --> Completed
    Completed --> Learned
    Learned --> [*]
```

## 状态迁移规则

| 迁移 | 触发者 | 必要检查 |
| --- | --- | --- |
| `Draft -> Triaged` | HumanActor 或分流策略 | 目标、请求方、风险等级、业务上下文完整 |
| `Triaged -> AssignedToHuman` | 任务路由 | 目标人类具备权限和可用性 |
| `Triaged -> AssignedToAgent` | 任务路由 | AgentActor 具备能力、预算、工具授权和模型路由 |
| `AssignedToAgent -> InProgress` | Temporal | 已创建 AgentRun，绑定策略版本和 checkpoint |
| `InProgress -> AwaitingApproval` | PolicyRule | 命中高风险动作或敏感数据边界 |
| `AwaitingApproval -> Approved` | ApprovalGate | 审批人具备权限，记录审批理由和输入输出引用 |
| `AwaitingApproval -> Rejected` | ApprovalGate | 记录拒绝原因，回到执行态或关闭 |
| `InProgress -> Blocked` | 执行者或系统 | 记录阻塞原因、owner 和下一次检查时间 |
| `Completed -> Learned` | 学习管道 | Observation 已采集，敏感数据已处理 |

任何状态迁移都必须追加审计事件，且不能删除历史状态。

## 标准协作流

```mermaid
sequenceDiagram
    autonumber
    participant H as HumanActor
    participant UI as Ops Console
    participant API as Control Plane
    participant WF as Temporal
    participant AG as Agent Runtime
    participant AP as ApprovalGate

    H->>UI: 创建或分派 WorkItem
    UI->>API: 提交任务与上下文
    API->>WF: 启动工作流
    WF->>AG: 触发 Agent Run
    AG->>API: 拉取策略、知识、工具授权
    AG-->>WF: 返回候选结果或高风险动作请求
    WF->>AP: 进入审批闸门
    AP->>H: 审批、修改或驳回
    H-->>AP: 审批决定
    AP-->>WF: 返回决定
    WF->>AG: 继续或回退执行
    AG-->>API: 写回结果与 Observation
    API-->>UI: 更新任务状态、审计与学习条目
```

## 典型场景

### 场景 1：智能体辅助招聘筛选

- 人类定义岗位要求和筛选阈值
- AgentActor 对候选人包进行摘要、排序、风险标注
- 高风险判断或拒绝建议必须通过 `ApprovalGate`
- 最终决策与理由被沉淀为 `LearningArtifact`

### 场景 2：入职流程编排

- Temporal 编排跨系统流程
- AgentActor 生成个性化入职包、FAQ 和日程建议
- 人类 HR 审核关键信息后触发发送
- 失败节点走补偿流程并记录审计轨迹

### 场景 3：政策问答与流程建议

- HumanActor 发起问题
- AgentActor 检索知识库并生成结构化答案
- 若触及薪酬、合规、雇佣风险等高风险领域，输出仅作为建议
- 若用户要求执行变更，则必须转入 `WorkItem + ApprovalGate`

### 场景 4：考勤补签与人工修正

- HumanActor 发起补签或修正请求，系统创建 WorkItem。
- Control Plane 校验员工、部门、日期和当前考勤状态。
- PolicyRule 根据修正类型、时间跨度和操作者权限判断风险。
- 低风险更正可进入主管审批，高风险批量修正必须升级到 HR 管理员或合规角色。
- ApprovalGate 决策后由控制面写入考勤事实，AgentActor 只能生成说明、收集证据或草拟通知。
- 修正前后值、审批理由和附件引用必须写入审计。

### 场景 5：生产策略候选发布

- AgentActor 或 HumanActor 提出 prompt、workflow、策略或模型路由候选。
- 系统创建 Experiment，绑定数据集、指标、风险等级和退出条件。
- `staging` 完成沙盒评测和流程回放。
- 人类审批差异报告后，才能在 `prod` 进入灰度发布。
- 观察窗口内若出现治理指标劣化、成本异常或审批漏触发，必须停止扩大并回滚。

## 人工中断点

以下场景默认要求人工中断：

- 访问高敏数据
- 发起外部沟通
- 变更组织/雇佣/薪酬事实
- 修改审批策略、预算或模型路由
- 影响生产策略或发布状态的学习结果落地

## 失败与补偿

- AgentRun 失败：Temporal 保留流程状态，WorkItem 标记为 `blocked` 或转人工处理。
- 工具调用失败：记录工具、输入引用、错误码和重试策略；高风险工具不能自动无限重试。
- 审批超时：按 ApprovalGate 策略提醒、升级或取消，不能默认批准。
- 外部通知发送失败：进入补偿分支，记录是否已部分送达。
- 数据写入失败：主事务回滚，outbox 事件不得伪造成功。
- 模型不可用：使用备用模型路由、降级到只读建议或请求人工接管。

## 学习沉淀规则

- 只沉淀完成、失败、驳回、升级和人工修正样本，不只采集成功样本。
- LearningArtifact 必须带来源 WorkItem、数据分级、适用范围和环境标签。
- 含敏感字段的样本进入评测前必须脱敏或摘要化。
- 学习沉淀不能改变生产策略，只能进入 [learning-flywheel.md](learning-flywheel.md) 定义的受控飞轮。
