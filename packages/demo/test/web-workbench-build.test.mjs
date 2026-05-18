import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
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

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function extractLocalHrefs(html) {
  return [...html.matchAll(/href="([^"]+)"/gu)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("http") && !href.startsWith("mailto:"));
}

async function assertLocalHrefTargetsExist(html, htmlRelativePath) {
  const checked = new Set();
  for (const href of extractLocalHrefs(html)) {
    const key = `${htmlRelativePath}:${href}`;
    if (checked.has(key)) {
      continue;
    }
    checked.add(key);
    await assertHrefTargetExists(href, htmlRelativePath);
  }
}

async function assertHrefTargetExists(href, htmlRelativePath) {
  const htmlPath = path.join(repoRoot, htmlRelativePath);
  const htmlDir = path.dirname(htmlPath);
  const [targetPathPart, hash] = href.split("#");
  const targetPath = targetPathPart
    ? path.resolve(htmlDir, targetPathPart)
    : htmlPath;
  assert.equal(await pathExists(targetPath), true, `Missing href target ${href} from ${htmlRelativePath}`);
  if (hash) {
    const targetHtml = await readFile(targetPath, "utf8");
    const escapedHash = hash.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    assert.match(targetHtml, new RegExp(`id="${escapedHash}"`, "u"), `Missing anchor ${hash} in ${targetPath}`);
  }
}

test("web demo builds a multi-template static workbench from shared demo data", async () => {
  const staleOutputFile = path.join(repoRoot, "dist/web/data/stale-report-card.json");
  await mkdir(path.dirname(staleOutputFile), { recursive: true });
  await writeFile(staleOutputFile, JSON.stringify({ stale: true }), "utf8");

  const result = spawnSync(process.execPath, ["apps/web/bin/build-demo.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await pathExists(staleOutputFile), false, "web demo build should remove stale data files");

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

  const learningHtml = await readFile(path.join(repoRoot, "dist/web/index.html"), "utf8");
  const html = await readFile(path.join(repoRoot, "dist/web/workbench.html"), "utf8");
  const app = await readFile(path.join(repoRoot, "dist/web/app.js"), "utf8");
  const learningApp = await readFile(path.join(repoRoot, "dist/web/learning.js"), "utf8");
  const css = await readFile(path.join(repoRoot, "dist/web/styles.css"), "utf8");
  const webBuildCli = await readFile(path.join(repoRoot, "apps/web/bin/build-demo.mjs"), "utf8");
  const webStateModule = await readFile(path.join(repoRoot, "apps/web/src/demo-state.mjs"), "utf8");
  const webPagesModule = await readFile(path.join(repoRoot, "apps/web/src/pages.mjs"), "utf8");
  const webClientScriptsModule = await readFile(path.join(repoRoot, "apps/web/src/client-scripts.mjs"), "utf8");
  const webStylesModule = await readFile(path.join(repoRoot, "apps/web/src/styles.mjs"), "utf8");
  const operatingEntry = JSON.parse(await readFile(path.join(repoRoot, "config/project-operating-entry.json"), "utf8"));
  const operatingEntryValidation = validateProjectOperatingEntry(operatingEntry);
  assert.equal(operatingEntryValidation.ok, true, JSON.stringify(operatingEntryValidation.errors, null, 2));
  const stateMatch = app.match(/^const state = (\{[\s\S]*?\});\nlet selectedTemplateId/u);
  assert.ok(stateMatch, "app.js should embed a parseable state object");
  const state = JSON.parse(stateMatch[1]);
  assert.deepEqual(state.operatingEntry, operatingEntry);
  assert.equal(validateProjectOperatingEntry(state.operatingEntry).ok, true);
  assert.equal(state.activePlans.length >= 4, true);
  const activePlanFiles = new Set(state.activePlans.map((plan) => plan.filename));
  assert.equal(activePlanFiles.has("phase-0-5-ai-hrms-repositioning.md"), true);
  assert.equal(activePlanFiles.has("phase-0-doc-foundation.md"), true);
  assert.equal(activePlanFiles.has("phase-1-environment-isolation-guard.md"), true);
  assert.equal(activePlanFiles.has("phase-1-go-control-plane-skeleton.md"), true);
  const goControlPlanePlan = state.activePlans.find(
    (plan) => plan.filename === "phase-1-go-control-plane-skeleton.md"
  );
  assert.equal(goControlPlanePlan?.status, "Active");
  assert.equal(goControlPlanePlan?.statusSource, "inferred");
  assert.equal(goControlPlanePlan?.planOnly, true);
  assert.equal(goControlPlanePlan?.humanDecisionCount, 5);
  assert.equal(goControlPlanePlan?.humanDecisionPreview.length, 5);
  assert.equal(goControlPlanePlan?.humanDecisionPreview.some((item) => /本地存储/u.test(item)), true);
  assert.match(goControlPlanePlan?.title || "", /Go Core Control Plane Skeleton/u);
  assert.match(goControlPlanePlan?.href || "", /phase-1-go-control-plane-skeleton\.md/u);
  const repositioningPlan = state.activePlans.find(
    (plan) => plan.filename === "phase-0-5-ai-hrms-repositioning.md"
  );
  assert.equal(repositioningPlan?.statusSource, "explicit");
  const decayBacklog = state.operatingEntry.extensions["ai-hrms.decayPreventionBacklog"];
  assert.ok(decayBacklog);
  assert.equal(decayBacklog.promotionPolicy, "human_owner_review_required");
  assert.equal(decayBacklog.humanApprovalRef, "user-approved-continuation-20260517");
  assert.equal(decayBacklog.autoCreateExternalIssues, false);
  const backlogCandidateIds = new Set(decayBacklog.items.map((item) => item.candidateWorkItemId));
  assert.equal(backlogCandidateIds.has("candidate-work-item-001"), true);
  assert.equal(backlogCandidateIds.has("candidate-work-item-002"), true);
  const activeDecayBacklogItem = decayBacklog.items.find((item) => item.candidateWorkItemId === "candidate-work-item-002");
  assert.equal(activeDecayBacklogItem?.formalTaskId, "p1-decay-prevention-backlog");
  assert.equal(activeDecayBacklogItem?.status, "active");
  assert.deepEqual(activeDecayBacklogItem?.sourceFindingIds, ["finding-002", "finding-003"]);
  assert.deepEqual(activeDecayBacklogItem?.sourceRecommendationIds, ["recommendation-002"]);
  assert.deepEqual(activeDecayBacklogItem?.verificationCommands, ["pnpm self-review", "pnpm check"]);
  const currentWorkbenchTask = state.operatingEntry.currentTasks.find(
    (task) => task.taskId === "p0-next-workbench-entry"
  );
  assert.ok(currentWorkbenchTask);
  assert.equal(currentWorkbenchTask.priority, "P0");
  assert.equal(currentWorkbenchTask.status, "implemented-in-repo");
  assert.deepEqual(currentWorkbenchTask.implementationRefs, ["0e0733e", "a5d5e50"]);
  assert.equal(currentWorkbenchTask.title, "项目学习系统首页与 Web Workbench 拆页落地");
  assert.deepEqual(currentWorkbenchTask.verificationCommands, ["pnpm web:demo", "pnpm check"]);
  assert.equal(currentWorkbenchTask.outputs.includes("项目学习首页"), true);
  assert.equal(currentWorkbenchTask.outputs.includes("多页面导航"), true);
  assert.equal(currentWorkbenchTask.outputs.includes("任务化学习路径"), true);
  assert.equal(currentWorkbenchTask.outputs.includes("完整工作台独立页面"), true);
  assert.equal(currentWorkbenchTask.outputs.includes("Owner Decision Queue"), true);
  assert.equal(currentWorkbenchTask.outputs.includes("Running Modes 适配说明"), true);
  assert.equal(
    currentWorkbenchTask.acceptanceCriteria.some((criterion) => /dist\/web\/index\.html.+项目学习系统首页/u.test(criterion)),
    true
  );
  assert.equal(
    currentWorkbenchTask.acceptanceCriteria.some((criterion) => /dist\/web\/workbench\.html.+完整 Web Workbench/u.test(criterion)),
    true
  );
  assert.equal(
    currentWorkbenchTask.acceptanceCriteria.some((criterion) => /清晰导航、按钮层级和页面跳转/u.test(criterion)),
    true
  );
  assert.equal(
    currentWorkbenchTask.acceptanceCriteria.some((criterion) => /active execution plans.+推断 active/u.test(criterion)),
    true
  );
  assert.deepEqual(currentWorkbenchTask.suggestedWriteSet, [
    "config/project-operating-entry.json",
    "apps/web/bin/build-demo.mjs",
    "apps/web/src",
    "apps/web/README.md",
    "README.md",
    "docs/zh-CN/project-operating-entry.md",
    "docs/zh-CN/runbooks/demo-mode.md",
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
  assert.equal(state.entryModes[0].label, "有明确目标 / I have a goal");
  assert.match(state.entryModes[0].summary, /从任务目标开始.+Start from a task goal/u);
  assert.equal(state.entryModes[0].action, "起草有边界的 WorkItem / Draft a bounded WorkItem");
  assert.equal(state.reviewPrompts.length, 4);
  assert.equal(state.reviewPrompts[0].label, "定位 / Positioning");
  assert.match(state.reviewPrompts[0].prompt, /traditional HRMS.+generic agent framework/u);
  assert.match(state.reviewPrompts[1].prompt, /ApprovalGate.+data classification/u);
  assert.match(state.reviewPrompts[2].prompt, /Owner Decision Queue/u);
  assert.match(state.reviewPrompts[3].prompt, /too dense.+too hidden/u);
  assert.equal(state.feedbackTargets.length, 4);
  assert.equal(state.feedbackTargets[0].label, "定位清晰 / Positioning clarity");
  assert.match(state.feedbackTargets[0].cue, /traditional HRMS.+generic agent framework/u);
  assert.match(state.feedbackTargets[1].cue, /ApprovalGate.+data classification/u);
  assert.match(state.feedbackTargets[2].cue, /candidate suggestions.+human decisions/u);
  assert.match(state.feedbackTargets[3].cue, /too dense.+too hidden/u);
  assert.deepEqual(state.safetyBadges, [
    "仅 mock / Mock only",
    "无真实连接器 / No real connector",
    "无生产数据 / No production data",
    "无 secret / No secret",
    "保留 ApprovalGate / ApprovalGate preserved"
  ]);
  assert.match(state.languageBoundaryNotice, /UI frame is bilingual.+canonical JSON source text/u);
  assert.equal(state.languageBoundary.length, 3);
  assert.equal(state.languageBoundary[0].label, "页面框架 / UI frame");
  assert.match(state.languageBoundary[1].detail, /canonical JSON.+no automatic translation/u);
  assert.match(state.languageBoundary[2].detail, /candidate WorkItem.+human owner review/u);
  assert.equal(state.modeCards.length, 5);
  assert.deepEqual(
    state.modeCards.map((modeCard) => modeCard.mode),
    ["Tiny Mode", "Demo Mode", "Local Mode", "Community Mode", "Enterprise Mode"]
  );
  assert.match(state.modeCards[0].boundary, /Windows personal starts/u);
  assert.match(state.modeCards[2].boundary, /cannot bypass ApprovalGate/u);
  assert.equal(state.proofStats[0].label, "理解 / Understand");
  assert.equal(state.proofStats[1].value, "5-10 分钟 / 5-10 min");
  assert.equal(state.roadmap[0].horizon, "当前 / Now");
  assert.equal(state.learningTasks.length, 3);
  assert.equal(state.learningTasks[0].id, "structure");
  assert.match(state.learningTasks[0].title, /仓库骨架/u);
  assert.equal(state.projectStructureModules.length, 5);
  assert.equal(state.projectStructureModules[0].id, "entry-docs");
  assert.match(state.projectStructureModules[1].files.join(" "), /project-operating-entry/u);
  assert.equal(state.learningPages.length, 4);
  assert.match(state.learningPages[1].href, /workbench\.html/u);
  await assertLocalHrefTargetsExist(learningHtml, "dist/web/index.html");
  await assertLocalHrefTargetsExist(html, "dist/web/workbench.html");
  for (const module of state.projectStructureModules) {
    await assertHrefTargetExists(module.href, "dist/web/index.html");
  }
  for (const page of state.learningPages) {
    await assertHrefTargetExists(page.href, "dist/web/index.html");
  }
  for (const plan of state.activePlans) {
    await assertHrefTargetExists(plan.href, "dist/web/workbench.html");
  }
  assert.equal(new Set(state.cards.map((card) => card.jsonHref)).size, state.cards.length);
  const repoWorkbenchCard = state.cards.find((card) => card.templateId === "repo_understanding_and_work_plan");
  assert.ok(repoWorkbenchCard?.workPlan);
  const promotedConnectorTask = state.operatingEntry.currentTasks.find((task) =>
    task.taskId === "p1-connector-governance-sync"
  );
  assert.equal(promotedConnectorTask?.status, "implemented-in-repo");
  assert.deepEqual(promotedConnectorTask?.implementationRefs, ["f6c3cb7", "59d2adb", "5f7cadb"]);
  assert.equal(promotedConnectorTask?.candidateOrigin?.candidateWorkItemId, "candidate-work-item-001");
  assert.deepEqual(promotedConnectorTask?.candidateOrigin?.sourceFindingIds, ["finding-001"]);
  assert.equal(
    promotedConnectorTask?.candidateOrigin?.humanApprovalRef,
    "user-approved-continuation-20260517"
  );
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
    assert.ok(card.failureSample.expectedBlockingPoint);
    assert.equal(card.failureSample.humanReviewStatus, "requires_human_owner_review");
    assert.ok(card.failureSample.reproducibleInputRefs.length > 0);
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
  assert.match(learningHtml, /AI-HRMS Project Learning System/u);
  assert.match(learningHtml, /项目学习系统 \/ Project Learning/u);
  assert.match(learningHtml, /先理解项目结构，再进入治理工作台/u);
  assert.match(learningHtml, /Learn the project structure before entering the governed workbench/u);
  assert.match(learningHtml, /学习任务 \/ Learning Tasks/u);
  assert.match(learningHtml, /先选一个目标，只看当前需要的路径/u);
  assert.match(learningHtml, /项目结构地图 \/ Project Map/u);
  assert.match(learningHtml, /页面拆分与导航 \/ Page Split and Navigation/u);
  assert.match(learningHtml, /按需展开 \/ Open only when needed/u);
  assert.match(learningHtml, /<details class="learning-disclosure">/u);
  assert.match(learningHtml, /workbench\.html#tasks/u);
  assert.match(learningHtml, /workbench\.html#reports/u);
  assert.match(learningApp, /renderLearningTasks/u);
  assert.match(learningApp, /renderProjectStructureMap/u);
  assert.match(learningApp, /renderOperatingSnapshot/u);
  assert.match(learningApp, /selectedLearningTaskId/u);
  assert.match(learningApp, /structure/u);
  assert.match(learningApp, /projectStructureModules/u);
  assert.match(webBuildCli, /from "\.\.\/src\/demo-state\.mjs"/u);
  assert.match(webBuildCli, /buildWebState/u);
  assert.match(webBuildCli, /buildLearningHtml/u);
  assert.match(webStateModule, /export function buildWebState/u);
  assert.match(webPagesModule, /export function buildLearningHtml/u);
  assert.match(webClientScriptsModule, /export function buildJs/u);
  assert.match(webStylesModule, /export const css/u);
  assert.match(html, /AI-HRMS Workbench/u);
  assert.match(html, /AI-HRMS Workbench \/ AI-HRMS 工作台/u);
  assert.match(html, /视图切换 \/ View Switch/u);
  assert.match(html, /data-workbench-view="tasks"/u);
  assert.match(html, /data-workbench-panel="reports"/u);
  for (const view of ["tasks", "reports", "docs", "decisions"]) {
    assert.match(html, new RegExp(`data-workbench-view="${view}"`, "u"));
    assert.match(html, new RegExp(`id="${view}"[\\s\\S]*?data-workbench-view="${view}"`, "u"));
  }
  for (const [panelId, panelView] of [
    ["next-workbench", "tasks"],
    ["report-workbench", "reports"],
    ["knowledge-demo", "docs"],
    ["ownerDecisionQueue", "decisions"]
  ]) {
    assert.match(html, new RegExp(`id="${panelId}"[\\s\\S]*?data-workbench-panel="${panelView}"`, "u"));
  }
  assert.match(app, /selectedWorkbenchView/u);
  assert.match(app, /renderWorkbenchView/u);
  assert.match(app, /hashForWorkbenchView/u);
  assert.match(app, /hash === "#reports" \|\| hash === "#report-workbench"/u);
  assert.match(app, /hash === "#docs" \|\| hash === "#knowledge-demo"/u);
  assert.match(app, /hash === "#decisions" \|\| hash === "#ownerDecisionQueue"/u);
  assert.match(app, /return "#tasks";/u);
  assert.match(app, /panel\.hidden = panel\.dataset\.workbenchPanel !== selectedWorkbenchView/u);
  assert.match(app, /button\.setAttribute\("aria-pressed", String\(button\.dataset\.workbenchView === selectedWorkbenchView\)\)/u);
  assert.match(app, /window\.history\.pushState/u);
  assert.match(app, /popstate/u);
  assert.match(app, /scrollIntoView/u);
  assert.match(html, /FreedomRealm \/ AI-HRMS/u);
  assert.match(html, /治理工作台 \/ Governed workbench/u);
  assert.match(html, /No live side effects/u);
  assert.match(html, /无实时副作用 \/ No live side effects/u);
  assert.match(html, /No model key, connector, HR data, external write, or hidden training resource/u);
  assert.match(html, /无模型 key、连接器、HR 数据、外部写入或隐藏训练资源/u);
  for (const readOnlyBoundary of [
    /Read-only plan entry, not automatic implementation authorization/u,
    /Candidate decisions, not automatic assignments/u,
    /Tracking only, no automatic execution/u,
    /High-risk live connector work still requires ApprovalGate/u,
    /Human owner decision and ApprovalGate are required before any live execution/u
  ]) {
    assert.match(app, readOnlyBoundary);
  }
  assert.match(html, /首屏反馈目标 \/ First-screen feedback targets/u);
  assert.match(html, /演示安全边界 \/ Demo safety boundaries/u);
  assert.match(html, /页面框架提供中英双语；报告卡正文保持 canonical JSON 原文/u);
  assert.match(html, /UI frame is bilingual; report-card body keeps canonical JSON source text/u);
  assert.match(html, /Recommended Next Action/u);
  assert.match(html, /推荐下一步 \/ Recommended Next Action/u);
  assert.match(html, /Owner decision queue/u);
  assert.match(html, /需要 owner 决策 \/ Owner decision queue/u);
  assert.match(html, /Current entry recommendation/u);
  assert.match(html, /当前入口建议 \/ Current entry recommendation/u);
  assert.match(html, /Review Prompts/u);
  assert.match(html, /修改意见入口 \/ Review Prompts/u);
  assert.match(html, /Keep feedback focused on positioning, governance, next actions, and visual load/u);
  assert.match(html, /让反馈直接落在定位、治理、下一步和页面负担上/u);
  assert.match(html, /Running Modes/u);
  assert.match(html, /运行档位 \/ Running Modes/u);
  assert.match(html, /From Windows personal trials to strong-governance organizations/u);
  assert.match(html, /从 Windows 个人试用到强治理组织/u);
  assert.match(html, /Next Workbench/u);
  assert.match(html, /下一步工作台 \/ Next Workbench/u);
  assert.match(app, /Plan entry/u);
  assert.match(app, /计划入口 \/ Plan entry/u);
  assert.match(app, /定位 \/ Positioning/u);
  assert.match(app, /In 30 seconds, is it clear this is neither traditional HRMS nor a generic agent framework/u);
  assert.match(app, /Where should ApprovalGate, data classification, audit, or rollback be clearer/u);
  assert.match(app, /Does the Owner Decision Queue clearly separate human decisions from candidate suggestions/u);
  assert.match(app, /Which information feels too dense, too light, or too hidden for useful feedback/u);
  assert.match(app, /定位清晰 \/ Positioning clarity/u);
  assert.match(app, /治理边界 \/ Governance boundary/u);
  assert.match(app, /下一步清楚 \/ Next action clarity/u);
  assert.match(app, /视觉负担 \/ Visual load/u);
  assert.match(app, /仅 mock \/ Mock only/u);
  assert.match(app, /无真实连接器 \/ No real connector/u);
  assert.match(app, /无生产数据 \/ No production data/u);
  assert.match(app, /保留 ApprovalGate \/ ApprovalGate preserved/u);
  assert.match(app, /页面框架 \/ UI frame/u);
  assert.match(app, /双语展示边界 \/ Bilingual display boundary/u);
  assert.match(app, /报告卡原文 \/ Report-card source text/u);
  assert.match(app, /不自动翻译、摘要或改写事实/u);
  assert.match(app, /no automatic translation, summarization, or fact rewriting/u);
  assert.match(app, /修改路径 \/ Change path/u);
  assert.match(app, /Tiny Mode/u);
  assert.match(app, /Demo Mode/u);
  assert.match(app, /Local Mode/u);
  assert.match(app, /Community Mode/u);
  assert.match(app, /Enterprise Mode/u);
  assert.match(app, /Windows personal starts/u);
  assert.match(app, /still cannot bypass ApprovalGate/u);
  assert.match(app, /private data is not shared by default/u);
  assert.match(app, /Human decisions/u);
  assert.match(app, /决策点 \/ Human decisions/u);
  assert.match(app, /Read-only plan entry, not automatic implementation authorization/u);
  assert.match(app, /只读计划入口，不是自动实现授权/u);
  assert.match(app, /Missing explicit status; currently inferred as active/u);
  assert.match(app, /缺少显式状态，当前按 active 推断/u);
  assert.match(app, /Owner Decision Queue/u);
  assert.match(app, /需要 owner 决策 \/ Owner Decision Queue/u);
  assert.match(app, /Candidate decisions, not automatic assignments/u);
  assert.match(app, /候选决策，不是自动分派/u);
  assert.match(app, /Refusal, delay, scope reduction, or transfer must not become a negative contribution signal/u);
  assert.match(app, /拒绝、延后、缩小范围或转交都不能成为负面贡献信号/u);
  assert.match(app, /Plan decision/u);
  assert.match(app, /计划决策 \/ Plan decision/u);
  assert.match(app, /High-risk candidate/u);
  assert.match(app, /高风险候选 \/ High-risk candidate/u);
  assert.match(app, /Requires human owner decision, ApprovalGate, secret boundary, and data lifecycle design/u);
  assert.match(app, /需要 human owner 决策、ApprovalGate、secret 边界和数据生命周期设计/u);
  assert.match(app, /Human review/u);
  assert.match(app, /人工复核 \/ Human review/u);
  assert.match(app, /This plan includes non-goals or decision boundaries/u);
  assert.match(app, /该计划包含非目标或待决策边界/u);
  assert.match(app, /phase-1-go-control-plane-skeleton\.md/u);
  assert.match(app, /Go Core Control Plane Skeleton/u);
  assert.match(html, /Knowledge Loop/u);
  assert.match(html, /知识循环 \/ Knowledge Loop/u);
  assert.match(html, /Ask Maintained Docs/u);
  assert.match(html, /询问维护文档 \/ Ask Maintained Docs/u);
  assert.match(app, /30 sec/u);
  assert.match(app, /30 秒 \/ 30 sec/u);
  assert.match(app, /5-10 min/u);
  assert.match(app, /5-10 分钟 \/ 5-10 min/u);
  assert.match(app, /project-operating-entry\.v1/u);
  assert.match(app, /p0-next-workbench-entry/u);
  assert.match(app, /p2-live-connectors/u);
  assert.match(css, /\.proof-stat \{\n  min-width: 0;\n  background: var\(--panel\);/u);
  assert.match(css, /\.proof-stat p \{\n  margin: 6px 0 0;\n  color: var\(--muted\);\n  line-height: 1\.35;\n  font-size: 12px;/u);
  assert.match(app, /Current task queue/u);
  assert.match(app, /当前任务队列 \/ Current task queue/u);
  assert.match(app, /P0 WorkItem snapshot/u);
  assert.match(app, /P0 WorkItem 快照 \/ P0 WorkItem snapshot/u);
  assert.match(app, /implemented-in-repo/u);
  assert.match(app, /implementationRefs/u);
  assert.match(app, /activeTask\.outputs \|\| \[\]\)\.slice\(0, 8\)/u);
  assert.match(app, /renderTaskMetaList\("验收 \/ Acceptance", activeTask\.acceptanceCriteria, 6\)/u);
  assert.match(app, /验收 \/ Acceptance/u);
  assert.match(app, /来源 \/ Sources/u);
  assert.match(app, /候选来源 \/ Candidate origin/u);
  assert.match(app, /candidateWorkItemId=/u);
  assert.match(app, /sourceFindingIds=/u);
  assert.match(app, /humanApprovalRef=/u);
  assert.match(app, /Decay prevention backlog/u);
  assert.match(app, /衰减预防 backlog 摘要 \/ Decay prevention backlog summary/u);
  assert.match(app, /人工复核 backlog \/ Human-reviewed backlog/u);
  assert.match(app, /Tracking only, no automatic execution/u);
  assert.match(app, /只追踪候选项，不自动执行/u);
  assert.match(app, /human_owner_review_required/u);
  assert.match(app, /autoCreateExternalIssues/u);
  assert.match(app, /does not automatically modify the repo/u);
  assert.match(app, /不会自动修改仓库/u);
  assert.match(app, /create external issues or PRs/u);
  assert.match(app, /创建外部 issue\/PR/u);
  assert.match(app, /create member obligations/u);
  assert.match(app, /给成员创造义务/u);
  assert.match(app, /High-risk live connector work still requires ApprovalGate/u);
  assert.match(app, /高风险 live connector 仍需要 ApprovalGate/u);
  assert.match(app, /candidate-work-item-002/u);
  assert.match(app, /p1-decay-prevention-backlog/u);
  assert.match(app, /finding-002/u);
  assert.match(app, /finding-003/u);
  assert.match(app, /recommendation-002/u);
  assert.match(app, /AgentWorkLease/u);
  assert.match(app, /AgentWorkLease preview/u);
  assert.match(app, /当前 shard 的 AgentWorkLease 预览 \/ AgentWorkLease preview/u);
  assert.match(app, /writeSet/u);
  assert.match(app, /subagent 不能自行扩大 writeSet/u);
  assert.match(app, /MergeGate/u);
  assert.match(app, /checkpoint/u);
  assert.match(app, /ApprovalGate/u);
  assert.match(app, /ExecutionReportCard JSON is canonical/u);
  assert.match(app, /ExecutionReportCard JSON 是 canonical 事实源/u);
  assert.match(app, /Report-card evidence strip/u);
  assert.match(app, /报告卡证据条 \/ Report-card evidence strip/u);
  assert.match(app, /Canonical JSON source/u);
  assert.match(app, /canonical JSON 来源/u);
  assert.match(app, /Eval samples/u);
  assert.match(app, /评测样本 \/ Eval samples/u);
  assert.match(app, /Failure path/u);
  assert.match(app, /失败路径 \/ Failure path/u);
  assert.match(app, /Approval \/ data boundary/u);
  assert.match(app, /审批 \/ 数据边界 \/ Approval \/ data boundary/u);
  assert.match(app, /Human decision checkpoint/u);
  assert.match(app, /人工决策 checkpoint \/ Human decision checkpoint/u);
  assert.match(app, /Owner decision/u);
  assert.match(app, /Owner 决策 \/ Owner decision/u);
  assert.match(app, /What needs a person before this moves forward/u);
  assert.match(app, /继续前需要人确认什么 \/ What needs a person before this moves forward/u);
  assert.match(app, /negative contribution signal/u);
  assert.match(app, /不能成为负面贡献信号/u);
  assert.match(app, /human-demo-owner/u);
  assert.match(app, /Candidate Next Actions/u);
  assert.match(app, /候选下一步 \/ Candidate Next Actions/u);
  assert.match(app, /Draft a bounded WorkItem/u);
  assert.match(app, /起草有边界的 WorkItem \/ Draft a bounded WorkItem/u);
  assert.match(app, /Ask maintained docs/u);
  assert.match(app, /询问维护文档 \/ Ask maintained docs/u);
  assert.match(app, /Inspect a sample proof/u);
  assert.match(app, /查看样例凭证 \/ Inspect a sample proof/u);
  assert.match(app, /Candidate WorkItems/u);
  assert.match(app, /候选 WorkItems \/ Candidate WorkItems/u);
  assert.match(app, /Candidate WorkShards/u);
  assert.match(app, /候选 WorkShards \/ Candidate WorkShards/u);
  assert.match(app, /status: /u);
  assert.match(app, /状态 \/ status: /u);
  assert.match(app, /approvalRequired=/u);
  assert.match(app, /owner: /u);
  assert.match(app, /负责人 \/ owner: /u);
  assert.match(app, /candidate shard, not assigned/u);
  assert.match(app, /候选 shard，未分派 \/ candidate shard, not assigned/u);
  assert.match(app, /Eval Sample Candidate/u);
  assert.match(app, /候选评测样本 \/ Eval Sample Candidate/u);
  assert.match(app, /Template Evaluation Samples/u);
  assert.match(app, /模板评测样本 \/ Template Evaluation Samples/u);
  assert.match(app, /阻断点 \/ block:/u);
  assert.match(app, /requires_human_owner_review/u);
  assert.match(app, /评测证据 \/ Eval evidence/u);
  assert.match(app, /评测 \/ Eval: /u);
  assert.match(app, /失败路径 \/ failure: /u);
  assert.match(app, /candidate-work-item-001/u);
  assert.match(app, /repo-work-item-001/u);
  assert.match(app, /repo-shard-product/u);
  assert.match(app, /repo_understanding_and_work_plan/u);
  assert.match(app, /knowledge_navigation_and_challenge/u);
  assert.match(app, /external_agent_connector_safety_demo/u);
  assert.match(app, /personal_work_proof/u);
  assert.match(app, /project_self_review_and_decay_prevention/u);
  assert.match(app, /Template governance badges/u);
  assert.match(app, /模板治理标记 \/ Template governance badges/u);
  assert.match(app, /Risk: /u);
  assert.match(app, /风险 \/ Risk: /u);
  assert.match(app, /Approval: /u);
  assert.match(app, /审批 \/ Approval: /u);
  assert.match(app, /Route: /u);
  assert.match(app, /路由 \/ Route: /u);
  assert.match(app, /mock route/u);
  assert.match(app, /Share: /u);
  assert.match(app, /共享 \/ Share: /u);
  assert.match(app, /private/u);
  assert.match(app, /Challenge this point/u);
  assert.match(app, /挑战此点 \/ Challenge this point/u);
});
