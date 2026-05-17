import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateAnswerCard,
  validateDocChallengeDraft,
  validateExecutionReportCard,
  validateProjectOperatingEntry
} from "../../contracts/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

test("web demo builds a multi-template static workbench from shared demo data", async () => {
  const result = spawnSync(process.execPath, ["apps/web/bin/build-demo.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  assert.equal(result.status, 0, result.stderr);

  const generatedJsonPaths = [...result.stdout.matchAll(/\[web\] (?:Sample|Knowledge sample) report card: (.+\.json)/gu)]
    .map((match) => match[1].trim());
  assert.equal(generatedJsonPaths.length, 10, result.stdout);

  const cards = await Promise.all(
    generatedJsonPaths.map(async (jsonPath) => JSON.parse(await readFile(path.join(repoRoot, jsonPath), "utf8")))
  );
  const templateIds = new Set(cards.map((card) => card.templateId));
  assert.equal(templateIds.has("repo_understanding_and_work_plan"), true);
  assert.equal(templateIds.has("knowledge_navigation_and_challenge"), true);
  assert.equal(templateIds.has("external_agent_connector_safety_demo"), true);
  assert.equal(templateIds.has("issue_pr_triage_and_review"), true);
  assert.equal(templateIds.has("personal_work_proof"), true);
  assert.equal(templateIds.has("project_self_review_and_decay_prevention"), true);
  assert.equal(templateIds.has("docs_review_and_improvement"), true);

  for (const card of cards) {
    const validation = validateExecutionReportCard(card);
    assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
    assert.equal(card.extensions["ai-hrms.demo"].modelRoute.mock, true);
    const canonicalReportRefs = card.outputRefs.filter(
      (outputRef) => outputRef.kind === "ExecutionReportCard" && outputRef.canonical === true
    );
    assert.equal(canonicalReportRefs.length, 1);
    assert.equal(canonicalReportRefs[0].schemaVersion, card.schemaVersion);
    assert.equal(card.extensions["ai-hrms.demo"].evalSample.status, "candidate");
    assert.equal(card.extensions["ai-hrms.demo"].evalSample.sourceTemplateId, card.templateId);
    assert.equal(card.extensions["ai-hrms.demo"].templateEvaluationSamples.source, "template.evaluationSamples");
    assert.equal(card.extensions["ai-hrms.demo"].templateEvaluationSamples.status, "candidate");
    assert.equal(card.extensions["ai-hrms.demo"].templateEvaluationSamples.reviewRequired, true);
    assert.equal(Array.isArray(card.extensions["ai-hrms.demo"].templateEvaluationSamples.samples), true);
  }

  const knowledgeCards = cards.filter((card) => card.templateId === "knowledge_navigation_and_challenge");
  assert.equal(knowledgeCards.length, 4);
  for (const card of knowledgeCards) {
    assert.equal(card.outputRefs.some((outputRef) => outputRef.kind === "AnswerCard"), true);
    assert.equal(card.outputRefs.some((outputRef) => outputRef.kind === "DocChallengeDraft"), true);
    const answerRef = card.outputRefs.find((outputRef) => outputRef.kind === "AnswerCard");
    const draftRef = card.outputRefs.find((outputRef) => outputRef.kind === "DocChallengeDraft");
    const answerCard = JSON.parse(await readFile(path.join(repoRoot, answerRef.path), "utf8"));
    const challengeDraft = JSON.parse(await readFile(path.join(repoRoot, draftRef.path), "utf8"));
    assert.equal(validateAnswerCard(answerCard).ok, true);
    assert.equal(validateDocChallengeDraft(challengeDraft).ok, true);
  }

  const html = await readFile(path.join(repoRoot, "dist/web/index.html"), "utf8");
  const app = await readFile(path.join(repoRoot, "dist/web/app.js"), "utf8");
  const operatingEntry = JSON.parse(await readFile(path.join(repoRoot, "config/project-operating-entry.json"), "utf8"));
  const operatingEntryValidation = validateProjectOperatingEntry(operatingEntry);
  assert.equal(operatingEntryValidation.ok, true, JSON.stringify(operatingEntryValidation.errors, null, 2));
  const stateMatch = app.match(/^const state = (\{[\s\S]*?\});\nlet selectedTemplateId/u);
  assert.ok(stateMatch, "app.js should embed a parseable state object");
  const state = JSON.parse(stateMatch[1]);
  assert.deepEqual(state.operatingEntry, operatingEntry);
  assert.equal(validateProjectOperatingEntry(state.operatingEntry).ok, true);
  const currentWorkbenchTask = state.operatingEntry.currentTasks.find(
    (task) => task.taskId === "p0-next-workbench-entry"
  );
  assert.ok(currentWorkbenchTask);
  assert.equal(currentWorkbenchTask.priority, "P0");
  assert.deepEqual(currentWorkbenchTask.verificationCommands, ["pnpm web:demo", "pnpm check"]);
  assert.deepEqual(currentWorkbenchTask.suggestedWriteSet, [
    "apps/web/bin/build-demo.mjs",
    "packages/demo/test/web-workbench-build.test.mjs"
  ]);
  for (const field of [
    "leaseId",
    "workItemId",
    "shardId",
    "parentShardId",
    "ownerAgentRole",
    "objective",
    "nonGoals",
    "readSet",
    "writeSet",
    "allowedToolContracts",
    "forbiddenActions",
    "dataClassification",
    "riskLevel",
    "modelRoute",
    "expectedOutputSchema",
    "checkpointPolicy",
    "verificationCommands",
    "deliverables",
    "rollbackPlan",
    "mergeGateRequirements",
    "stopConditions"
  ]) {
    assert.equal(state.operatingEntry.leaseTemplate.requiredFields.includes(field), true, field);
  }
  assert.equal(state.operatingEntry.conflictRules.defaultWriteSetPolicy, "non-overlapping");
  assert.equal(state.operatingEntry.conflictRules.rules.some((rule) => /MergeGate/u.test(rule)), true);
  assert.equal(state.operatingEntry.continuationRules.allowStopWhen.some((rule) => /ApprovalGate/u.test(rule)), true);
  assert.equal(
    state.operatingEntry.continuationRules.allowStopWhen.some((rule) => /dataClassification/u.test(rule)),
    true
  );
  assert.equal(state.operatingEntry.continuationRules.allowStopWhen.some((rule) => /writeSet/u.test(rule)), true);
  assert.equal(state.cards.length, 7);
  assert.equal(state.knowledgeExamples.length, 3);
  assert.equal(new Set(state.cards.map((card) => card.jsonHref)).size, state.cards.length);
  const repoWorkbenchCard = state.cards.find((card) => card.templateId === "repo_understanding_and_work_plan");
  assert.ok(repoWorkbenchCard?.workPlan);
  assert.equal(
    repoWorkbenchCard.workPlan.candidateWorkItems.every((item) => item.status === "candidate"),
    true
  );
  assert.equal(
    repoWorkbenchCard.workPlan.candidateWorkItems.every((item) => item.approvalRequired === true),
    true
  );
  assert.equal(
    repoWorkbenchCard.workPlan.candidateWorkItems.some((item) =>
      item.ownerActorTypes.includes("HumanActor") && item.ownerActorTypes.includes("AgentActor")
    ),
    true
  );
  for (const card of state.cards) {
    assert.match(card.jsonHref, /^\.\/data\/.+\.json$/u);
    assert.match(card.markdownHref, /^\.\/data\/.+\.md$/u);
    assert.equal(card.modelRoute.mock, true);
    assert.equal(card.humanOwnerId, "human-demo-owner");
    assert.equal(card.evalSample.status, "candidate");
    assert.equal(card.evalSample.sourceTemplateId, card.templateId);
    assert.equal(card.templateEvaluationSamples.source, "template.evaluationSamples");
    assert.equal(card.templateEvaluationSamples.reviewRequired, true);
    assert.equal(card.templateEvaluationSamples.samples.length >= 1, true);
    assert.ok(card.templateEvaluationSamples.samples[0].sampleId);
    assert.ok(card.failureSample.failureType);
    assert.ok(card.failureSample.recovery);
    assert.ok(card.dataClassification);
    assert.ok(card.redactionStatus);
    assert.ok(card.sharePermission);
  }
  for (const example of state.knowledgeExamples) {
    assert.match(example.reportCardHref, /^\.\/data\/.+\.json$/u);
    assert.match(example.answerCardHref, /^\.\/data\/.+\.json$/u);
    assert.match(example.docChallengeDraftHref, /^\.\/data\/.+\.json$/u);
  }
  assert.match(html, /AI-HRMS Workbench/u);
  assert.match(html, /FreedomRealm \/ AI-HRMS/u);
  assert.match(html, /No live side effects/u);
  assert.match(html, /No model key, connector, HR data, external write, or hidden training resource/u);
  assert.match(html, /Recommended Next Action/u);
  assert.match(html, /Next Workbench/u);
  assert.match(html, /Knowledge Loop/u);
  assert.match(html, /Ask Maintained Docs/u);
  assert.match(app, /30 sec/u);
  assert.match(app, /5-10 min/u);
  assert.match(app, /project-operating-entry\.v1/u);
  assert.match(app, /p0-next-workbench-entry/u);
  assert.match(app, /p2-live-connectors/u);
  assert.match(app, /Current task queue/u);
  assert.match(app, /Active P0 WorkItem/u);
  assert.match(app, /AgentWorkLease/u);
  assert.match(app, /AgentWorkLease preview/u);
  assert.match(app, /writeSet/u);
  assert.match(app, /subagent 不能自行扩大 writeSet/u);
  assert.match(app, /MergeGate/u);
  assert.match(app, /checkpoint/u);
  assert.match(app, /ApprovalGate/u);
  assert.match(app, /ExecutionReportCard JSON is canonical/u);
  assert.match(app, /Report-card evidence strip/u);
  assert.match(app, /Canonical JSON source/u);
  assert.match(app, /Eval samples/u);
  assert.match(app, /Failure path/u);
  assert.match(app, /Approval \/ data boundary/u);
  assert.match(app, /Human decision checkpoint/u);
  assert.match(app, /Owner decision/u);
  assert.match(app, /What needs a person before this moves forward/u);
  assert.match(app, /negative contribution signal/u);
  assert.match(app, /human-demo-owner/u);
  assert.match(app, /Candidate Next Actions/u);
  assert.match(app, /Draft a bounded WorkItem/u);
  assert.match(app, /Ask maintained docs/u);
  assert.match(app, /Inspect a sample proof/u);
  assert.match(app, /Candidate WorkItems/u);
  assert.match(app, /Candidate WorkShards/u);
  assert.match(app, /status: /u);
  assert.match(app, /approvalRequired=/u);
  assert.match(app, /owner: /u);
  assert.match(app, /candidate shard, not assigned/u);
  assert.match(app, /Eval Sample Candidate/u);
  assert.match(app, /Template Evaluation Samples/u);
  assert.match(app, /candidate-work-item-001/u);
  assert.match(app, /repo-work-item-001/u);
  assert.match(app, /repo-shard-product/u);
  assert.match(app, /repo_understanding_and_work_plan/u);
  assert.match(app, /knowledge_navigation_and_challenge/u);
  assert.match(app, /external_agent_connector_safety_demo/u);
  assert.match(app, /personal_work_proof/u);
  assert.match(app, /project_self_review_and_decay_prevention/u);
  assert.match(app, /Challenge this point/u);
});
