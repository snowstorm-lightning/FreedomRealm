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
| Node 策略包开发 | 支持 | 支持 | 支持 | 支持 | Node 24 + pnpm |
| Python Agent Runtime | 后续支持 | 后续支持 | 后续支持 | 后续支持 | Python 3.14 stable + uv |
| 轻量 Demo | 后续支持 | 后续支持 | 后续支持 | 后续支持 | SQLite/mock/stub 优先 |
| 完整本地栈 | 通过容器兜底 | 通过容器兜底 | 通过容器兜底 | 通过容器兜底 | Docker/Compose/devcontainer |

## 推荐开发入口

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
pnpm validate:workspace
pnpm validate:env:all
pnpm validate:env -- config/environments/dev.sample.json
```

### 本机开发路径

适合只改文档、contracts、policy、schemas、eval samples 或轻量 Demo。

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

Node 侧：

- 根 `package.json` 必须声明 `packageManager`。
- Node 运行时使用单一稳定基线；当前为 `>=24.0.0 <26.0.0`，不把尚未进入 LTS 的 Node Current 版本作为强制基线。
- 一旦引入外部依赖，必须提交 `pnpm-lock.yaml`。
- 无外部依赖阶段可使用 `pnpm install --frozen-lockfile=false`；一旦提交 lockfile，CI 必须切换为 `pnpm install --frozen-lockfile` 或等价严格安装。

Python 侧：

- Agent Runtime 使用 Python 3.14 stable；不得使用 rc、beta 或 alpha 作为生产基线。
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
├─ config/
│  └─ environments/
├─ docs/
│  └─ zh-CN/
├─ packages/
│  ├─ contracts/
│  └─ policy/
└─ scripts/
   ├─ check.mjs
   ├─ doctor.mjs
   ├─ run-tests.mjs
   ├─ validate-env-all.mjs
   └─ validate-workspace.mjs
```

当前结构是合理的，原因：

- 根目录只保留入口文档、workspace 配置和当前阶段正式资产。
- `docs/zh-CN/` 承担 system of record，符合 AGENTS 工作规则。
- `config/environments/` 独立存放环境样例，便于策略校验。
- `packages/contracts/` 存放跨包共享词表和常量。
- `packages/policy/` 存放可机械检查的治理规则。
- `scripts/` 存放跨平台本地守卫，避免把复杂逻辑写进 shell-specific package scripts。
- `.github/workflows/` 存放最小 CI，使 Windows/Linux 差异尽早暴露。

当前不建议移动文件。项目仍处于文档基线与最小策略守卫阶段，过早创建大量空目录会降低可读性。

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
| `apps/control-plane` | NestJS 控制面、事实、权限、审批、审计 API | 不承载 LangGraph 执行 |
| `apps/agent-runtime` | FastAPI + LangGraph 运行面 | 不直接写 HR 主数据 |
| `packages/contracts` | 共享术语、枚举、schema、事件常量 | 变更需同步 API 文档和测试 |
| `packages/policy` | 可机械检查的策略和治理规则 | 高风险规则优先沉淀于此 |
| `packages/evals` | 数据集、评分器、评测 runner | 不包含未脱敏生产数据 |
| `packages/federation` | FederationProtocol schema、兼容测试和 SDK | 不依赖某个实例内部 API |
| `packages/devtools` | doctor、脚本辅助、开发校验工具 | 必须 OS-neutral |
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
