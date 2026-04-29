# AI HRMS

AI HRMS 是一个面向单企业私有化部署的 agent-first 人力资源管理与协作平台蓝图。当前仓库仍以设计文档为主，不包含生产业务代码。目标不是复制传统 HR 系统，而是构建一个允许人类员工与 AI 智能体协同工作的控制面、运行面和治理底座，并让系统在严格审批、评测和审计约束下持续学习与演进。

## 当前范围

- 当前交付物仍以文档为主，不交付生产业务代码。
- 当前仓库只保留正式文档资产，`docs/zh-CN/` 是设计与后续实现阶段的唯一 system of record。
- 新文档全部以本仓库为 system of record，为后续重新初始化仓库提供基础。

## 设计前提

- 部署模式：单企业私有化部署
- 网络边界：强隔离、可受控出网
- 技术策略：供应商无关优先，OpenAI 作为可选适配器而非唯一依赖
- 运行时：TypeScript + Python 双栈
- 自治边界：人类审批闭环，v1 不允许自治代码直接进入生产

## 技术栈基线

- 前端：Next.js 15、React 19、TypeScript、Tailwind CSS v4、shadcn/ui、TanStack Query、Playwright
- 控制面：Node.js 24 LTS、NestJS、Prisma ORM、PostgreSQL 18
- 智能体运行面：Python 3.12、uv、FastAPI、LangGraph、Pydantic v2
- 工作流：Temporal
- 模型网关：LiteLLM Proxy
- 身份：Keycloak
- 可观测性：OpenTelemetry Collector、Grafana、Loki、Tempo、Langfuse self-host

## 文档入口

- [AGENTS.md](AGENTS.md)：Agent 协作规则、知识索引和约束入口
- [ARCHITECTURE.md](ARCHITECTURE.md)：总体架构摘要与关键边界
- [docs/zh-CN/README.md](docs/zh-CN/README.md)：中文解释文档库总索引

## 目录原则

- `AGENTS.md` 只做导航，不承载全部上下文。
- 深层设计、执行计划、ADR、评测基线都进入 `docs/zh-CN/` 并版本化。
- 任何重要决策都应优先沉淀为仓库文档，而不是停留在聊天记录或外部文档中。
