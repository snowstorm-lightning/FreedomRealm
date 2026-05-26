# ADR-0008: 跨实例通信协议兼容性

## 状态

Accepted

## 背景

FreedomRealm 允许多个 `ProjectInstance` 在授权、信任、审计和数据分级约束下协作。随着社区和二次开发增加，不同实例可能使用不同技术栈、不同插件、不同领域扩展和不同内部数据模型。如果跨实例通信直接依赖内部 API 或自由 payload，二次开发会很容易破坏互操作。

项目需要一个足够简单、稳定、可扩展的协议面，让不同实现可以通信，同时不放宽本地审批、审计、预算和数据分级。

## 决策

引入 `FederationProtocol` 作为跨实例唯一稳定通信面，包含：

- `FederationManifest`
- `FederationMessage`
- `FederationReceipt`
- 标准 messageType
- 稳定错误码
- 版本兼容规则
- namespaced extensions

跨实例互操作只依赖协议端点和消息封套，不依赖对方内部控制面 API。二次开发者可以通过 `CapabilityOffer`、JSON Schema、自定义 messageType 和 namespaced `extensions` 扩展能力，但不能改变标准 envelope 字段语义。

## 安全约束

- 跨实例通信默认拒绝，必须存在有效 `FederationLink`。
- 每条消息必须有 `messageId` 并幂等处理。
- 不支持的 `protocolVersion`、`messageType`、无效签名、撤销连接和 schema 错误必须明确拒绝。
- 高风险动作必须回到本实例 `ApprovalGate`。
- 敏感数据不得进入跨实例消息 envelope 或 payload。
- `SharedEvalSummary` 只能包含脱敏聚合指标、样本类型、失败分类和版本信息。
- 自定义扩展必须可忽略，不能成为标准消息成功处理的隐藏前提。

## 后果

### 正面

- 二次开发可以扩展能力而不破坏互操作。
- 协议面比内部 API 更稳定，降低社区协作成本。
- 消息级幂等、回执和错误码让跨实例失败更容易排查。
- Manifest 和 schema 让能力发现、版本协商和兼容测试可机械化。

### 负面

- 需要维护协议文档、schema 和互操作测试。
- 自定义扩展需要命名空间和版本纪律。
- 简化协议不能覆盖所有复杂协作，需要通过 CapabilityOffer 和后续版本演进。

## 替代方案

- 直接暴露控制面 API：实现快，但会把内部模型变成外部契约，二次开发容易破坏兼容。
- 完全自由 JSON webhook：灵活，但难以审计、测试、版本化和治理。
- 采用重型分布式协议：能力强，但会提高个人和社区采用门槛。

## 验证方式

- `federation-protocol.md` 定义最小端点、Manifest、Message、Receipt、错误码和兼容规则。
- `api-contracts.md` 暴露 Federation manifest、messages 和 receipt 端点。
- `quality-gates.md` 出现 Federation Compatibility Gate。
- `glossary.md` 出现 FederationProtocol、FederationManifest、FederationMessage 和 FederationReceipt。

