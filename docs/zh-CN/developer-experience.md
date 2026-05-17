# 开发体验与文件组织

## 目标

开发体验的目标是让个人、社区贡献者和企业内部开发者都能快速进入 AI-HRMS，不被宿主机差异、脚本差异、目录混乱或服务依赖复杂度阻塞。

本项目不要求所有开发者使用同一种操作系统。Windows、Linux、macOS 和 WSL 都是一等开发环境。项目应优先保证命令、脚本、路径和依赖管理是跨平台的；只有复杂服务依赖需要用 Docker、Compose 或 devcontainer 兜底。

## 支持原则

- 可跨平台安装的工具不视为环境风险，例如 Node、pnpm、uv、Docker CLI。
- 风险来自未钉住版本、未提交 lockfile、脚本依赖特定 shell、路径硬编码或服务依赖无法本地替代。
- 本机开发路径和容器兜底路径必须同时清晰，但不强制所有简单任务进入容器。
- Tiny / Demo / Local Mode 的开发入口不应要求完整 Enterprise 依赖。
- 所有命令默认从仓库根目录执行。

## 支持矩阵

| 场景 | Windows | Linux | macOS | WSL | 要求 |
| --- | --- | --- | --- | --- | --- |
| 文档编辑 | 支持 | 支持 | 支持 | 支持 | Git + 编辑器 |
| TypeScript Web / Demo / 仓库脚本 | 支持 | 支持 | 支持 | 支持 | Node 24 + pnpm |
| Go 控制面与 Rust 治理内核实现 | 后续支持 | 后续支持 | 后续支持 | 后续支持 | 具体工具链由 Phase 1 ADR / execution plan 固化 |
| Python Agent Runtime | 后续支持 | 后续支持 | 后续支持 | 后续支持 | Python 3.14 stable + uv |
| 轻量 Demo | 支持 | 支持 | 支持 | 支持 | Node + mock/stub；CLI 与静态 Web Workbench |
| 完整本地栈 | 通过容器兜底 | 通过容器兜底 | 通过容器兜底 | 通过容器兜底 | Docker/Compose/devcontainer |

## 推荐开发入口

每次打开仓库先看 [project-operating-entry.md](project-operating-entry.md)。该文件给出当前推荐任务清单、`WorkShard` / `AgentWorkLease` 分派规则、`writeSet` 防冲突要求和停止条件。开发命令仍以本节为准。

### 最小验证路径

用于文档、契约和策略包验证，不启动数据库、Temporal、Keycloak 或模型网关。

```text
pnpm install
pnpm check
pnpm doctor
```

需要拆分定位时，可分别执行：

```text
pnpm test
pnpm demo
pnpm knowledge:demo -- --query "AI-HRMS 下一步应该做什么？"
pnpm self-review
pnpm report:html
pnpm validate:operating-entry
pnpm web:demo
pnpm validate:workspace
pnpm validate:env:all
pnpm validate:env -- config/environments/dev.sample.json
```

### 本机开发路径

适合只改文档、contracts、policy、schemas、eval samples、Demo engine、Knowledge engine 或轻量 Web Workbench。

- 安装 Node 和 pnpm。
- 使用仓库内 `packageManager`；引入外部依赖后使用 `pnpm-lock.yaml`。
- 使用项目本地依赖，不依赖全局 node_modules。
- 只连接 `dev` 资源或 mock/stub。

### 容器兜底路径

适合需要 PostgreSQL、Temporal、Keycloak、LiteLLM、OTel、对象存储或系统库的任务。

后续应提供：

- `Dockerfile.dev`
- `docker-compose.dev.yml`
- `.devcontainer/devcontainer.json`

容器路径不替代本机路径，而是屏蔽复杂服务依赖。

## 脚本规范

`package.json`、CI 和 runbook 中的命令必须优先满足：

- 使用 Node、Python 或工具自身 CLI，而不是依赖 shell 内建命令。
- 避免在 scripts 中直接写 `rm`、`cp`、`mv`、`sed`、`grep`、`chmod`、`export VAR=value`、PowerShell 专用语法或 cmd 专用语法。
- 需要复杂逻辑时放入 `scripts/*.mjs`、`scripts/*.py` 或对应包内 `bin/`，由项目命令调用。
- 路径拼接使用运行时 path API，不硬编码 `C:\...`、`/tmp/...`、`/home/...`、反斜杠分隔或当前开发者主目录。
- 文档中涉及 OS-specific 命令时，必须标注适用系统并给出等价路径。

## 依赖与版本

Node / TypeScript 侧：

- 根 `package.json` 必须声明 `packageManager`。
- Node 运行时使用单一稳定基线；当前为 `>=24.0.0 <26.0.0`，不把尚未进入 LTS 的 Node Current 版本作为强制基线。
- Node.js 主要用于 TypeScript 前端、Demo Mode、仓库脚本和轻量 glue code，不再作为长期生产 Core Control Plane 的默认主语言。
- 一旦引入外部依赖，必须提交 `pnpm-lock.yaml`。
- 无外部依赖阶段可使用 `pnpm install --frozen-lockfile=false`；一旦提交 lockfile，CI 必须切换为 `pnpm install --frozen-lockfile` 或等价严格安装。

Go 控制面与 Rust 治理内核侧：

- Core Control Plane 的长期生产方向默认采用 Go 服务主干，具体服务框架、数据库访问、迁移工具和测试策略必须在 Phase 1 服务实现 ADR 或 execution plan 中固化。
- Rust 用于 Policy / Contract / Protocol Kernel、协议 envelope 校验、schema 校验、风险判定、CLI validator 和可选 WASM 插件。
- Go 适合 API 服务、WorkItem 状态管理、ApprovalGate 服务、ProjectInstance 管理、AuditEvent 写入、ReportCard 服务和 Federation Gateway。
- Windows 个人用户、Tiny Mode、Demo Mode 和 Local Mode 优先走 Go 单二进制、本地 SQLite / 文件存储和 mock 路径，不要求先安装完整企业栈或 Rust 构建链。
- 不为尚未实现的 Go 服务或 Rust 内核创建空目录；新增目录前必须有可运行入口、测试、README 或长期维护责任。

Python 侧：

- Agent Runtime、AI adapter、evals 和模型实验可以使用 Python 3.14 stable；不得使用 rc、beta 或 alpha 作为生产基线。
- Python 不默认拥有核心事实写入权；Python agent 输出必须经控制面校验、审计和必要审批。
- Agent Runtime 引入外部依赖时必须使用 `uv`。
- 必须提交 `uv.lock`。
- 虚拟环境不得提交仓库。

服务侧：

- 数据库、Temporal、Keycloak、LiteLLM、OTel、对象存储使用容器或明确的 dev 资源。
- 本地 `.env.local` 只允许引用 `dev` 资源，不提交仓库。

## Doctor 检查

当前提供 `pnpm doctor`，用于本地诊断但不自动修改用户环境。当前检查至少覆盖：

- Node 版本是否满足要求。
- pnpm 版本是否匹配 `packageManager`。
- 依赖与 lockfile 策略是否一致。
- workspace 清单、根目录组织和根脚本是否符合跨平台约束。
- 环境样例配置是否通过校验。
- 是否存在明显 OS-specific scripts。

后续引入服务依赖后，Doctor 还应扩展检查容器服务健康、模型网关可达性、开发端口占用和本机绝对路径引用。Doctor 只做诊断，不应自动修改用户环境。

## CI 要求

当前最小 CI：

- Linux 与 Windows matrix。
- Node 24 LTS。
- Corepack + `pnpm@10.0.0`。
- `pnpm install --frozen-lockfile=false`，在首次引入外部依赖并提交 lockfile 后切换为严格 frozen install。
- `pnpm check`，覆盖 workspace、环境样例和测试。
- `git diff --check` 或等价空白检查。

成熟后增加：

- Docker Compose smoke test。
- FederationProtocol compatibility test。
- GovernanceBrain 和 ModelCapabilityProfile 评测切片。

## 当前文件组织分析

当前仓库结构：

```text
.
├─ .gitattributes
├─ .github/
│  └─ workflows/
├─ AGENTS.md
├─ ARCHITECTURE.md
├─ README.md
├─ package.json
├─ pnpm-workspace.yaml
├─ apps/
│  └─ web/
├─ config/
│  ├─ project-operating-entry.json
│  ├─ connectors/
│  ├─ environments/
│  └─ templates/
├─ docs/
│  └─ zh-CN/
├─ packages/
│  ├─ contracts/
│  ├─ demo/
│  ├─ knowledge/
│  └─ policy/
└─ scripts/
   ├─ check.mjs
   ├─ doctor.mjs
   ├─ render-delivery-report-html.mjs
   ├─ run-knowledge-demo.mjs
   ├─ run-self-review.mjs
   ├─ run-tests.mjs
   ├─ validate-env-all.mjs
   └─ validate-workspace.mjs
```

当前结构是合理的，原因：

- 根目录只保留入口文档、workspace 配置和当前阶段正式资产。
- `docs/zh-CN/` 承担 system of record，符合 AGENTS 工作规则。
- `config/environments/` 独立存放环境样例，便于策略校验。
- `config/project-operating-entry.json` 是项目运行入口的机器事实源，供校验脚本和 Web Workbench 读取。
- `config/connectors/` 存放 OpenClaw、Hermes Agent 等外部 agent runtime 的 mock connector profile；真实 connector 配置不得保存 secret 明文。
- `config/templates/` 存放 Demo Mode 模板 manifest，便于 CLI 和 Web 共享。
- `apps/web/` 存放当前静态 Web Workbench，读取共享 Demo engine 生成的数据，不直接访问数据库。
- `packages/contracts/` 存放跨包共享词表和常量。
- `packages/demo/` 存放 CLI 和 Web 共用的 Demo Mode 执行层，避免入口之间复制业务逻辑。
- `packages/knowledge/` 存放本地 deterministic 知识导航、来源定位、AnswerCard 和 DocChallengeDraft 生成逻辑，供 CLI 和 Web 共享。
- `packages/policy/` 存放可机械检查的治理规则。
- `scripts/` 存放跨平台本地守卫，避免把复杂逻辑写进 shell-specific package scripts。
- `scripts/run-self-review.mjs` 用于运行项目自我审查模板，只生成报告卡，不修改仓库文件。
- `scripts/render-delivery-report-html.mjs` 用于从有效 JSON report cards 生成整体 HTML 交付报告，不替代 Markdown 文档。
- `.github/workflows/` 存放最小 CI，使 Windows/Linux 差异尽早暴露。

当前不建议移动文件。项目仍处于文档基线、最小策略守卫和轻量 Demo Workbench 阶段；新增目录都必须有可运行入口、README 或测试。

外部 agent 接入、自我审查和 HTML 总报告当前不需要新增 workspace package：

- connector profile 是配置资产，放在 `config/connectors/`。
- 共享契约继续放在 `packages/contracts/`。
- 策略校验继续放在 `packages/policy/`。
- mock 执行和报告渲染继续放在 `packages/demo/`。
- CLI 入口放在 `scripts/`，由根 `package.json` 暴露为 `pnpm self-review` 和 `pnpm report:html`。

## 未来目标结构

进入服务实现阶段后，建议按以下结构扩展：

```text
.
├─ apps/
│  ├─ web/
│  ├─ control-plane/
│  └─ agent-runtime/
├─ packages/
│  ├─ contracts/
│  ├─ demo/
│  ├─ policy/
│  ├─ evals/
│  ├─ federation/
│  └─ devtools/
├─ config/
│  ├─ environments/
│  └─ templates/
├─ infra/
│  ├─ compose/
│  ├─ docker/
│  ├─ k8s/
│  ├─ temporal/
│  ├─ keycloak/
│  └─ observability/
├─ scripts/
│  ├─ check.mjs
│  ├─ doctor.mjs
│  ├─ run-tests.mjs
│  ├─ validate-env-all.mjs
│  └─ validate-workspace.mjs
├─ docs/
│  └─ zh-CN/
│     ├─ adr/
│     ├─ evals/
│     ├─ execution-plans/
│     └─ runbooks/
├─ .github/
│  └─ workflows/
└─ .devcontainer/
```

## 目录职责

| 目录 | 职责 | 约束 |
| --- | --- | --- |
| `apps/web` | 工作台、审批台、社区控制台 | 不直接访问数据库 |
| `apps/control-plane` | Go 控制面、事实、权限、审批、审计 API | 不承载 LangGraph 执行 |
| `packages/governance-kernel` 或等价 Rust 包 | Rust Policy / Contract / Protocol Kernel | 不直接写业务事实，通过控制面调用 |
| `apps/agent-runtime` | Python + LangGraph 运行面 / AI adapter | 不直接写 HR 主数据 |
| `packages/contracts` | 共享术语、枚举、schema、事件常量 | 变更需同步 API 文档和测试 |
| `packages/demo` | CLI 与 Web 共用的 Demo Mode 执行层、mock 输出和报告卡生成 | 不访问真实外部连接器，不持有 secret，不复制到 Web 私有逻辑 |
| `packages/knowledge` | 本地 deterministic 知识导航、来源定位、AnswerCard 和 DocChallengeDraft 生成 | 默认不访问外部连接器、embedding 服务或真实模型 |
| `packages/policy` | 可机械检查的策略和治理规则 | 高风险规则优先沉淀于此 |
| `packages/evals` | 数据集、评分器、评测 runner | 不包含未脱敏生产数据 |
| `packages/federation` | FederationProtocol schema、兼容测试和 SDK | 不依赖某个实例内部 API |
| `packages/devtools` | doctor、脚本辅助、开发校验工具 | 必须 OS-neutral |
| `config/connectors` | 外部 agent runtime 的 mock 或受控 connector profile | 不存 secret 明文，真实执行默认关闭 |
| `config/environments` | 环境样例和资源命名 | 不存 secret 明文 |
| `scripts` | 仓库级跨平台检查入口 | 只放当前阶段需要执行的守卫脚本 |
| `infra/compose` | 本地复杂服务编排 | 只用于 dev/local，不替代生产部署文档 |
| `infra/k8s` | Kubernetes 示例和部署基线 | 环境必须独立 |
| `docs/zh-CN/runbooks` | 运维和开发操作手册 | 命令必须标注适用环境 |
| `.github/workflows` | CI、兼容性和安全检查 | 不持有生产 secret |

## 何时新增目录

- 新增 `apps/*`：只有当对应服务有可运行入口、测试和最小 README 时。
- 新增 `infra/*`：只有当本地或部署流程需要可执行配置时。
- 新增或扩展 `scripts/*`：只有当跨平台脚本逻辑无法清晰写在 package scripts 中时。
- 新增 `packages/*`：只有当代码会被两个以上 app 或工具复用，或它代表正式契约边界。
- 新增 `docs/zh-CN/runbooks/*`：只有当命令或操作步骤需要长期维护。

## 不建议的结构

- 不把服务代码放进 `docs/`。
- 不把一次性实验放进根目录。
- 不把应用私有代码放进 `packages/`。
- 不把 infra 配置散落在 app 目录中。
- 不把真实 secret、生产样本、未脱敏 trace 或本地 `.env` 提交仓库。
- 不为尚未实现的服务创建大量空目录。

## 结论

当前文件组织不需要立即迁移到完整目标结构。仓库级 doctor、workspace 校验、环境样例批量校验和最小 CI 已作为提前防范措施落地；短期只需在首次引入外部依赖时补 `pnpm-lock.yaml`，在引入真实服务依赖时补 Docker/Compose/devcontainer。进入 Phase 1 服务实现时，再按目标结构逐步新增目录。
