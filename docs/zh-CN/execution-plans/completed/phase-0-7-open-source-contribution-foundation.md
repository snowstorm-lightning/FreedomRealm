# Phase 0.7: Open Source Contribution Foundation 计划

## 状态

Completed

2026-05-26：human owner 要求在项目达到开源可用前持续推进。本计划承接 Phase 0.7 路线图，补齐最小开源贡献入口，同时不替维护者做最终许可证、商标或官方兼容认证决策。

2026-05-26：本计划已归档。仓库已具备最小开源贡献入口和机械校验，但最终 LICENSE、商标策略、官方兼容认证和真实发布流程仍需后续人工决策。

## 背景和问题陈述

FreedomRealm 已有 README、文档库、Demo Mode、Web Workbench、Go 控制面 skeleton 和 mock v1 WorkItem endpoints，但仓库根目录还缺少面向外部贡献者的最小入口：贡献指南、行为准则、安全披露路径、许可证候选材料、issue 模板和 PR 模板。

没有这些资产时，项目可以被阅读和运行，但难以让外部用户安全提交问题、模板、失败样本、文档修正或代码贡献，也容易在许可证、secret、生产数据、真实 connector 和高风险自治范围上产生误解。

## 目标

- 新增最小开源贡献资产：
  - `LICENSE-CANDIDATES.md`
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `.github/PULL_REQUEST_TEMPLATE.md`
  - `.github/ISSUE_TEMPLATE/` 下的 bug、feature、template、failure-case 模板
- 增加轻量校验脚本，纳入 `pnpm check`。
- 同步 README、开源策略、社区治理、传播与增长、路线图、开发体验和执行计划索引。
- 保持 AGENTS.md 不超过 100 行；本轮不扩写 AGENTS.md。

## 非目标

- 不选择最终 LICENSE，不新增正式 `LICENSE` 文件。
- 不申请或定义最终商标注册、Logo 使用许可或官方兼容认证名单。
- 不启用真实 connector、secret、生产数据、外部 issue 自动创建、PR 自动合并或模型调用。
- 不改变当前 P2 live connector / live model 阻塞状态。

## 影响范围

- 根目录开源入口文档。
- `.github/` issue / PR 模板。
- `scripts/validate-open-source-assets.mjs`、`package.json` 和 `scripts/check.mjs`。
- `docs/zh-CN/` 中与开源策略、社区治理、传播和开发体验相关的文档。

## 安全、审批、审计和回滚设计

- 许可证、商标和官方兼容认证保持 human owner 决策点，不由 agent 自动定稿。
- 所有模板必须提示不要提交 secret、生产数据、敏感原文、真实 connector 配置或未授权外部账号信息。
- PR 模板必须要求说明是否影响 `ApprovalGate`、数据分级、审计、预算、模型路由、Federation 或自适应运行。
- 回滚方式是删除新增开源资产和移除 `validate:open-source` 脚本引用；不涉及数据库、外部系统或生产数据。

## 验证计划

```text
pnpm validate:open-source
pnpm check
git diff --check
```

## 验收标准

- 开源贡献者能从根目录找到贡献、行为、安全和许可证候选入口。
- issue / PR 模板能引导贡献者声明范围、验证命令、数据分级和治理影响。
- `pnpm check` 会阻止关键开源资产缺失或模板缺少安全边界。
- `AGENTS.md` 行数不超过 100。
- 完成后归档到 `docs/zh-CN/execution-plans/completed/`，记录实际交付、偏差和剩余风险。

## 实际交付物

- 根目录新增 `LICENSE-CANDIDATES.md`、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md` 和 `SECURITY.md`。
- `.github/ISSUE_TEMPLATE/` 新增 bug、feature、template contribution 和 failure case 模板。
- `.github/PULL_REQUEST_TEMPLATE.md` 新增 PR 治理检查清单。
- `scripts/validate-open-source-assets.mjs` 新增开源资产校验，并通过 `validate:open-source` 纳入 `pnpm check`。
- README、开源策略、社区治理、传播增长、路线图、质量门禁、开发体验、项目运行入口和执行计划索引已同步更新。

## 偏差

- 未新增最终 `LICENSE` 文件；本轮只新增候选材料，避免 agent 替维护者做法律和治理决策。
- 未新增 Commons 资产撤回自动化；当前只提供贡献入口和边界校验。

## 剩余风险和后续事项

- 最终 LICENSE、商标策略、官方兼容认证和发布身份仍需 human owner / 社区治理确认。
- Commons 资产的署名、复用、修正、撤回和版本标记后续可以进一步结构化为 manifest 或校验器。
- Go 控制面下一轮工程建议先抽取共享 v1 contract primitives，再做 mock `ApprovalGate` 端点。

## 验证记录

- `pnpm validate:open-source`
- `pnpm check`
- `git diff --check`
