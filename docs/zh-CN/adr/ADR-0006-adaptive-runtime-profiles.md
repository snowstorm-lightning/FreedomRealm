# ADR-0006: 自适应运行档位

## 状态

Accepted

## 背景

AI-HRMS 面向个人、社区、小团队和企业。不同用户的设备、预算、网络、模型可用性和治理要求不同。如果系统只按 Enterprise Mode 设计，首次试用和个人长期使用门槛会过高；如果只按轻量 demo 设计，又会削弱审批、审计、评测和环境隔离。

## 决策

引入五种运行档位：

- `Tiny Mode`
- `Demo Mode`
- `Local Mode`
- `Community Mode`
- `Enterprise Mode`

引入 `ResourceProfile`、`AdaptiveRuntimePolicy`、`Adaptive Model Router` 和 `Adaptive Task Scheduler`。

自适应运行用于选择本地模型、远程模型、mock 模型或人工接管，控制 embedding、长期记忆、观测、并发、预算和任务拆分。

## 安全约束

- 自适应降级不能绕过 ApprovalGate。
- 自适应降级不能绕过安全治理、审计、预算和数据分级。
- 高风险动作必须回到本实例 ApprovalGate。
- 敏感数据不得因为本地资源不足自动发送到远程模型。
- Enterprise Mode 保留 Keycloak、Temporal、PostgreSQL、LiteLLM Proxy、OpenTelemetry、Grafana/Loki/Tempo/Langfuse、环境隔离、备份恢复和完整审计。

## 后果

### 正面

- 降低首次试用门槛。
- 允许个人和社区逐步采用。
- 保留企业强治理架构。
- 为 Demo Mode 和最小可传播闭环提供基础。

### 负面

- 需要维护不同档位的清晰边界。
- 需要避免轻量模式被误用于高风险生产场景。
- 需要评测低资源降级成功率、人工接管率和预算命中率。

## 替代方案

- 只支持 Enterprise Mode：安全边界清晰，但传播和个人采用门槛过高。
- 只支持轻量本地模式：易试用，但治理能力不足。
- 由用户手动配置所有组件：灵活但难以形成可靠 Demo 和质量门禁。

## 验证方式

- adaptive-runtime 文档定义五种运行档位。
- architecture-blueprint 出现 Adaptive Runtime Layer、Resource Profile Detector、Adaptive Model Router 和 Adaptive Task Scheduler。
- quality-gates 出现 Adaptive runtime gate。
- roadmap Phase 0.5 和 Phase 1 包含 AdaptiveRuntimePolicy。
