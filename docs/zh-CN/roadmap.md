# 路线图

## Phase 0: 文档与仓库底座

- 建立根入口文档
- 建立中文知识库
- 固化架构边界、角色模型、契约与治理规则
- 建立 ADR、执行计划和评测基线

退出标准：

- 所有核心专题文档能独立说明目标、边界、状态、审计、评测和回滚要求。
- ADR 至少覆盖控制面/运行面拆分、模型网关和 Temporal/LangGraph 分工。
- 质量门禁能约束后续实现，不只描述愿景。
- 环境隔离和安全治理已作为正式发布约束进入文档索引。

## Phase 1: AI HRMS 基础能力

- 建立控制面与工作台
- 建立 WorkItem、ApprovalGate、AgentActor、PolicyRule 最小闭环
- 建立受控模型网关与知识底座
- 建立基础审计与观测

最小交付：

- `apps/web`、`apps/control-plane`、`apps/agent-runtime`、`packages/contracts`、`packages/policy` 基础结构。
- 组织、账号、员工档案、考勤、权限、协作内容的核心 API。
- WorkItem 状态迁移、ApprovalGate 决策、AgentRun 记录和审计事件。
- LiteLLM Proxy 的 dev/staging/prod 分环境配置样例。
- 基础 Playwright 场景覆盖审批流和人机协作流。

不能进入下一阶段的条件：

- 高风险动作仍可绕过 ApprovalGate。
- Agent Runtime 可直接修改 HR 主数据。
- 没有可追溯的审计事件和策略判断。

## Phase 2: 学习飞轮

- 建立 Observation 汇聚管道
- 建立数据集管理、评测运行和候选发布流程
- 建立提示词、工作流和策略的灰度发布能力

最小交付：

- LearningArtifact、Experiment、EvalRun 的 API 与存储模型。
- 固定基线数据集和评分器版本。
- staging 沙盒回放能力。
- 生产灰度发布、观察窗口和回滚记录。

不能进入下一阶段的条件：

- 学习结果可直接覆盖生产配置。
- 评测数据集没有版本或包含未脱敏生产数据。
- 治理指标缺少发布门槛。

## Phase 3: 深化自治

- 建立更多 agent 角色与跨部门协作能力
- 扩展更复杂的流程编排与多代理协同
- 在严格审批边界内扩大自动执行范围

最小交付：

- 多个 AgentActor 的能力、工具和预算隔离。
- 跨部门 WorkItem 协作、升级和补偿流程。
- 更细粒度的 ToolContract 风险等级和自动执行策略。
- 多代理协同的审计和冲突处理规则。

不能进入下一阶段的条件：

- 多代理协作缺少统一 owner 或冲突解决规则。
- 自动执行范围扩大但评测覆盖没有同步扩大。

## Phase 4: 自治公司扩展

- 将 agent-first 能力扩展到 HR 之外的业务域
- 建立跨域运营台、知识共享与统一治理面
- 逐步形成 company operating system 级别的能力

前置条件：

- HR 域内审批、审计、评测、环境隔离和回滚机制稳定。
- 跨域数据分级、权限模型和知识边界已经定义。
- 新业务域必须先新增业务蓝图、API 契约、评测基线和 ADR。
