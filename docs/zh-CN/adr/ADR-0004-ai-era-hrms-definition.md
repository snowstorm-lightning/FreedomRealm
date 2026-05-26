# ADR-0004: AI 时代 HRMS 定义

## 状态

Accepted

## 背景

项目原名 AI-HRMS，早期定义偏传统 HRMS 与企业私有化部署，强调单企业内的人力资源管理、agent-first 协作和强治理边界。该定义仍然重要，但不足以覆盖个人、开源项目、社区组织、小团队、合作社、工作室和跨实例协作场景。

AI 时代的 HRMS 不只管理传统员工、组织、考勤、档案、审批和协作内容。它还需要管理人类参与者、AI 智能体、技能、工具、任务、审批、策略、预算、审计、评测、学习沉淀、模板、实例成员和实例间协作关系。

## 决策

保留 AI-HRMS 名称，扩展 HRMS 定义。

命名部分已被 ADR-0011 取代；从当前基线起项目正式更名为 FreedomRealm。本 ADR 中关于 AI 时代 HRMS 的定义、传统 HRMS 能力保留和治理边界继续有效。

FreedomRealm 是 AI 时代的人类与智能体资源管理系统。它为个人、多人协作组织、社区、开源项目、小型工作室、合作社、企业内部团队和更复杂组织提供统一的工作执行与治理底座。

核心模型包括：

- `HumanActor`
- `AgentActor`
- `WorkItem`
- `ToolContract`
- `ApprovalGate`
- `PolicyRule`
- `Observation`
- `LearningArtifact`
- `ProjectInstance`
- `DomainWorkflow`

标准化工作可以在明确约束下由 AI 执行，由人类设定目标、定义边界、审批高风险动作、审查结果和承担最终责任。

## 后果

### 正面

- 更适合开源传播。
- 更适合个人和社区使用。
- 保留传统 HRMS 场景，同时扩展到 AI 时代的人类与智能体资源治理。
- 为 Demo Mode、Adaptive Runtime、ProjectInstance 和 Federation 建立共同语言。

### 负面

- 文档需要同步更新 README、业务蓝图、架构蓝图、路线图、术语表和质量门禁。
- 需要持续防止项目被误解为泛泛 agent framework。
- 需要更清晰地区分个人/社区优先和 Enterprise Mode 的强治理形态。

## 替代方案

- 继续仅做企业 HRMS：边界清晰，但传播和社区适应性不足。
- 立即更名为通用 Work OS：可能稀释 HRMS 根基；后续正式更名为 FreedomRealm 由 ADR-0011 记录。
- 做普通 agent framework：弱化人类责任、审批、审计、评测和 HRMS 约束。
- 做完整分布式自治网络：复杂度过高，v1 不承诺。

## 验证方式

- README 清楚解释 AI 时代 HRMS。
- roadmap 出现 Demo Mode 和 Adaptive Runtime。
- business-blueprint 出现 ProjectInstance。
- architecture-blueprint 出现 Adaptive Runtime Layer。
- 新增 open-source-strategy、adoption-and-growth、community-network、adaptive-runtime 和 community-governance 文档。
