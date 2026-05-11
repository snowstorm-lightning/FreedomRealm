import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDemoExecution } from "../src/index.mjs";
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
  assert.match(execution.markdown, /ExecutionReportCard/u);
});
