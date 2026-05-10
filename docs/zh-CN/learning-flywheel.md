# 学习与自进化飞轮

## 原则

AI-HRMS 允许系统学习，但不允许系统未经约束地自我改写生产行为。v1 的自我进化范围仅限于：

- 提示词优化候选
- 工作流分支优化候选
- 工具选择策略候选
- 知识摘要与记忆组织候选
- 人机协作模板候选
- Workflow Template、Skill Recipe、ToolContract 的改进候选
- Failure case、Review note 和脱敏 SharedEvalSummary 的沉淀

## 受控飞轮

```mermaid
flowchart LR
    A[运行轨迹采集] --> B[样本整理与打分]
    B --> C[生成候选 Prompt or Workflow]
    C --> D[沙盒评测]
    D --> E[人工审批]
    E --> F[灰度发布]
    F --> G[监控与回滚]
    G --> H[复盘沉淀]
    H --> B
```

## 阶段说明

### 1. 运行轨迹采集

- 收集 `Observation`
- 收集用户反馈、审批结果、失败案例
- 收集 token、延迟、工具调用和预算消耗
- 收集策略判断、审批命中、人工修改差异和回滚事件
- 收集样本时必须保留环境标签、数据分级和来源引用
- 收集 ProjectInstance、运行档位、资源降级、人工接管和 ExecutionReportCard 引用

### 2. 样本整理与打分

- 形成数据集切片
- 标记成功、失败、拒绝、升级和人工修正样本
- 为候选变更指定业务指标和质量指标
- 删除或脱敏不必要的个人敏感信息
- 将样本绑定到固定数据集版本，避免评测漂移
- 公开或跨实例共享时只能生成 SharedEvalSummary，不得共享原始上下文、内部任务或敏感字段

### 3. 生成候选

- 生成新的 prompt、graph 分支或策略参数
- 给出变更假设和预期收益
- 绑定风险等级和适用范围
- 声明候选变更的 owner、影响范围、回滚方式和不适用场景
- 不允许候选变更直接覆盖生产配置

### 4. 沙盒评测

- 通过固定样本集进行回放
- 检查任务成功率、工具合规率、审批触发率、成本和延迟
- 对比基线版本
- 输出按样本切片拆分的差异报告
- 对高风险样本进行人工复核或规则复核

### 5. 人工审批

- 查看评测结果、差异说明和风险标签
- 决定批准、拒绝、修改后批准或升级审查
- 审批必须引用评测运行、候选版本、风险等级和回滚方案

### 6. 灰度发布

- 控制目标人群、部门或工作流百分比
- 持续观察指标和异常
- 灰度范围必须可收缩，且不能跳过 staging
- 每次扩大灰度前必须检查治理指标和成本指标

### 7. 回滚与复盘

- 达到阈值立即回滚
- 将问题样本沉淀到数据集
- 更新策略规则或评测覆盖
- 复盘必须记录根因、漏测样本类型和后续防护规则

## LearningArtifact 元数据

每个学习沉淀物至少包含：

- `artifactId`
- `artifactType`：`prompt`、`workflow_branch`、`tool_policy`、`knowledge_summary`、`collaboration_template`
- `sourceRefs`：WorkItem、AgentRun、Observation、审批或评测引用
- `projectInstanceId`
- `dataClassification`
- `owner`
- `createdAt`
- `applicableScopes`
- `riskLevel`
- `baselineVersion`
- `candidateVersion`
- `rollbackRef`
- `shareScope`：`private`、`instance`、`commons_candidate`、`public`

没有来源引用、数据等级或适用范围的 LearningArtifact 不能进入评测。

## Experiment 生命周期

| 状态 | 含义 | 退出条件 |
| --- | --- | --- |
| `draft` | 候选变更和假设尚未完整 | 补齐 owner、指标、样本和风险 |
| `ready` | 可运行评测 | 固定数据集和评分器版本 |
| `running` | 正在离线评测或流程回放 | 产生评测结果 |
| `reviewing` | 等待人工审查 | 审批决定 |
| `approved` | 可进入灰度 | 发布计划和回滚方案确认 |
| `rejected` | 候选被拒绝 | 记录原因并沉淀样本 |
| `rolled_back` | 灰度或生产回滚 | 复盘完成 |

## v1 明确禁止

- 智能体直接修改生产代码并自动上线
- 智能体绕过审批变更预算、策略或权限
- 仅凭单次成功样本就替换生产策略

## 评测核心指标

- 任务完成率
- 人工修正率
- 审批命中率
- 策略违规率
- 平均成本
- P95 延迟
- 回滚频次

## 发布门槛

- 治理指标不得劣化，尤其是审批漏触发率和策略违规率。
- 高风险流程必须达到审批漏触发零容忍目标。
- 成本或延迟增加必须有业务指标收益支撑，并经审批确认。
- 人工修正率上升必须阻断生产发布，除非审批人明确接受该风险。
- 任何影响 `prod` 的学习结果都必须遵守 [environment-isolation.md](environment-isolation.md) 的晋级路径。
