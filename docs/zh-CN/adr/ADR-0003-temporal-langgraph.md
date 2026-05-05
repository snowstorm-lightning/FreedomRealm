# ADR-0003: 采用 Temporal + LangGraph 双层编排

## 状态

Accepted

## 背景

系统既需要智能体内部的状态化推理，又需要跨系统长流程、审批闸门和补偿恢复。

## 决策

- LangGraph 负责单次 agent run 内部 graph
- Temporal 负责跨服务工作流、人工审批、超时与恢复

## 交接边界

- Temporal 启动 AgentRun，并传入 WorkItem、策略版本、预算快照和上下文引用。
- LangGraph 只在单次运行内维护推理状态和工具调用状态。
- LangGraph 需要人工介入时返回中断信号，由 Temporal 进入 ApprovalGate 或人工任务。
- Temporal 持有长流程状态、重试、超时、补偿和恢复语义。
- AgentRun 完成后，运行面只返回候选结果、Observation 和工具执行结果引用。

## 后果

### 正面

- 明确区分推理图与业务流程
- 长流程恢复能力更强
- 人工中断与补偿语义更清晰

### 负面

- 需要维护两层编排心智模型
- 需要定义清晰的边界与交接点

## 验证方式

- 长流程暂停后重启 worker，Temporal 能恢复流程状态。
- AgentRun 内部中断后，LangGraph checkpoint 能恢复单次运行上下文。
- 审批超时、拒绝和升级由 Temporal 分支处理。
- 业务补偿不写在 LangGraph 节点中，而由 Temporal workflow 管理。

## 替代方案

- 只用 LangGraph：长流程和人工审批治理不足
- 只用 Temporal：agent 内部推理表达不自然
