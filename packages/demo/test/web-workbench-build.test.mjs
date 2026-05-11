import test from "node:test";
import assert from "node:assert/strict";
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

test("web demo builds a multi-template static workbench from shared demo data", async () => {
  const result = spawnSync(process.execPath, ["apps/web/bin/build-demo.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  assert.equal(result.status, 0, result.stderr);

  const generatedJsonPaths = [...result.stdout.matchAll(/\[web\] (?:Sample|Knowledge sample) report card: (.+\.json)/gu)]
    .map((match) => match[1].trim());
  assert.equal(generatedJsonPaths.length, 8, result.stdout);

  const cards = await Promise.all(
    generatedJsonPaths.map(async (jsonPath) => JSON.parse(await readFile(path.join(repoRoot, jsonPath), "utf8")))
  );
  const templateIds = new Set(cards.map((card) => card.templateId));
  assert.equal(templateIds.has("repo_understanding_and_work_plan"), true);
  assert.equal(templateIds.has("knowledge_navigation_and_challenge"), true);
  assert.equal(templateIds.has("issue_pr_triage_and_review"), true);
  assert.equal(templateIds.has("personal_work_proof"), true);
  assert.equal(templateIds.has("docs_review_and_improvement"), true);

  for (const card of cards) {
    const validation = validateExecutionReportCard(card);
    assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
    assert.equal(card.extensions["ai-hrms.demo"].modelRoute.mock, true);
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
  assert.match(html, /AI-HRMS Workbench/u);
  assert.match(html, /Knowledge Loop/u);
  assert.match(html, /Ask Maintained Docs/u);
  assert.match(app, /repo_understanding_and_work_plan/u);
  assert.match(app, /knowledge_navigation_and_challenge/u);
  assert.match(app, /personal_work_proof/u);
  assert.match(app, /Challenge this point/u);
});
