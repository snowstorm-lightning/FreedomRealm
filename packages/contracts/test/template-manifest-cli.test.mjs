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
      recovery: "Keep the report card valid and ask the human owner to review the template."
    },
    evaluationSamples: [
      {
        sampleId: "eval.valid_template.demo.v1",
        purpose: "Verify template manifest coverage.",
        inputSummary: "A small local input set.",
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
