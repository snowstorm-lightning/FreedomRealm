import test from "node:test";
import assert from "node:assert/strict";
import {
  EXECUTION_REPORT_CARD_REQUIRED_FIELDS,
  EXECUTION_REPORT_CARD_SCHEMA_VERSION,
  renderExecutionReportCardMarkdown,
  validateExecutionReportCard
} from "../src/index.mjs";

function validCard() {
  return {
    reportCardId: "report-demo-001",
    schemaVersion: EXECUTION_REPORT_CARD_SCHEMA_VERSION,
    generatedAt: "2026-05-10T00:00:00.000Z",
    projectInstanceId: "project-demo-001",
    workItemId: "work-demo-001",
    agentRunId: "run-demo-001",
    templateId: "docs_review_and_improvement",
    templateVersion: "0.1.0",
    taskGoal: "Review selected docs and suggest MVP improvements.",
    inputRefs: [],
    outputRefs: [],
    agentActorId: "agent-demo-docs-reviewer",
    humanOwnerId: "human-demo-owner",
    skillRefs: [],
    toolContractRefs: [],
    riskLevel: "medium",
    approvalStatus: "requires_human_review",
    auditRefs: [],
    dataClassification: "internal",
    redactionStatus: "redacted",
    sharePermission: "private",
    status: "needs_review",
    summary: "Mock summary.",
    findings: [{ title: "Finding", detail: "Detail" }],
    recommendations: [{ title: "Recommendation", detail: "Detail" }],
    nextActions: [{ action: "Review", status: "pending" }],
    metrics: {},
    failure: null,
    extensions: {
      "ai-hrms.demo": {
        modelRoute: { actual: "mock", mock: true }
      }
    }
  };
}

test("validates the full ExecutionReportCard v1 field skeleton", () => {
  const card = validCard();
  const result = validateExecutionReportCard(card);
  assert.equal(result.ok, true);
  for (const field of EXECUTION_REPORT_CARD_REQUIRED_FIELDS) {
    assert.equal(field in card, true);
  }
});

test("rejects missing schemaVersion", () => {
  const card = validCard();
  delete card.schemaVersion;
  const result = validateExecutionReportCard(card);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.path === "schemaVersion"), true);
});

test("rejects non-namespaced extension keys", () => {
  const card = validCard();
  card.extensions.demo = {};
  const result = validateExecutionReportCard(card);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "invalid_extension_namespace"), true);
});

test("rejects invalid report-card data classification", () => {
  const card = validCard();
  card.dataClassification = "secret";
  const result = validateExecutionReportCard(card);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "invalid_data_classification"), true);
});

test("rejects invalid report-card timestamp, risk, approval, and status", () => {
  const card = validCard();
  card.generatedAt = "not-a-date";
  card.riskLevel = "severe";
  card.approvalStatus = "auto_approved";
  card.status = "published";

  const result = validateExecutionReportCard(card);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.path === "generatedAt"), true);
  assert.equal(result.errors.some((error) => error.code === "invalid_risk_level"), true);
  assert.equal(result.errors.some((error) => error.code === "invalid_approval_status"), true);
  assert.equal(result.errors.some((error) => error.code === "invalid_report_status"), true);
});

test("renders Markdown from the JSON report card", () => {
  const markdown = renderExecutionReportCardMarkdown(validCard());
  assert.match(markdown, /# ExecutionReportCard/u);
  assert.match(markdown, /docs_review_and_improvement@0\.1\.0/u);
  assert.match(markdown, /mock/u);
});

test("renders governed failure sample evidence in Markdown", () => {
  const card = validCard();
  card.failure = {
    sample: {
      failureType: "sample_failure",
      simulated: true,
      statusIfTriggered: "blocked",
      expectedBlockingPoint: "Block before unsafe side effects.",
      humanReviewStatus: "requires_human_owner_review",
      reproducibleInputRefs: ["README.md", "docs/zh-CN/quality-gates.md"],
      recovery: "Keep the report card in review."
    }
  };

  const markdown = renderExecutionReportCardMarkdown(card);
  assert.match(markdown, /Expected blocking point: Block before unsafe side effects\./u);
  assert.match(markdown, /Human review: requires_human_owner_review/u);
  assert.match(markdown, /Reproducible input refs: README\.md, docs\/zh-CN\/quality-gates\.md/u);
});
