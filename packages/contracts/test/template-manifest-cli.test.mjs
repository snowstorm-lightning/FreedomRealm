import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function runTemplateValidator(templateDir) {
  return spawnSync(process.execPath, ["scripts/validate-templates.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      AI_HRMS_TEMPLATE_DIR: templateDir
    },
    shell: false
  });
}

function validTemplate(templateId) {
  return {
    templateId,
    templateVersion: "0.1.0",
    displayName: "Valid Template",
    runtimeMode: "Demo Mode",
    taskGoal: "Validate a template manifest.",
    dataClassification: "internal",
    redactionStatus: "redacted",
    sharePermission: "private",
    riskLevel: "medium",
    skillRefs: ["skill://execution-report-card.render.v1"],
    toolContracts: [
      {
        toolName: "template.read",
        description: "Read local template inputs.",
        inputSchemaRef: "schema://template.read.input.v1",
        outputSchemaRef: "schema://template.read.output.v1",
        requiredPermissions: ["repo:read"],
        riskLevel: "low",
        allowedActorTypes: ["AgentActor"],
        allowedEnvironments: ["dev", "ci"],
        autoExecute: true,
        budgetLimit: {
          currency: "token",
          amount: 100
        },
        auditTags: ["template", "demo"]
      }
    ],
    mockModel: {
      modelRouteId: "mock.template.v1",
      modelCapabilityProfileRef: "model-capability-profile://mock.template.v1",
      structuredOutputSupport: true,
      toolCallingSupport: false
    },
    failureSample: {
      failureType: "sample_failure",
      simulated: true,
      statusIfTriggered: "blocked",
      expectedBlockingPoint: "Block before treating an incomplete template as ready for Demo Mode.",
      humanReviewStatus: "requires_human_owner_review",
      reproducibleInputRefs: ["README.md"],
      recovery: "Keep the report card valid and ask the human owner to review the template."
    },
    evaluationSamples: [
      {
        sampleId: "eval.valid_template.demo.v1",
        purpose: "Verify template manifest coverage.",
        inputSummary: "A small local input set.",
        inputRefs: ["README.md"],
        dataClassification: "internal",
        purposeLimit: "Demo Mode validation and human review only.",
        retention: "local-demo-run-only",
        allowedDataSources: ["mock", "redacted", "authorized_repository_docs"],
        prohibitedDataSources: ["secret", "production_data", "real_connector_credentials"],
        expectedOutputs: ["ExecutionReportCard JSON"],
        expectedGovernance: ["Keep samples candidate-only until human review."],
        failureModeCovered: "sample_failure",
        reportCardValue: "Keeps reusable template evidence visible and mechanically checked."
      }
    ]
  };
}

test("validate-templates accepts template manifests with failure and eval coverage", async () => {
  const templateDir = path.join("dist", "test-template-validator", "valid");
  await mkdir(path.join(repoRoot, templateDir), { recursive: true });
  await writeFile(
    path.join(repoRoot, templateDir, "valid_template.json"),
    `${JSON.stringify(validTemplate("valid_template"), null, 2)}\n`,
    "utf8"
  );

  const result = runTemplateValidator(templateDir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[templates\] ok/u);
});

test("validate-templates rejects missing evaluation samples", async () => {
  const templateDir = path.join("dist", "test-template-validator", "missing-eval");
  await mkdir(path.join(repoRoot, templateDir), { recursive: true });
  const template = validTemplate("missing_eval");
  delete template.evaluationSamples;
  await writeFile(
    path.join(repoRoot, templateDir, "missing_eval.json"),
    `${JSON.stringify(template, null, 2)}\n`,
    "utf8"
  );

  const result = runTemplateValidator(templateDir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing_evaluation_samples|missing_template_field/u);
});

test("validate-templates rejects failure samples without review and reproduction evidence", async () => {
  const templateDir = path.join("dist", "test-template-validator", "missing-failure-evidence");
  await mkdir(path.join(repoRoot, templateDir), { recursive: true });
  const template = validTemplate("missing_failure_evidence");
  delete template.failureSample.expectedBlockingPoint;
  delete template.failureSample.humanReviewStatus;
  delete template.failureSample.reproducibleInputRefs;
  await writeFile(
    path.join(repoRoot, templateDir, "missing_failure_evidence.json"),
    `${JSON.stringify(template, null, 2)}\n`,
    "utf8"
  );

  const result = runTemplateValidator(templateDir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /failureSample\.expectedBlockingPoint/u);
  assert.match(result.stderr, /failureSample\.humanReviewStatus/u);
  assert.match(result.stderr, /failureSample\.reproducibleInputRefs/u);
});

test("validate-templates rejects eval samples that do not cover the failure sample", async () => {
  const templateDir = path.join("dist", "test-template-validator", "mismatch");
  await mkdir(path.join(repoRoot, templateDir), { recursive: true });
  const template = validTemplate("mismatch");
  template.evaluationSamples[0].failureModeCovered = "different_failure";
  await writeFile(
    path.join(repoRoot, templateDir, "mismatch.json"),
    `${JSON.stringify(template, null, 2)}\n`,
    "utf8"
  );

  const result = runTemplateValidator(templateDir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /evaluation_failure_mismatch/u);
});

test("validate-templates rejects unsafe evaluation sample sources", async () => {
  const templateDir = path.join("dist", "test-template-validator", "unsafe-source");
  await mkdir(path.join(repoRoot, templateDir), { recursive: true });
  const template = validTemplate("unsafe_source");
  template.runtimeMode = "Production Mode";
  template.mockModel.modelRouteId = "live.template.v1";
  template.evaluationSamples[0].allowedDataSources = ["live_model", "real_connector", "secret", "production_data"];
  template.evaluationSamples[0].prohibitedDataSources = ["secret"];
  await writeFile(
    path.join(repoRoot, templateDir, "unsafe_source.json"),
    `${JSON.stringify(template, null, 2)}\n`,
    "utf8"
  );

  const result = runTemplateValidator(templateDir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /invalid_template_runtime/u);
  assert.match(result.stderr, /mockModel\.modelRouteId must use a mock\. route/u);
  assert.match(result.stderr, /unsafe_evaluation_sample_source/u);
  assert.match(result.stderr, /missing_prohibited_data_source/u);
});

test("validate-templates rejects unsafe Demo Mode tool contracts", async () => {
  const templateDir = path.join("dist", "test-template-validator", "unsafe-tool-contract");
  await mkdir(path.join(repoRoot, templateDir), { recursive: true });
  const template = validTemplate("unsafe_tool_contract");
  template.toolContracts[0].riskLevel = "medium";
  template.toolContracts[0].autoExecute = true;
  template.toolContracts[0].allowedEnvironments = ["dev", "prod"];
  template.toolContracts[0].budgetLimit.amount = 0;
  await writeFile(
    path.join(repoRoot, templateDir, "unsafe_tool_contract.json"),
    `${JSON.stringify(template, null, 2)}\n`,
    "utf8"
  );

  const result = runTemplateValidator(templateDir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsafe_tool_contract_auto_execute/u);
  assert.match(result.stderr, /unsafe_tool_contract_environment/u);
  assert.match(result.stderr, /budgetLimit\.amount must be a positive number/u);
});
