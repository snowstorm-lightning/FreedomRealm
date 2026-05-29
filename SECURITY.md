# Security Policy

FreedomRealm is early-stage software. Do not use it with production secrets or production data unless a deployment plan explicitly says the path is approved.

## Report a Vulnerability

Do not open a public issue if the report includes:

- Secrets, tokens, cookies, private keys, or credentials.
- Production data or sensitive raw user data.
- Exploit details that would put users or contributors at immediate risk.
- Private external connector, messaging, MCP, skills, memory, or account configuration.

Use a private maintainer contact path when available. If no private channel is available yet, open a public issue with only a redacted summary and ask for a private disclosure channel.

## Scope

Security-sensitive areas include:

- `ApprovalGate`, audit, budget, data classification, and rollback logic.
- `ModelRoute`, LiteLLM Proxy boundaries, and model provider key handling.
- External connector profiles and external agent run requests.
- Federation protocol messages, manifests, receipts, and peer trust.
- Demo, template, and report-card paths that could accidentally expose private data.
- Workspace path guards and scripts that read or write local files.

## Safe Report Format

Include:

- A redacted summary.
- Affected files, commands, or endpoints.
- Impact and risk level.
- Reproduction steps using mock or synthetic data.
- Suggested mitigation.

Do not include unredacted secrets or private data. Use references, hashes, or synthetic examples.

## Maintainer Response

Maintainers should triage security reports, confirm scope, define a fix or mitigation, run validation, and document any required follow-up without exposing sensitive details.
