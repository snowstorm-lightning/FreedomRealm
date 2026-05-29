# Contributing to FreedomRealm

FreedomRealm welcomes code, docs, templates, eval samples, failure reports, review notes, translations, design discussions, and usage reports.

Before contributing:

1. Read `AGENTS.md`, `README.md`, `ARCHITECTURE.md`, and `docs/zh-CN/project-operating-entry.md`.
2. Check `docs/zh-CN/execution-plans/README.md` for active work.
3. Keep changes scoped to a clear `WorkItem`, issue, or execution plan.
4. Run `pnpm check` before opening a PR.

## Boundaries

Do not include:

- Secrets, tokens, cookies, private keys, local account data, or production credentials.
- Production data or sensitive raw user data.
- Real connector configuration for external agents, messaging accounts, MCP servers, skills, memory, or private tools.
- Changes that bypass `ApprovalGate`, audit, budget, data classification, `ModelRoute`, or human review.
- Automatic issue creation, PR creation, PR merge, public posting, or Commons publishing unless explicitly approved.

High-risk changes must include an execution plan and explain:

- Request and response boundaries.
- Event semantics.
- Audit points.
- Approval and rollback design.
- Validation commands.

## Contribution Types

- Code: keep modules cohesive, avoid duplicated business rules, and prefer existing local helpers.
- Docs: update the relevant `docs/zh-CN/` topic when behavior, terminology, governance, or contracts change.
- Templates: include risk level, data classification, approval status, failure handling, and evaluation samples.
- Failure cases: include reproducible inputs by reference only; redact sensitive content.
- Translations: preserve canonical terminology such as `HumanActor`, `AgentActor`, `WorkItem`, `ApprovalGate`, `ProjectInstance`, `FederationMessage`, and `ExecutionReportCard`.

## Pull Request Checklist

Every PR should answer:

- What changed?
- Which files are the intended `writeSet`?
- What validation ran?
- Does it affect `ApprovalGate`, data classification, audit, budget, model routing, Federation, or adaptive runtime?
- Does it require a docs update, ADR, or execution plan?

## Local Validation

```text
pnpm check
git diff --check
```

If Go control-plane code changed, `pnpm check` already runs Go tests and vet through `scripts/check-go.mjs`.
