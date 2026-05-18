import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateExecutionReportCard } from "../src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function runDemo(args = [], env = {}) {
  return spawnSync(process.execPath, ["scripts/run-demo-mode.mjs", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    env: {
      ...process.env,
      ...env
    }
  });
}

function parseGeneratedJsonPath(stdout) {
  const match = stdout.match(/\[demo\] JSON canonical source: (.+\.json)/u);
  assert.ok(match, `stdout should include generated JSON path:\n${stdout}`);
  return match[1].trim();
}

test("Demo Mode CLI generates a valid report card with reusable asset candidates", async () => {
  const outDir = `dist/test-demo-mode/${randomUUID()}`;
  const result = runDemo([
    "--model",
    "live",
    "--out",
    outDir,
    "--input",
    "docs/zh-CN/runbooks/demo-mode.md"
  ], {
    AI_HRMS_LIVE_MODEL_ENABLED: "false"
  });

  assert.equal(result.status, 0, result.stderr);
  const jsonPath = parseGeneratedJsonPath(result.stdout);
  const card = JSON.parse(await readFile(path.join(repoRoot, jsonPath), "utf8"));
  const validation = validateExecutionReportCard(card);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));

  const demo = card.extensions["ai-hrms.demo"];
  assert.equal(demo.modelRoute.requested, "live");
  assert.equal(demo.modelRoute.actual, "mock");
  assert.equal(demo.modelRoute.mock, true);
  assert.equal(demo.workItem.status, "awaiting_approval");
  assert.equal(demo.approvalGate.decision, "pending");
  assert.equal(demo.observation.status, "recorded");
  assert.equal(demo.learningArtifact.status, "candidate");
  assert.equal(demo.evalSample.status, "candidate");
  assert.equal(demo.templateEvaluationSamples.status, "candidate");
  assert.equal(demo.templateEvaluationSamples.reviewRequired, true);
  assert.equal(demo.templateEvaluationSamples.samples.length, 1);
  assert.equal(card.metrics.candidateLearningArtifactCount, 1);
  assert.equal(card.metrics.candidateEvalSampleCount, 2);
  assert.ok(card.outputRefs.some((outputRef) => outputRef.canonical === true && outputRef.path === jsonPath));
});

test("Demo Mode CLI help documents live fallback", () => {
  const result = runDemo(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /default model route is mock/u);
  assert.match(result.stdout, /falls back to mock unless AI_HRMS_LIVE_MODEL_ENABLED=true/u);
});

test("Demo Mode CLI rejects missing option values", () => {
  for (const [argv, expectedError] of [
    [["--input"], /--input requires a value/u],
    [["--out", "--model"], /--out requires a value/u],
    [["--template", "-h"], /--template requires a value/u],
    [["--input", "../outside-demo-input"], /Input path must stay inside the workspace/u],
    [["--out", "../outside-demo"], /Output path must stay inside the workspace/u]
  ]) {
    const result = runDemo(argv);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expectedError);
  }
});
