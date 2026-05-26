# FreedomRealm Policy Kernel RS

This crate is an isolated Rust skeleton for FreedomRealm policy and contract checks.
It is not wired into the production control plane, JS contracts, Web UI, model
routes, external connectors, or agent runtime.

Current scope:

- typed `RiskLevel`, `DataClassification`, `ActorType`, `Environment`, and
  `PolicyDecision` enums aligned with the v1 documentation vocabulary
- `OperationContract + ExecutionContext -> PolicyEvaluation`
- simple ApprovalGate evidence validation without reducing approval to a boolean
- data-classification transition checks for downgrade/inheritance decisions
- std-only implementation with unit tests

Run tests from this directory:

```text
cargo test
```
