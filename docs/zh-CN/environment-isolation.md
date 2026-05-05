# 环境隔离方案

## 目标

环境隔离的目标是防止开发、评测、灰度和生产之间发生数据、配置、网络、身份、模型路由、工作流状态或智能体行为污染。v1 采用“分层环境 + 独立资源 + 受控晋级 + 可审计回滚”的方式实现。

本方案约束所有后续实现，包括本地开发、CI、staging、prod、模型网关、Agent Runtime、Temporal、数据库、对象存储、观测系统和评测数据集。

## 隔离原则

- 环境身份独立：不同环境使用不同 OIDC client、service account、AgentActor 注册记录和密钥。
- 数据面独立：不同环境使用独立数据库、Temporal namespace、对象存储 bucket 或前缀、向量索引和 Langfuse project。
- 控制面独立：不同环境使用独立配置源、策略版本、模型路由、预算和审批策略。
- 网络面独立：默认拒绝跨环境访问，只允许经过明确登记的只读同步、备份恢复或发布晋级链路。
- 变更单向晋级：代码、配置、prompt、workflow、策略和模型路由只能从 `dev` 到 `staging` 再到 `prod` 晋级，不能反向覆盖。
- 生产数据不下沉：`prod` 数据不能直接复制到 `dev`；进入 `staging` 的生产样本必须脱敏、抽样、授权和审计。
- 高风险动作受闸门控制：任何影响生产事实、策略、预算、模型路由或学习结果发布的动作都必须经过 `ApprovalGate`。

## 环境分层

| 环境 | 用途 | 数据来源 | 出网策略 | 发布权限 |
| --- | --- | --- | --- | --- |
| `dev` | 本地开发、文档驱动验证、单元测试 | 合成数据、最小 fixture | 默认禁止访问外部生产服务，可使用 mock 模型或开发网关 | 开发者自助 |
| `ci` | 自动化测试、契约校验、镜像构建、安全扫描 | 一次性测试数据 | 默认无公网出网；依赖下载走受控缓存 | CI service account |
| `staging` | 受控集成、流程回放、评测、灰度预演 | 合成数据、脱敏样本、基线评测集 | 只能通过 staging LiteLLM Proxy 和登记连接器出网 | 发布管理员 + 审批 |
| `prod` | 正式生产运行 | 生产数据 | 只能通过 prod LiteLLM Proxy 和生产登记连接器出网 | 双人审批或更高审批策略 |

`ci` 是工程实现阶段必须补充的环境层，不能复用 `dev`、`staging` 或 `prod` 资源。

## 资源隔离矩阵

| 资源 | 隔离方式 | 最低要求 |
| --- | --- | --- |
| PostgreSQL | 每环境独立实例或独立集群；不得跨环境共享 schema | 独立账号、独立迁移历史、独立备份策略 |
| pgvector | 随 PostgreSQL 环境隔离 | 不同环境不得共享 embedding index |
| Temporal | 每环境独立 namespace，生产建议独立集群 | workflow id 必须带环境前缀或由 namespace 保证唯一 |
| Keycloak | 每环境独立 realm 或独立实例 | OIDC client、role、service account 不复用 |
| LiteLLM Proxy | 每环境独立部署和配置 | 模型 key、预算、路由、限流规则独立 |
| Langfuse | 每环境独立 project | prompt、trace、score、dataset 不混写 |
| OTel/Loki/Tempo/Grafana | 可共享平台，但必须强制环境标签和访问控制 | 所有日志、指标、trace 必须带 `env` 标签 |
| 对象存储 | 每环境独立 bucket 或强隔离前缀 | 生产附件、导出文件和评测样本不得混放 |
| Secret 管理 | 每环境独立 secret path 和轮换策略 | 禁止在仓库、镜像和日志中落盘明文 secret |
| 容器镜像 | 镜像可复用，运行配置不可复用 | 镜像 digest 固定，配置由环境注入 |

## 命名规范

后续实现阶段，环境相关资源必须使用稳定前缀或标签：

- 数据库：`ai_hrms_{env}` 或独立实例名称。
- Temporal namespace：`ai-hrms-{env}`。
- Keycloak realm：`ai-hrms-{env}`。
- LiteLLM Proxy deployment：`litellm-{env}`。
- Langfuse project：`ai-hrms-{env}`。
- 对象存储 bucket 或前缀：`ai-hrms-{env}/`。
- Kubernetes namespace：`ai-hrms-{env}`。
- telemetry 标签：`env={dev|ci|staging|prod}`。

资源名称不能只靠显示名称区分，必须在机器可读配置中携带环境标签。

## 网络隔离

### 默认网络策略

- `dev`、`ci`、`staging`、`prod` 网络默认互不可达。
- 应用组件只允许访问本环境内依赖。
- Agent Runtime 不允许自由出网。
- 外部模型访问必须经过本环境 LiteLLM Proxy。
- 跨环境只允许以下受控链路：
  - 从制品仓库拉取已签名镜像或包。
  - 从 `prod` 到备份仓库写入加密备份。
  - 从 `prod` 到脱敏任务输出区写入经审批的样本。
  - 从 `staging` 读取经审批的脱敏样本和评测基线。

### 出网控制

每个环境的 LiteLLM Proxy 必须独立配置：

- 允许的模型供应商和模型列表。
- 每个 AgentActor、workflow、部门或业务域的预算。
- 速率限制和并发限制。
- 数据分级拦截规则。
- 审计字段：调用方、模型、路由、耗时、成本、输入引用、输出引用。

`prod` 不能使用 `dev` 或 `staging` 的模型 key；`staging` 不能直接访问 `prod` 模型网关。

## 数据隔离

### 数据分类

- 合成数据：可用于 `dev`、`ci`、`staging`。
- 脱敏样本：只允许进入 `staging` 和评测数据集。
- 生产数据：只允许在 `prod` 内使用。
- 审计数据：按环境分别保留，跨环境分析时只能使用聚合指标或脱敏引用。

### 生产数据下沉规则

生产数据默认禁止下沉。确需使用真实分布进行评测时，必须满足：

1. 创建 `WorkItem` 说明用途、范围、保留期限和风险等级。
2. 经过 `ApprovalGate` 审批。
3. 执行脱敏、抽样和字段最小化。
4. 生成不可逆样本 id，移除可识别个人身份的信息。
5. 将脱敏结果写入 staging 专用数据集。
6. 写入审计事件，记录 `input_refs`、`output_refs`、`approval_refs` 和 `rollback_refs`。

### 数据库迁移

- 迁移脚本必须先在 `ci` 执行，再进入 `staging`，最后进入 `prod`。
- 破坏性迁移必须提供回滚脚本、数据备份点和人工确认步骤。
- `prod` 迁移前必须创建恢复点，并记录迁移版本、操作者和审批引用。
- `dev` 的临时 schema 变更不能作为事实来源，必须通过正式迁移文件晋级。

## 配置与 Secret 隔离

- 配置按环境存储，不允许使用同一个 `.env` 覆盖多个环境。
- 配置键名可以一致，值必须由环境注入。
- Secret 不进入 Git、镜像、日志、trace 或 Langfuse。
- 每个环境使用独立密钥材料，包括数据库密码、OIDC secret、模型供应商 key、对象存储 key 和 webhook secret。
- Secret 轮换必须先在 `staging` 演练，再在 `prod` 执行。
- 任何 secret 泄漏都按安全事件处理，必须撤销、轮换、审计和复盘。

## 身份与权限隔离

- `HumanActor` 与 `AgentActor` 身份分离。
- 同一自然人在不同环境中的账号不得共享 session。
- `AgentActor` 按环境注册，能力、预算、工具边界和审批要求独立配置。
- CI、部署、迁移、备份、脱敏和评测都使用独立 service account。
- `prod` 管理权限不得授予普通开发账号。
- 生产高风险操作至少需要 `ApprovalGate`，具体审批人数由风险策略决定。

## Agent Runtime 隔离

Agent Runtime 是污染风险最高的运行面，必须额外约束：

- 每个 agent run 必须绑定 `env`、`AgentActor`、`WorkItem`、策略版本和预算。
- ToolContract 必须按环境启用，默认禁止跨环境工具调用。
- 写操作工具在 `dev` 和 `staging` 中只能作用于本环境数据。
- 高风险工具在 `prod` 中必须触发 `ApprovalGate`，不能由模型输出自行放行。
- 长期记忆、知识索引和向量召回按环境隔离。
- prompt、workflow 分支和工具选择策略不能从评测结果直接写入生产配置。

## 评测与学习隔离

学习结果进入生产前必须经过独立环境验证：

1. `dev` 生成候选 prompt、workflow 分支、工具选择策略或知识摘要。
2. `ci` 执行格式校验、契约测试和静态策略检查。
3. `staging` 使用固定数据集做沙盒评测和流程回放。
4. 人类审批评测结果、差异说明和风险标签。
5. 在 `prod` 按人群、部门或 workflow 百分比灰度发布。
6. 监控异常阈值，触发自动停止或人工回滚。

评测数据集必须版本化，评测输出必须记录基线版本、候选版本、样本切片和指标差异。

## 发布与晋级

### 晋级对象

以下对象都必须按环境晋级：

- 应用镜像和数据库迁移。
- API contract 和事件 schema。
- PolicyRule、预算策略、工具白名单。
- prompt、workflow、agent graph 配置。
- 模型路由、限流和降级策略。
- Keycloak realm 配置。

### 晋级规则

- 制品不可变：进入 `staging` 和 `prod` 的镜像必须使用 digest。
- 配置可审计：所有环境配置变更必须有操作者、原因和审批引用。
- 晋级不可跳级：不能从 `dev` 直接发布到 `prod`。
- 生产可回滚：每个发布单元必须声明回滚版本和回滚条件。
- 发布后观察：生产发布必须设置观察窗口，窗口内异常超过阈值即停止扩大灰度。

## 可观测性隔离

所有日志、指标、trace、prompt 观测和审计事件必须包含：

- `env`
- `service`
- `version`
- `workflow_id`
- `agent_run_id`
- `actor_type`
- `actor_id`
- `policy_version`
- `approval_refs`

观测平台可以物理共享，但查询权限必须按环境隔离。普通开发者默认不能查询 `prod` 原始日志、prompt、tool 输入输出和敏感 trace。

## 备份与恢复隔离

- 每个环境独立备份策略和保留周期。
- `prod` 备份必须加密、定期恢复演练，并限制读取权限。
- `staging` 可使用脱敏样本恢复演练，不能使用未脱敏生产备份。
- 恢复演练必须记录 RPO、RTO、恢复版本和验证结果。
- 恢复到非生产环境前必须执行脱敏和访问权限降级。

## 本地开发隔离

未来实现阶段，本地开发必须满足：

- 使用项目本地依赖目录，不依赖全局包状态。
- Node 使用 lockfile 和包管理器版本约束。
- Python 使用 `uv` 和项目级虚拟环境。
- 本地数据库、Temporal、Keycloak、LiteLLM mock 或开发实例必须使用 `dev` 前缀。
- 本地 `.env` 只能引用 `dev` 资源。
- 本地 seed 数据只能是合成数据。

建议的本地边界：

| 项目 | 要求 |
| --- | --- |
| Node 依赖 | 使用 lockfile，禁止依赖全局安装包 |
| Python 依赖 | 使用 `uv.lock` 和项目虚拟环境 |
| 数据库 | 本地容器或 dev 数据库，禁止连接 prod |
| 模型 | mock、stub 或 dev LiteLLM Proxy |
| seed | 合成组织、员工、考勤和协作内容 |
| 配置 | `.env.local` 仅用于 dev，不提交仓库 |

## CI 隔离

CI 必须使用一次性环境：

- 每次 pipeline 创建临时数据库和测试数据。
- 测试完成后销毁临时资源。
- CI 不持有生产 secret。
- PR 测试不能访问 `prod` 或 `staging` 私有资源。
- 发布 pipeline 与 PR 校验 pipeline 使用不同 service account。
- 所有制品生成、签名、扫描和发布记录进入审计。

## 禁止事项

- 禁止在 `dev`、`ci` 或 `staging` 中使用 `prod` 数据库连接串。
- 禁止 `staging` 直接调用 `prod` LiteLLM Proxy。
- 禁止把生产附件、导出文件或 prompt trace 复制到本地。
- 禁止复用生产 Keycloak realm、OIDC client 或 service account。
- 禁止在评测数据集中保存未脱敏的身份证、银行卡、薪酬或合同明细。
- 禁止通过手工 SQL 在 `prod` 修复事实而不创建 WorkItem、审批和审计记录。

## 验收清单

上线任何新能力前必须回答：

- 是否声明了目标环境和允许晋级路径？
- 是否使用了独立数据库、Temporal namespace、模型网关配置和 secret？
- 是否存在跨环境访问？如果存在，是否登记、审批、审计且默认只读？
- 是否会把生产数据带入非生产环境？如果会，是否脱敏、抽样、授权和设置保留期？
- 是否存在 AgentActor 跨环境复用身份、预算或工具权限？
- 是否存在不经过 staging 的模型路由、prompt、workflow 或策略变更？
- 是否为生产变更定义了回滚版本、回滚条件和恢复验证？
- 是否所有日志、指标、trace 和审计事件都带 `env` 标签？
