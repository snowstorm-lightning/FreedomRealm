# 执行计划索引

执行计划是一等资产。复杂任务在开始前进入 `active/`，完成后归档到 `completed/`。

## Active

- [active/phase-1-go-control-plane-skeleton.md](active/phase-1-go-control-plane-skeleton.md)

## Completed

- [completed/README.md](completed/README.md)
- [completed/phase-0-doc-foundation.md](completed/phase-0-doc-foundation.md)
- [completed/phase-0-5-freedomrealm-repositioning.md](completed/phase-0-5-freedomrealm-repositioning.md)
- [completed/phase-0-6-web-workbench-mvp.md](completed/phase-0-6-web-workbench-mvp.md)
- [completed/phase-1-environment-isolation-guard.md](completed/phase-1-environment-isolation-guard.md)

## 使用规则

- 计划必须包含目标、范围、产出、风险和验收。
- 若任务涉及跨上下文或高风险改动，必须先写计划再实施。
- 涉及 FreedomRealm 定义、开源策略、传播机制、社区协议、自适应运行、GovernanceBrain、模型能力治理、FederationProtocol、Federation 或质量门禁的计划必须同步检查 README、ADR、路线图和术语表。

## 计划模板

复杂计划至少包含：

- 背景和问题陈述
- 目标和非目标
- 影响范围
- 交付物
- 依赖和前置条件
- 风险与缓解措施
- 环境隔离影响
- 安全、审批、审计和回滚设计
- 评测或测试方案
- 验收标准
- 完成后的归档说明

## 状态规则

- `active/` 只存放正在执行或已批准待执行的计划。
- 已完成计划移动到 `completed/`，保留结果摘要、偏差和后续事项。
- 被取消的计划仍需记录取消原因，不能直接删除。
- 涉及 ADR 的计划完成后必须检查 ADR 是否需要新增或更新索引。
