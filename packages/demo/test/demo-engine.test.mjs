import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDemoExecution, renderDeliveryReportHtml, runDemoMode } from "../src/index.mjs";
import { validateExecutionReportCard } from "../../contracts/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

test("creates repo understanding report cards through the shared demo engine", async () => {
  const execution = await createDemoExecution({
    repoRoot,
    templateId: "repo_understanding_and_work_plan",
    model: "mock",
    outputDir: "dist/test-demo-engine"
  });

  const validation = validateExecutionReportCard(execution.reportCard);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
  assert.equal(execution.reportCard.templateId, "repo_understanding_and_work_plan");
  assert.equal(execution.reportCard.extensions["ai-hrms.demo"].modelRoute.mock, true);
  assert.equal(execution.reportCard.approvalStatus, "requires_human_review");
  const workPlan = execution.reportCard.extensions["ai-hrms.workPlan"];
  assert.equal(workPlan.noWriteSideEffects, true);
  assert.equal(workPlan.reviewRequired, true);
  assert.equal(workPlan.candidateWorkItems.length, 2);
  assert.equal(workPlan.suggestedWorkShards.length, 3);
  assert.equal(workPlan.candidateWorkItems.every((item) => Array.isArray(item.suggestedWriteSet)), true);
  assert.equal(workPlan.suggestedWorkShards.some((shard) => shard.writeSet.length === 0), true);
  assert.equal(execution.reportCard.metrics.candidateWorkItemCount, 2);
  assert.equal(execution.reportCard.metrics.suggestedWorkShardCount, 3);
  assert.match(execution.markdown, /ExecutionReportCard/u);
});

test("creates external agent connector safety report cards without real external execution", async () => {
  const execution = await createDemoExecution({
    repoRoot,
    templateId: "external_agent_connector_safety_demo",
    model: "mock",
    outputDir: "dist/test-external-agent-demo"
  });

  const validation = validateExecutionReportCard(execution.reportCard);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
  assert.equal(execution.reportCard.templateId, "external_agent_connector_safety_demo");
  const externalAgent = execution.reportCard.extensions["ai-hrms.externalAgent"];
  assert.equal(externalAgent.mockOnly, true);
  assert.equal(externalAgent.realExecution, false);
  assert.equal(externalAgent.connectorCount, 2);
  assert.equal(
    externalAgent.connectors.every((connector) => connector.policyDecision === "require_approval"),
    true
  );
});

test("self-review generates a report card without modifying tracked docs", async () => {
  const readmePath = path.join(repoRoot, "README.md");
  const before = await readFile(readmePath, "utf8");
  const execution = await runDemoMode({
    repoRoot,
    templateId: "project_self_review_and_decay_prevention",
    model: "mock",
    outputDir: "dist/test-self-review"
  });
  const after = await readFile(readmePath, "utf8");

  assert.equal(after, before);
  assert.equal(execution.reportCard.templateId, "project_self_review_and_decay_prevention");
  assert.equal(validateExecutionReportCard(execution.reportCard).ok, true);
  assert.equal(execution.reportCard.status, "needs_review");
  const selfReview = execution.reportCard.extensions["ai-hrms.selfReview"];
  assert.equal(selfReview.noWriteSideEffects, true);
  assert.equal(selfReview.reviewRequired, true);
  assert.equal(selfReview.promotionPolicy, "human_owner_review_required");
  assert.equal(selfReview.mappingRules.length, 3);
  assert.equal(selfReview.mappingRules.some((rule) => rule.ruleId === "self-review-preserve-review-boundary"), true);
  assert.equal(selfReview.requiredCandidateFields.includes("suggestedReadSet"), true);
  assert.equal(selfReview.requiredCandidateFields.includes("verificationCommands"), true);
  assert.equal(selfReview.candidateWorkItems.length, 2);
  assert.equal(selfReview.candidateWorkItems.every((item) => item.status === "candidate"), true);
  assert.equal(selfReview.candidateWorkItems.every((item) => Array.isArray(item.suggestedWriteSet)), true);
  assert.equal(
    selfReview.candidateWorkItems.every((item) =>
      selfReview.requiredCandidateFields.every((field) => field in item)
    ),
    true
  );
  assert.equal(execution.reportCard.metrics.candidateWorkItemCount, 2);
  assert.match(execution.markdown, /Candidate WorkItems/u);
});

test("renders delivery-level HTML from valid JSON-first report cards", async () => {
  const execution = await createDemoExecution({
    repoRoot,
    templateId: "docs_review_and_improvement",
    model: "mock",
    outputDir: "dist/test-delivery-report"
  });
  execution.reportCard.summary = "Review <script>alert('x')</script> safely.";

  const html = renderDeliveryReportHtml({
    reportCards: [execution.reportCard],
    title: "Delivery <Report>"
  });

  assert.match(html, /AI-HRMS Delivery|Delivery &lt;Report&gt;/u);
  assert.match(html, /JSON ExecutionReportCard/u);
  assert.match(html, /Review &lt;script&gt;alert/u);
  assert.doesNotMatch(html, /<script>alert/u);
});
