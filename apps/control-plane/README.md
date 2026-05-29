# FreedomRealm Control Plane

This is the first Go skeleton for the FreedomRealm Core Control Plane. It is intentionally small: the service exposes health, metadata, and mock WorkItem v1 contract endpoints, keeps non-WorkItem module handlers disabled, and uses a deterministic in-process policy kernel fake.

## Boundary

- Owns the control-plane service shape for facts, permissions, approval, audit, `ProjectInstance`, `WorkItem`, report-card, and federation gateway modules.
- Does not execute agent reasoning graphs.
- Does not call models, hold provider keys, or bypass LiteLLM Proxy / `ModelRoute`.
- Does not enable real external connectors, secrets, production data, or database writes.
- Does not replace the Rust Policy / Contract / Protocol Kernel; `internal/policy` is only a narrow fake adapter for this skeleton.

## Mock v1 Endpoints

- `GET /healthz`
- `GET /metadata`
- `POST /api/v1/work-items`
- `GET /api/v1/work-items/{workItemId}`
- `POST /api/v1/work-items/{workItemId}/transition`
- `POST /api/v1/approvals`
- `GET /api/v1/approvals/{approvalId}`
- `POST /api/v1/approvals/{approvalId}/decide`

The WorkItem endpoints validate the v1 request envelope, return `{ data, meta, audit }`, and label every response as `mockOnly`. High-risk or sensitive requests return `approval_required` with an `approval.requested` preview instead of creating a production fact.
The ApprovalGate endpoints create deterministic mock approval requests and decisions only; they do not create real approval queues, notifications, Temporal workflows, or durable facts.

Shared v1 request primitives live in `internal/contracts/v1`; route descriptors drive both HTTP registration and `/metadata` to avoid endpoint list drift.

## Commands

Run from this directory:

```text
go test ./...
go vet ./...
go run ./cmd/control-plane
```

The default address is `127.0.0.1:8080`. Override it with `FREEDOMREALM_CONTROL_PLANE_ADDR`.
