# 架构蓝图

## 总体形态

AI HRMS 采用“模块化单体控制面 + 独立智能体运行面 + Durable Workflow 骨干”的结构。

```mermaid
flowchart LR
    UI[Ops Console<br/>Next.js 15 + React 19]
    API[Control Plane<br/>NestJS + Prisma]
    WF[Temporal]
    AR[Agent Runtime<br/>FastAPI]
    LG[LangGraph]
    DB[(PostgreSQL 18<br/>+ pgvector)]
    KC[Keycloak]
    GW[LiteLLM Proxy]
    MP[External or Internal Models]
    OT[OTel Collector]
    OBS[Grafana + Loki + Tempo + Langfuse]

    UI --> API
    API <--> WF
    WF <--> AR
    AR --> LG
    API <--> DB
    AR <--> DB
    API --> KC
    AR --> KC
    LG --> GW
    GW --> MP
    API --> OT
    AR --> OT
    WF --> OT
    GW --> OT
    OT --> OBS
```

## 技术栈基线

基线验证时间：2026-04-29。

| 层 | 选型 | 用途 |
| --- | --- | --- |
| Web UI | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui | 运营台、工作台、审计台、管理台 |
| 数据获取 | TanStack Query | 查询缓存、失效控制、后台刷新 |
| E2E | Playwright | 人机协作流和审批流回归 |
| 控制面 | Node.js 24 LTS, NestJS | HR 核心域、审批、任务、策略、审计 API |
| ORM | Prisma ORM | 模式定义、迁移、类型安全查询 |
| 主数据库 | PostgreSQL 18 | 事务数据、事件 outbox、检索元数据 |
| 向量能力 | pgvector | 知识检索、长期记忆、样本召回 |
| Agent Runtime | Python 3.12, FastAPI, LangGraph, Pydantic v2 | graph 执行、tool-calling、HITL 中断 |
| Workflow | Temporal | 长流程、补偿、超时、审批闸门、恢复 |
| 模型网关 | LiteLLM Proxy | 统一模型协议、预算、策略、审计 |
| 身份 | Keycloak | OIDC/SAML/LDAP/AD |
| 可观测性 | OTel Collector, Grafana, Loki, Tempo, Langfuse | 业务与 LLM 双重观测 |

## 控制面模块

控制面采用模块化单体，首期推荐模块如下：

- `org`：组织根、部门树、负责人、组织编码与目录视图
- `workforce`：账号、员工档案、雇佣生命周期、考勤事实
- `access`：角色、权限目录、授权关系、有效权限快照
- `work`：`WorkItem`、任务路由、SLA、协作状态
- `community`：公告、帖子、评论、内容治理与知识索引引用
- `approvals`：`ApprovalGate`、审批策略、审批记录
- `agents`：`AgentActor` 注册、能力、版本、预算
- `knowledge`：知识索引、记忆引用、资料治理
- `policy`：`PolicyRule`、风险分级、预算约束
- `audit`：审计流、合规模型、追溯查询

## 模块边界规则

- 模块之间通过应用服务、领域事件或显式 repository 接口协作，不直接跨模块修改内部表。
- `audit` 模块只追加审计事件，不参与业务事实的主事务决策。
- `policy` 模块输出策略判断，不能直接执行业务副作用。
- `agents` 模块登记身份、能力和预算，不承载 LangGraph graph 执行。
- `knowledge` 模块可以提供检索和摘要引用，但不能替代 `workforce`、`access` 或 `approvals` 中的事实。
- 所有模块的外部接口必须映射到 [api-contracts.md](api-contracts.md) 中的资源族或事件前缀。

## 运行面职责

Agent Runtime 不承担企业主数据真相，职责限制为：

- 读取控制面下发的任务、上下文与策略
- 选择或编排 `Skill` 和 `ToolContract`
- 在 LangGraph 中执行状态化 graph
- 在触发人工介入时暂停并恢复
- 将运行结果、`Observation` 和建议写回控制面

运行面禁止：

- 直接修改 HR 主数据表。
- 自行决定审批是否可跳过。
- 直接访问公网模型。
- 持有跨环境共享的长期记忆或工具 token。
- 将 prompt、workflow 或策略候选直接写入生产配置。

## Temporal 与 LangGraph 的分工

- LangGraph：单次 agent run 内部的推理图、节点状态和中断恢复
- Temporal：跨 run、跨系统、跨人机边界的业务工作流

这意味着：

- “生成候选 offer 文案并等待主管审核”是 Temporal 工作流
- “分析候选人资料并调用工具草拟文案”是 LangGraph graph

## 数据分层

- 事务层：组织、账号、员工档案、考勤、访问控制、协作内容、任务、审批、策略、审计
- 事件层：组织事件、人员事件、考勤事件、授权事件、工作流事件、agent run 事件、评测事件
- 记忆层：知识块、嵌入、召回索引、长期记忆映射、协作内容摘要
- 观测层：日志、指标、trace、prompt、tool 调用、判定结果、审批路径

## 数据所有权

| 数据类别 | 主 owner | 写入入口 | 读取者 | 关键约束 |
| --- | --- | --- | --- | --- |
| 组织、账号、员工、考勤 | 控制面 `org` / `workforce` | v1 API、受控迁移 | UI、Agent Runtime 只读或受控工具 | 高敏字段按权限与数据分级过滤 |
| WorkItem 与审批 | 控制面 `work` / `approvals` | API、Temporal workflow | UI、Temporal、Agent Runtime | 状态迁移必须审计 |
| 策略与预算 | 控制面 `policy` | 管理 API + ApprovalGate | Agent Runtime、LiteLLM Proxy | 生产变更强审批 |
| 知识与记忆 | 控制面 `knowledge` | 文档导入、Observation、评测沉淀 | Agent Runtime、搜索接口 | 不是真实 HR 主数据 |
| 事件 outbox | 控制面各模块 | 业务事务内追加 | 消费者、审计、评测管道 | 至少一次投递，消费者幂等 |
| 观测数据 | OTel/Langfuse | 服务 SDK、网关、运行面 | 运维、治理者 | 必须带 `env`、actor 和版本标签 |

## 一致性与事件

- 核心 HR 事实使用数据库事务保证强一致。
- 跨模块副作用通过 outbox 事件驱动，消费者必须支持幂等。
- Temporal workflow id 必须能够关联 `WorkItem` 和业务实体。
- AgentRun 输出先作为候选或建议写回，只有通过策略和审批后才能触发高风险副作用。
- 事件消费者失败不能阻塞主事务，但必须进入重试、死信或人工处理队列。

## 典型请求路径

1. HumanActor 在 Ops Console 创建 `WorkItem`。
2. Control Plane 校验权限、数据边界和初始风险等级。
3. Temporal 创建或推进业务工作流。
4. Agent Runtime 在授权边界内执行 graph，并通过 LiteLLM Proxy 调用模型。
5. 高风险动作请求进入 `ApprovalGate`。
6. 审批结果驱动 Temporal 继续、回退、补偿或关闭。
7. Control Plane 写入事实、事件、审计与 Observation。
8. 学习管道只消费 Observation 和脱敏样本，不直接改生产行为。

## 网络与安全边界

- 控制面与运行面默认部署在企业内网
- 只有 LiteLLM Proxy 所在的受控网段允许按策略出网
- 外部模型调用必须走网关，不允许运行面直连公网模型
- 身份、预算、审批、审计不得由模型输出自行决定
- 环境隔离边界以 [environment-isolation.md](environment-isolation.md) 为准

## 可靠性设计

- 控制面 API 必须对写操作提供幂等键或业务唯一约束。
- Temporal 承担长流程重试、超时、补偿和人工恢复。
- Agent Runtime 失败时必须返回可审计失败状态，不得静默吞错。
- 模型网关失败时按策略切换备用路由、降级为人工接管或阻塞等待。
- 数据库迁移、策略发布和模型路由变更都必须有回滚路径。

## OpenAI 适配原则

若环境启用 OpenAI，推荐优先采用：

- Responses API 作为新项目主接口
- Structured Outputs 作为边界结构化输出能力
- Function Calling 作为工具调用能力
- Evals 作为提示词与 agent 流程评测能力

但这些只在 LiteLLM/OpenAI 适配层体现，系统整体不绑定单一厂商。
