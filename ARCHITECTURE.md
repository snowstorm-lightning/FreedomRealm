# Architecture Summary

AI HRMS 采用三段式结构：

- 模块化单体控制面：承载 HR 核心域、任务入口、审批、策略、审计和管理 API。
- 独立智能体运行面：承载 agent graph、tool-calling、状态记忆、人类中断和恢复。
- Durable Workflow 骨干：承载跨系统长流程、补偿、超时、人工审批和恢复。

## Why This Shape

- 相比“先拆很多微服务”，该结构更适合 v1 快速建立清晰边界、强治理和可演化能力。
- 相比“把一切塞进一个推理服务”，该结构更适合长生命周期流程、人工介入和审计。
- 相比“强绑定单一模型厂商”，该结构更适合在强隔离企业网络中保留供应商替换能力。

## Core Components

- Web 控制台：Next.js 15 + React 19
- 控制面 API：NestJS + Prisma + PostgreSQL 18
- Agent Runtime：FastAPI + LangGraph + Pydantic v2
- Workflow Backbone：Temporal
- Identity：Keycloak
- Model Gateway：LiteLLM Proxy
- Observability：OpenTelemetry Collector + Grafana/Loki/Tempo + Langfuse self-host

## Key Boundaries

- 控制面负责事实、权限、审批、审计，以及组织、账号、员工档案、考勤、协作内容等核心 HR 事实。
- Agent Runtime 负责推理、工具选择、上下文拼装和状态化执行，不负责企业主数据真相。
- Temporal 负责跨服务工作流与人工闸门。
- PostgreSQL 同时承载事务数据、事件 outbox、知识索引元数据与首期 pgvector 检索能力。

## Non-Negotiable Constraints

- 控制面不直接承载 agent 推理图执行逻辑。
- Agent Runtime 不直接写入 HR 主数据真相。
- 长流程、审批、超时和补偿由 Temporal 管理。
- 所有模型调用必须经过 LiteLLM Proxy。
- 所有高风险动作必须经过 ApprovalGate。
- `dev`、`ci`、`staging`、`prod` 不得复用数据库、身份、模型 key、长期记忆或生产数据。
- 学习结果不能直接进入生产，必须先经过评测、审批、灰度和回滚设计。

## Deep Links

- 详细架构蓝图：[docs/zh-CN/architecture-blueprint.md](docs/zh-CN/architecture-blueprint.md)
- 业务边界与角色模型：[docs/zh-CN/business-blueprint.md](docs/zh-CN/business-blueprint.md)
- 接口契约：[docs/zh-CN/api-contracts.md](docs/zh-CN/api-contracts.md)
- 安全治理：[docs/zh-CN/security-and-governance.md](docs/zh-CN/security-and-governance.md)
- 环境隔离：[docs/zh-CN/environment-isolation.md](docs/zh-CN/environment-isolation.md)
- 质量门禁：[docs/zh-CN/quality-gates.md](docs/zh-CN/quality-gates.md)
