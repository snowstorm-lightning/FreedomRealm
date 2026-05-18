import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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

test("surfaces template evaluation samples in demo report-card extensions", async () => {
  const tempRepoRoot = path.join(repoRoot, "dist", "test-template-evaluation-samples", randomUUID());
  const templateId = "template_eval_samples_demo";
  await mkdir(path.join(tempRepoRoot, "config", "templates"), { recursive: true });
  await writeFile(path.join(tempRepoRoot, "README.md"), "# Temp Demo\n\nLocal input only.\n", "utf8");
  await writeFile(
    path.join(tempRepoRoot, "config", "templates", `${templateId}.json`),
    `${JSON.stringify(
      {
        templateId,
        templateVersion: "0.1.0",
        displayName: "Template Eval Samples Demo",
        runtimeMode: "Demo Mode",
        taskGoal: "Surface template-authored evaluation samples in the generated report card.",
        dataClassification: "internal",
        redactionStatus: "redacted",
        sharePermission: "private",
        riskLevel: "medium",
        skillRefs: ["skill://execution-report-card.render.v1"],
        toolContracts: [
          {
            toolName: "template_eval.read_local_files",
            description: "Read local files for a template evaluation samples demo.",
            inputSchemaRef: "schema://ai-hrms.demo.template-eval.read.input.v1",
            outputSchemaRef: "schema://ai-hrms.demo.template-eval.read.output.v1",
            requiredPermissions: ["repo:read"],
            riskLevel: "low",
            allowedActorTypes: ["AgentActor"],
            allowedEnvironments: ["dev", "ci"],
            autoExecute: true,
            budgetLimit: {
              currency: "token",
              amount: 100
            },
            auditTags: ["demo", "eval-sample"]
          }
        ],
        mockModel: {
          modelRouteId: "mock.template-eval-samples.v1",
          modelCapabilityProfileRef: "model-capability-profile://mock.template-eval-samples.v1",
          structuredOutputSupport: true,
          toolCallingSupport: false
        },
        failureSample: {
          failureType: "template_eval_sample_missing",
          simulated: true,
          statusIfTriggered: "blocked",
          expectedBlockingPoint: "Block before hiding missing evaluation sample coverage.",
          humanReviewStatus: "requires_human_owner_review",
          reproducibleInputRefs: ["README.md"],
          recovery: "Keep the generated report card valid and ask the template owner to review sample coverage."
        },
        evaluationSamples: [
          {
            sampleId: "template-eval-sample-001",
            purpose: "Verify surfaced template samples.",
            inputSummary: "Temporary local README input for a deterministic Demo Mode report card.",
            inputRefs: ["README.md"],
            dataClassification: "internal",
            purposeLimit: "Demo Mode validation and human review only.",
            retention: "local-demo-run-only",
            allowedDataSources: ["mock", "redacted", "authorized_repository_docs"],
            prohibitedDataSources: ["secret", "production_data", "real_connector_credentials"],
            expectedOutputs: ["ExecutionReportCard JSON"],
            expectedGovernance: [
              "Keep samples as candidate review material",
              "Require human review before training, sharing, or production use"
            ],
            failureModeCovered: "template_eval_sample_missing",
            reportCardValue:
              "Confirms template-authored evaluation samples remain visible in the canonical report-card JSON."
          }
        ]
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const execution = await createDemoExecution({
    repoRoot: tempRepoRoot,
    templateId,
    model: "mock",
    inputs: ["README.md"],
    outputDir: "dist/report-cards"
  });

  const validation = validateExecutionReportCard(execution.reportCard);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
  const templateEvaluationSamples = execution.reportCard.extensions["ai-hrms.demo"].templateEvaluationSamples;
  assert.equal(templateEvaluationSamples.source, "template.evaluationSamples");
  assert.equal(templateEvaluationSamples.status, "candidate");
  assert.equal(templateEvaluationSamples.reviewRequired, true);
  assert.equal(templateEvaluationSamples.jsonFirst, true);
  assert.equal(templateEvaluationSamples.samples.length, 1);
  assert.equal(templateEvaluationSamples.samples[0].sampleId, "template-eval-sample-001");
  assert.deepEqual(templateEvaluationSamples.samples[0].inputRefs, ["README.md"]);
  assert.equal(templateEvaluationSamples.samples[0].dataClassification, "internal");
  assert.equal(templateEvaluationSamples.samples[0].retention, "local-demo-run-only");
  assert.equal(execution.reportCard.failure.sample.expectedBlockingPoint, "Block before hiding missing evaluation sample coverage.");
  assert.equal(execution.reportCard.failure.sample.humanReviewStatus, "requires_human_owner_review");
  assert.deepEqual(execution.reportCard.failure.sample.reproducibleInputRefs, ["README.md"]);
  assert.equal(execution.reportCard.metrics.candidateEvalSampleCount, 2);
});

test("first visible templates declare evaluation samples with failure coverage", async () => {
  const templateDir = path.join(repoRoot, "config", "templates");
  const templateFiles = (await readdir(templateDir)).filter((file) => file.endsWith(".json"));
  assert.equal(templateFiles.length, 7);

  for (const templateFile of templateFiles) {
    const template = JSON.parse(await readFile(path.join(templateDir, templateFile), "utf8"));
    assert.equal(Array.isArray(template.evaluationSamples), true, templateFile);
    assert.equal(template.evaluationSamples.length >= 1, true, templateFile);
    for (const field of ["expectedBlockingPoint", "humanReviewStatus", "reproducibleInputRefs"]) {
      assert.equal(field in template.failureSample, true, `${templateFile} failureSample missing ${field}`);
    }
    assert.equal(template.failureSample.humanReviewStatus, "requires_human_owner_review", templateFile);
    assert.equal(Array.isArray(template.failureSample.reproducibleInputRefs), true, templateFile);
    for (const sample of template.evaluationSamples) {
      for (const field of [
        "sampleId",
        "purpose",
        "inputSummary",
        "inputRefs",
        "dataClassification",
        "purposeLimit",
        "retention",
        "allowedDataSources",
        "prohibitedDataSources",
        "expectedOutputs",
        "expectedGovernance",
        "failureModeCovered",
        "reportCardValue"
      ]) {
        assert.equal(field in sample, true, `${templateFile} missing ${field}`);
      }
      assert.equal(Array.isArray(sample.inputRefs), true, `${templateFile} inputRefs`);
      assert.equal(sample.dataClassification, template.dataClassification, `${templateFile} dataClassification`);
      assert.equal(sample.retention, "local-demo-run-only", `${templateFile} retention`);
      assert.equal(sample.prohibitedDataSources.includes("secret"), true, `${templateFile} prohibits secret`);
      assert.equal(sample.prohibitedDataSources.includes("production_data"), true, `${templateFile} prohibits production_data`);
      assert.equal(
        sample.prohibitedDataSources.includes("real_connector_credentials"),
        true,
        `${templateFile} prohibits real connector credentials`
      );
      assert.equal(Array.isArray(sample.expectedOutputs), true, `${templateFile} expectedOutputs`);
      assert.equal(Array.isArray(sample.expectedGovernance), true, `${templateFile} expectedGovernance`);
      assert.equal(sample.failureModeCovered, template.failureSample.failureType, templateFile);
    }
  }
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
  const olderCard = structuredClone(execution.reportCard);
  olderCard.reportCardId = "report-delivery-older";
  olderCard.generatedAt = "2026-05-17T09:00:00.000Z";
  olderCard.taskGoal = "Older delivery card";
  const newerCard = structuredClone(execution.reportCard);
  newerCard.reportCardId = "report-delivery-newer";
  newerCard.generatedAt = "2026-05-17T10:00:00.000Z";
  newerCard.taskGoal = "Newer delivery card";

  const html = renderDeliveryReportHtml({
    reportCards: [olderCard, newerCard],
    title: "Delivery <Report>"
  });

  assert.match(html, /AI-HRMS Delivery|Delivery &lt;Report&gt;/u);
  assert.match(html, /sorted newest first/u);
  assert.equal(html.indexOf("Newer delivery card") < html.indexOf("Older delivery card"), true);
  assert.match(html, /JSON ExecutionReportCard/u);
  assert.match(html, /Canonical JSON/u);
  assert.match(html, /Eval samples/u);
  assert.match(html, /Failure path/u);
  assert.match(html, /Failure Path Sample/u);
  assert.match(html, /requires_human_owner_review/u);
  assert.match(html, /Block before any maintained document edit/u);
  assert.match(html, /Human decision checkpoint/u);
  assert.match(html, /Owner decision/u);
  assert.match(html, /What needs a person before this moves forward/u);
  assert.match(html, /negative contribution signal/u);
  assert.match(html, /human-demo-owner/u);
  assert.match(html, /Template Evaluation Samples/u);
  assert.match(html, /reviewRequired=true/u);
  assert.match(html, /Review &lt;script&gt;alert/u);
  assert.doesNotMatch(html, /<script>alert/u);
});

test("report HTML CLI renders generated JSON report cards", async () => {
  const outputRoot = path.join("dist", "test-delivery-report-cli", randomUUID());
  const cardDir = path.join(outputRoot, "cards");
  const htmlPath = path.join(outputRoot, "delivery.html");
  await runDemoMode({
    repoRoot,
    templateId: "docs_review_and_improvement",
    model: "mock",
    outputDir: cardDir
  });

  const result = spawnSync(
    process.execPath,
    [
      "scripts/render-delivery-report-html.mjs",
      "--input",
      cardDir,
      "--out",
      htmlPath,
      "--title",
      "CLI <Report>"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[report:html\] ok/u);
  assert.match(result.stdout, /\[report:html\] Report cards: 1/u);
  assert.match(result.stdout, /HTML render:/u);
  const html = await readFile(path.join(repoRoot, htmlPath), "utf8");
  assert.match(html, /CLI &lt;Report&gt;/u);
  assert.match(html, /JSON ExecutionReportCard/u);
  assert.match(html, /Failure Path Sample/u);
  assert.match(html, /Human decision checkpoint/u);
  assert.match(html, /Template Evaluation Samples/u);
  assert.match(html, /requires_human_owner_review/u);
});

test("report HTML CLI help documents explicit input behavior", () => {
  const result = spawnSync(process.execPath, ["scripts/render-delivery-report-html.mjs", "--help"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Without --input, the default inputs/u);
  assert.match(result.stdout, /only the explicit input paths are collected/u);
});

test("report HTML CLI rejects missing explicit input paths", () => {
  const missingInput = `dist/missing-report-html-input/${randomUUID()}`;
  const result = spawnSync(process.execPath, ["scripts/render-delivery-report-html.mjs", "--input", missingInput], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Input path does not exist/u);
});

test("report HTML CLI rejects invalid option values", () => {
  for (const [argv, expectedError] of [
    [["--input"], /--input requires a value/u],
    [["--out"], /--out requires a value/u],
    [["--title"], /--title requires a value/u],
    [["--title", "--input"], /--title requires a value/u],
    [["--unknown"], /Unknown argument: --unknown/u]
  ]) {
    const result = spawnSync(process.execPath, ["scripts/render-delivery-report-html.mjs", ...argv], {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expectedError);
  }
});

test("self-review CLI rejects option-shaped values", () => {
  for (const [argv, expectedError] of [
    [["--input", "--out"], /--input requires a value/u],
    [["--out", "-h"], /--out requires a value/u],
    [["--input", "../outside-self-review-input"], /Input path must stay inside the workspace/u],
    [["--out", "../outside-self-review"], /Output path must stay inside the workspace/u],
    [["--unknown"], /Unknown argument: --unknown/u]
  ]) {
    const result = spawnSync(process.execPath, ["scripts/run-self-review.mjs", ...argv], {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expectedError);
  }
});

test("report HTML CLI keeps input and output paths inside the workspace", () => {
  for (const [argv, expectedError] of [
    [["--input", "../outside-report-cards"], /Input path must stay inside the workspace/u],
    [["--out", "../outside-delivery.html"], /Output path must stay inside the workspace/u]
  ]) {
    const result = spawnSync(process.execPath, ["scripts/render-delivery-report-html.mjs", ...argv], {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expectedError);
  }
});
