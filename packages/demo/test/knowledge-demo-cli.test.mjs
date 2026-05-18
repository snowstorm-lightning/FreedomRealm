import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateAnswerCard,
  validateDocChallengeDraft,
  validateExecutionReportCard
} from "../../contracts/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function parsePath(stdout, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = stdout.match(new RegExp(`\\[knowledge\\] ${escaped}: (.+\\.json)`, "u"));
  assert.ok(match, `stdout should include ${label} path:\n${stdout}`);
  return match[1].trim();
}

test("Knowledge Demo CLI generates AnswerCard, DocChallengeDraft, and report card", async () => {
  const outDir = `dist/test-knowledge-demo/${randomUUID()}`;
  const result = spawnSync(
    process.execPath,
    [
      "scripts/run-knowledge-demo.mjs",
      "--query",
      "AI-HRMS 下一步应该做什么？",
      "--out",
      outDir,
      "--input",
      "docs/zh-CN/capability-development-and-mvp.md",
      "--input",
      "docs/zh-CN/adoption-and-growth.md",
      "--input",
      "docs/zh-CN/roadmap.md"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const answerPath = parsePath(result.stdout, "AnswerCard");
  const draftPath = parsePath(result.stdout, "DocChallengeDraft");
  const reportPath = parsePath(result.stdout, "ExecutionReportCard");

  const answerCard = JSON.parse(await readFile(path.join(repoRoot, answerPath), "utf8"));
  const challengeDraft = JSON.parse(await readFile(path.join(repoRoot, draftPath), "utf8"));
  const reportCard = JSON.parse(await readFile(path.join(repoRoot, reportPath), "utf8"));

  assert.equal(validateAnswerCard(answerCard).ok, true);
  assert.equal(validateDocChallengeDraft(challengeDraft).ok, true);
  const reportValidation = validateExecutionReportCard(reportCard);
  assert.equal(reportValidation.ok, true, JSON.stringify(reportValidation.errors, null, 2));
  assert.equal(reportCard.templateId, "knowledge_navigation_and_challenge");
  assert.equal(reportCard.outputRefs.some((outputRef) => outputRef.kind === "AnswerCard"), true);
  assert.equal(reportCard.outputRefs.some((outputRef) => outputRef.kind === "DocChallengeDraft"), true);
  assert.equal(reportCard.extensions["ai-hrms.knowledge"].searchMode, "local-mock-semantic");
});

test("Knowledge Demo CLI falls back to mock when live model is not enabled", async () => {
  const outDir = `dist/test-knowledge-demo-live-fallback/${randomUUID()}`;
  const result = spawnSync(
    process.execPath,
    [
      "scripts/run-knowledge-demo.mjs",
      "--model",
      "live",
      "--query",
      "AI-HRMS 如何保持治理边界？",
      "--out",
      outDir,
      "--input",
      "docs/zh-CN/security-and-governance.md"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false,
      env: {
        ...process.env,
        AI_HRMS_LIVE_MODEL_ENABLED: "false"
      }
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[knowledge\] model route: mock \(mock\)/u);
  const reportPath = parsePath(result.stdout, "ExecutionReportCard");
  const reportCard = JSON.parse(await readFile(path.join(repoRoot, reportPath), "utf8"));
  const modelRoute = reportCard.extensions["ai-hrms.demo"].modelRoute;
  assert.equal(modelRoute.requested, "live");
  assert.equal(modelRoute.actual, "mock");
  assert.equal(modelRoute.mock, true);
  assert.equal(reportCard.extensions["ai-hrms.knowledge"].searchMode, "local-mock-semantic");
});

test("Knowledge Demo CLI rejects invalid option values", () => {
  for (const [argv, expectedError] of [
    [["--query"], /--query requires a value/u],
    [["--input"], /--input requires a value/u],
    [["--out", "--input"], /--out requires a value/u],
    [["--input", "../outside-knowledge-input"], /Input path must stay inside the workspace/u],
    [["--out", "../outside-knowledge-demo"], /Output path must stay inside the workspace/u],
    [["--model", "real"], /--model must be mock or live/u]
  ]) {
    const result = spawnSync(process.execPath, ["scripts/run-knowledge-demo.mjs", ...argv], {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expectedError);
  }
});
