# 跨实例通信协议

## 定位

`FederationProtocol` 是不同 `ProjectInstance` 之间通信的最小稳定协议面。它只定义实例发现、授权连接、消息封套、能力请求、模板交换、脱敏评测摘要交换、回执、错误和兼容性规则。

它不暴露本地控制面内部表结构，不要求不同实例使用相同技术栈，也不允许远程实例绕过本地 `ApprovalGate`、`PolicyRule`、预算、审计或数据分级。

## 设计目标

- 简单：二次开发者只需实现少量端点和统一消息封套。
- 稳定：核心 envelope 长期兼容，破坏性变更必须升主版本。
- 可扩展：自定义能力通过 `CapabilityOffer`、schema 引用和 namespaced extensions 扩展。
- 可审计：每条消息都有 `messageId`、`correlationId`、`FederationLink`、策略、风险和审计引用。
- 可撤销：授权连接可撤销，撤销后不能继续发送新请求。
- 默认安全：默认不互信、默认不共享私有数据、默认不允许远程调用本地高风险工具。

## 最小端点

跨实例协议只要求以下稳定端点：

| 端点 | 用途 |
| --- | --- |
| `GET /.well-known/freedomrealm-instance.json` | 公开实例发现元数据，不包含私有数据 |
| `GET /api/v1/federation/manifest` | 返回实例支持的协议版本、能力、schema 和限制 |
| `POST /api/v1/federation/messages` | 接收跨实例消息 envelope |
| `GET /api/v1/federation/messages/{messageId}/receipt` | 查询消息处理回执 |
| `PATCH /api/v1/federation/links/{federationLinkId}` | 更新或撤销授权连接 |

实现可以提供更多内部 API，但跨实例互操作不得依赖未登记的私有端点。

## FederationManifest

实例发现和能力协商使用 `FederationManifest`。

最低字段：

```json
{
  "protocol": "freedomrealm-federation",
  "supportedProtocolVersions": ["1.0"],
  "projectInstanceId": "uuid",
  "instanceDisplayName": "string",
  "publicEndpoint": "https://example.org",
  "supportedMessageTypes": [
    "capability.offer.published",
    "capability.request.created",
    "capability.result.ready",
    "shared_template.import_requested",
    "shared_eval_summary.published",
    "federation.link_revoked",
    "federation.heartbeat"
  ],
  "supportedDataSharingLevels": ["none", "public_metadata", "templates_only"],
  "supportedAuthMethods": ["signed_message"],
  "schemaRefs": {
    "capability.request.created": "https://example.org/schemas/capability-request-v1.json"
  },
  "rateLimits": {
    "requestsPerMinute": 30
  },
  "contact": {
    "security": "mailto:security@example.org"
  }
}
```

Manifest 只能发布公开元数据。私有能力、内部任务、成员画像、敏感字段和原始模型上下文不得进入 Manifest。

## FederationMessage Envelope

所有跨实例消息必须使用统一 envelope。

```json
{
  "protocol": "freedomrealm-federation",
  "protocolVersion": "1.0",
  "messageId": "uuid",
  "messageType": "capability.request.created",
  "messageVersion": 1,
  "sentAt": "2026-05-10T00:00:00Z",
  "from": {
    "projectInstanceId": "uuid",
    "federationPeerId": "uuid"
  },
  "to": {
    "projectInstanceId": "uuid"
  },
  "link": {
    "federationLinkId": "uuid",
    "linkVersion": 1
  },
  "trace": {
    "correlationId": "uuid",
    "workItemId": "uuid",
    "capabilityRequestId": "uuid"
  },
  "policy": {
    "dataSharingLevel": "templates_only",
    "dataClassification": "public",
    "riskLevel": "low",
    "requiresApproval": false
  },
  "payload": {},
  "extensions": {},
  "audit": {
    "auditEventId": "uuid",
    "policyEvaluationId": "uuid",
    "approvalId": "uuid"
  },
  "signature": {
    "keyId": "string",
    "algorithm": "string",
    "value": "string"
  }
}
```

规则：

- `messageId` 必须全局唯一，接收方必须幂等处理。
- `correlationId` 用于串联请求、回调、结果和回执。
- `payload` 必须符合 `messageType + messageVersion` 对应 schema。
- `extensions` 只能放可忽略的扩展字段，必须使用反向域名或实例命名空间，例如 `org.example.review`.
- `signature` 可在轻量档位降级为开发占位，但 Community 和 Enterprise 场景必须有可验证签名或等价认证。
- envelope 中不得包含敏感原文；只能包含引用、摘要或脱敏字段。

## 标准消息类型

v1 标准消息类型：

| messageType | 方向 | 用途 |
| --- | --- | --- |
| `federation.heartbeat` | 双向 | 健康检查和版本可用性探测 |
| `federation.link_revoked` | 双向 | 通知授权撤销 |
| `capability.offer.published` | 发布方到订阅方 | 发布或更新 CapabilityOffer |
| `capability.request.created` | 请求方到提供方 | 发起 CapabilityRequest |
| `capability.result.ready` | 提供方到请求方 | 返回能力调用结果引用或失败状态 |
| `shared_template.import_requested` | 请求方到提供方 | 请求导入 SharedTemplate |
| `shared_template.published` | 提供方到请求方 | 返回可导入模板引用 |
| `shared_eval_summary.published` | 发布方到接收方 | 发布脱敏 SharedEvalSummary |

自定义消息类型必须使用命名空间前缀，例如 `org.example.custom_event.v1`，并在 `FederationManifest` 中声明 schema。接收方不认识的自定义消息类型必须拒绝或忽略，不能按成功处理。

## FederationReceipt

`POST /api/v1/federation/messages` 必须返回处理回执。

```json
{
  "data": {
    "federationReceiptId": "uuid",
    "messageId": "uuid",
    "status": "accepted",
    "receivedAt": "2026-05-10T00:00:01Z",
    "correlationId": "uuid"
  },
  "audit": {
    "auditEventId": "uuid",
    "policyEvaluationId": "uuid"
  }
}
```

`status` 使用受控枚举：

- `accepted`
- `rejected`
- `queued`
- `blocked`
- `requires_approval`
- `duplicate`

回执只表示消息接收和入队状态，不代表业务动作完成。业务完成必须通过 `capability.result.ready` 或后续状态消息表达。

## 错误码

跨实例错误码必须稳定：

| 错误码 | 含义 |
| --- | --- |
| `unsupported_protocol_version` | 协议版本不受支持 |
| `unsupported_message_type` | 消息类型不受支持 |
| `schema_invalid` | envelope 或 payload 不符合 schema |
| `signature_invalid` | 签名或认证无效 |
| `link_not_found` | FederationLink 不存在或不可见 |
| `link_revoked` | FederationLink 已撤销 |
| `policy_violation` | 策略明确拒绝 |
| `approval_required` | 需要本地 ApprovalGate |
| `data_classification_violation` | 数据分级不允许该消息 |
| `rate_limited` | 超出速率限制 |
| `replay_detected` | 重放消息被拒绝 |
| `dependency_unavailable` | 依赖暂不可用 |

错误响应不得泄漏对方无权获知的本地内部事实。

## 兼容性规则

协议版本使用 `major.minor`：

- minor 版本只能添加可选字段、可选消息类型或可忽略扩展。
- major 版本才允许破坏性变更。
- envelope 的必填字段不得在同一 major 版本内删除、重命名或改变语义。
- 枚举值可以追加，但接收方必须把未知枚举当作不支持处理，而不是默认为安全通过。
- payload schema 的新增字段默认必须可选；新增必填字段必须提升 `messageVersion` 或协议 major。
- 二次开发只能通过 namespaced `extensions`、自定义 `CapabilityOffer`、自定义 schema 和自定义 messageType 扩展，不得修改标准 envelope 语义。
- 接收方必须忽略未知 extensions，但必须拒绝未知必填 payload 字段。

## 二次开发规则

二次开发者应遵守：

- 保持 `FederationMessage` envelope 兼容，不修改标准字段含义。
- 新能力通过 `CapabilityOffer` 发布，不要求对方理解本地内部模块。
- 自定义 payload 必须提供 JSON Schema，并在 Manifest 中声明。
- 私有字段放在本地数据库，不放入跨实例消息。
- 不把本地 URL、数据库 ID 或内部队列 ID 当作跨实例稳定契约；跨实例只传不透明引用。
- 不让远程实例直接调用本地高风险工具；远程请求只能生成本地 WorkItem 或候选结果。
- 每个自定义扩展都必须有 owner、schema、版本、失败处理和撤回方式。

## 最小互操作测试

任何声称兼容 FreedomRealm FederationProtocol 的实现，至少要通过：

1. Manifest 可读取，且不泄漏私有数据。
2. 不支持的 protocolVersion 被明确拒绝。
3. 重复 messageId 被幂等处理。
4. 已撤销 FederationLink 的消息被拒绝。
5. 未知 messageType 不会被当作成功。
6. 高风险 CapabilityRequest 返回 `approval_required` 或进入本地 ApprovalGate。
7. SharedEvalSummary 不包含原始上下文或敏感字段。
8. 自定义 extensions 被忽略时，标准消息仍可处理。

