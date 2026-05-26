# Phase 1: 环境隔离守卫最小实现计划

## 归档记录

- 完成日期：2026-05-19。
- 验收依据：本轮 human owner 批准清理 active execution plans；归档前执行 `pnpm check`，覆盖 workspace、环境样例、运行入口、模板 manifest 和 Node 内置测试。
- 实际交付物：`packages/contracts`、`packages/policy`、环境样例、环境配置校验、ToolContract 策略、外部 agent mock connector 策略、仓库级 `pnpm check` / `pnpm run doctor` / `pnpm validate:workspace` / `pnpm validate:env:all` 和 Linux / Windows CI 检查。
- 与原计划偏差：实际还保留了不接入生产控制面的 Rust policy kernel skeleton，用于验证术语、风险和审批边界；它不启动生产服务，不访问真实 connector、secret、数据库或模型供应商 key。
- 未解决风险：首次真实 Go 控制面、数据库、Temporal、LiteLLM、Keycloak、Docker/Compose/devcontainer 或生产模型网关仍需要独立执行计划、审批、审计和回滚设计。
- 后续事项：Phase 1 服务初始化继续以 [../README.md](../README.md) 中保留的 Go 控制面 skeleton 计划为入口。

## 背景和问题陈述

仓库已完成 Phase 0 文档底座，但进入 Phase 1 前需要先把可机械检查的环境隔离规则编码化，避免后续控制面、运行面和模型网关实现阶段只依赖人工阅读文档。

## 目标

- 建立 `packages/contracts` 和 `packages/policy` 的最小代码结构。
- 将环境命名、晋级路径、telemetry 标签、跨环境访问和 ToolContract 高风险执行规则固化为可测试策略。
- 提供本地 CLI，用样例环境配置验证 `dev`、`ci`、`staging`、`prod` 的资源隔离约束。

## 非目标

- 不实现 HR 主数据 API。
- 不启动 Next.js、Go 控制面、Rust 治理内核生产服务、Python Agent Runtime、Temporal 或 LiteLLM 服务；经 human owner 明确批准后，可以保留不接入生产路径的 Rust policy kernel skeleton，用于验证术语、风险和审批边界。
- 不接入真实 secret、数据库、Keycloak realm 或模型供应商 key。
- 不允许 Agent Runtime 直接修改 HR 主数据。

## 影响范围

- `package.json`
- `.gitattributes`
- `.github/workflows/ci.yml`
- `scripts/`
- `packages/contracts/`
- `packages/policy/`
- `config/environments/`
- `docs/zh-CN/deployment-and-operations.md`
- `docs/zh-CN/developer-experience.md`
- `docs/zh-CN/quality-gates.md`

## 交付物

- 共享契约常量：环境、风险等级、actor 类型、telemetry 必填标签和 ToolContract 必填字段。
- 环境配置校验：资源命名、secret 引用、跨环境只读访问、生产数据下沉控制和单步晋级。
- ToolContract 校验与执行策略：生产高风险工具禁止自动执行，高风险动作返回 `require_approval`。
- 仓库级跨平台检查：`pnpm check`、`pnpm run doctor`、`pnpm validate:workspace` 和 `pnpm validate:env:all`。
- 最小 CI：Linux/Windows matrix、Node 24 LTS、pnpm 10、仓库检查和空白检查。
- Node 内置测试覆盖关键隔离规则。

## 依赖和前置条件

- Node.js 24 LTS；当前仓库脚本不使用尚未进入 LTS 的 Node Current 版本作为强制基线。
- 使用 `pnpm` 作为唯一 Node 包管理器；不依赖外部运行时包。
- 当前脚本必须保持 OS-neutral，后续新增复杂脚本优先沉淀到 `scripts/*.mjs` 或包内 `bin/`。
- 样例配置只能包含引用和占位信息，不能包含真实 secret。

## 风险与缓解措施

- 风险：策略实现与文档术语漂移。缓解：契约常量集中在 `packages/contracts`，文档同步更新。
- 风险：误以为 CLI 通过即可生产发布。缓解：文档明确该守卫只是 Phase 1 最小检查，不能替代审批、审计、评测和发布流程。
- 风险：后续服务绕过策略包。缓解：质量门禁要求新增环境、ToolContract 或高风险动作必须覆盖策略测试。
- 风险：后续目录扩展失控。缓解：新增目录必须通过文件组织门禁，并遵守 developer-experience 目标结构。

## 环境隔离影响

本实现只校验环境配置，不连接任何环境资源。样例配置覆盖 `dev`、`ci`、`staging`、`prod`，并要求资源名携带机器可读环境标识。

## 安全、审批、审计和回滚设计

- 高风险与关键风险工具在缺少审批时返回 `require_approval`。
- 生产高风险工具若配置 `autoExecute=true`，ToolContract 校验失败。
- 生产数据进入非生产配置时必须声明脱敏、抽样、审批引用和保留期。
- 该变更可通过删除新增目录和恢复文档改动回滚，不涉及运行时数据。

## 评测或测试方案

- `pnpm test` 执行 Node 内置测试。
- `pnpm validate:env -- config/environments/<env>.sample.json` 验证样例配置。
- `pnpm validate:env:all` 批量验证全部环境样例。
- `pnpm validate:workspace` 验证根目录组织、workspace 清单和跨平台脚本。
- `pnpm check` 串联 workspace、环境样例和测试。
- `pnpm run doctor` 执行本地诊断。

## 验收标准

- 所有测试通过。
- 四个样例环境配置均通过 CLI 校验。
- 仓库级 `pnpm check` 在 Linux 与 Windows CI 中通过。
- 新增根目录资产均属于当前阶段正式入口、CI 或跨平台守卫。
- 文档说明当前新增实现与后续服务边界。
- 新增目录仍局限于当前阶段正式资产，未为尚未实现服务创建空目录；若存在 Rust policy kernel skeleton，必须具备 `Cargo.toml`、README、源码和可运行测试，并明确不接入生产控制面。

## 完成后的归档说明

完成并通过验收后，将本计划移动到 `docs/zh-CN/execution-plans/completed/`，记录偏差、测试结果和后续 Phase 1 服务初始化事项。
