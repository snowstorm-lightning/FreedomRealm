# ADR-0007: 治理型 AI 中枢

## 状态

Accepted

## 背景

AI-HRMS 的文档、治理、评测、运行档位、社区协作和传统 HRMS 边界持续扩展后，仅靠个人阅读文档很难长期吸收和贯通。项目需要一个能陪伴 `ProjectInstance` 演化的 AI 中枢，帮助成员理解当前基线、拆解任务、协调多人开发、沉淀失败样本并提出受控改进候选。

同时，不同模型在推理、编码、长上下文、结构化输出、工具调用、稳定性、成本和安全能力上差异明显。如果只按模型名称或供应商选择模型，容易出现低能力模型处理高风险任务、强模型绕过数据分级或模型升级没有评测的问题。

## 决策

引入 `GovernanceBrain` 作为 `ProjectInstance` 内的治理型 AI 中枢。它负责项目上下文图谱、智能分派建议、多人协调建议、模型能力治理建议和受控自我迭代候选。

引入：

- `MemberCapabilityProfile`
- `TaskFitAssessment`
- `ModelCapabilityProfile`

`GovernanceBrain` 只能生成建议、候选、冲突报告和审计记录。所有高风险动作仍必须经过 `ApprovalGate`。所有影响生产的学习结果、模型路由、策略、权限或预算变更仍必须经过评测、审批、灰度和回滚。

## 安全约束

- GovernanceBrain 不能替代人类 owner。
- GovernanceBrain 不能自动批准高风险动作。
- TaskFitAssessment 只能作为分派建议，不能扩大成员权限或数据可见范围。
- ModelCapabilityProfile 只能作为模型路由和评测输入，不能放宽审批、权限、预算、审计或数据分级。
- 生产 ModelRoute 必须绑定 ModelCapabilityProfile、EvalRun、适用任务类型、数据分级、风险等级和回退策略。
- 项目上下文图谱必须保留来源、版本、环境、数据分级、可信度和失效条件。
- 公开或跨实例共享只能使用 SharedTemplate 或 SharedEvalSummary。

## 后果

### 正面

- 降低大型项目的理解成本。
- 支持按成员能力、兴趣、负载、权限和风险责任进行智能分派。
- 让多人开发、AI contributor 和人类 owner 的责任链更清晰。
- 将模型能力差异纳入评测和路由，而不是凭模型名决策。
- 为后续学习飞轮和社区协作提供可审计上下文。

### 负面

- 新增治理对象和评测维度，提高文档和实现复杂度。
- 成员画像需要隐私和可见范围控制。
- 模型能力画像需要持续评测和失效管理。
- 如果 UI 设计不当，可能造成审批疲劳或让用户误以为 AI 拥有最终决定权。

## 替代方案

- 只做文档问答助手：实现简单，但不能解决任务分派、多人协作和自我迭代治理。
- 让 AgentActor 直接承担项目大脑角色：短期灵活，但容易模糊执行者、治理者和审批责任边界。
- 只依赖强模型：能提升部分输出质量，但无法解决来源、权限、成本、数据分级、评测和回滚问题。

## 验证方式

- `governance-ai-brain.md` 定义 GovernanceBrain、智能分派和模型能力治理。
- `business-blueprint.md` 出现 GovernanceBrain、MemberCapabilityProfile、TaskFitAssessment 和 ModelCapabilityProfile。
- `api-contracts.md` 出现 Governance Brain API、模型能力画像接口和事件。
- `quality-gates.md` 出现 GovernanceBrain Gate 和 Model Capability Gate。
- `evals/baseline-v1.md` 覆盖智能分派、项目基线解释和模型能力路由评测。

