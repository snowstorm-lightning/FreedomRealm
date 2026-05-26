import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  chunkMarkdownDocument,
  createKnowledgeNavigationArtifacts,
  searchKnowledge
} from "../src/index.mjs";
import {
  validateAnswerCard,
  validateDocChallengeDraft
} from "../../contracts/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("chunks markdown with path, heading, line range, and digest", () => {
  const chunks = chunkMarkdownDocument({
    relativePath: "docs/demo.md",
    content: "# Title\n\nFirst paragraph.\nSecond line.\n\n## Next\n\nAnother paragraph."
  });

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].path, "docs/demo.md");
  assert.equal(chunks[0].heading, "Title");
  assert.equal(chunks[0].lineStart, 3);
  assert.equal(chunks[0].lineEnd, 4);
  assert.match(chunks[0].digest, /^sha256:/u);
});

test("local mock semantic search is deterministic", async () => {
  const inputs = [
    "docs/zh-CN/capability-development-and-mvp.md",
    "docs/zh-CN/adoption-and-growth.md",
    "docs/zh-CN/roadmap.md"
  ];
  const first = await searchKnowledge({
    repoRoot,
    query: "FreedomRealm 下一步应该做什么？",
    inputs
  });
  const second = await searchKnowledge({
    repoRoot,
    query: "FreedomRealm 下一步应该做什么？",
    inputs
  });

  assert.deepEqual(first.hits, second.hits);
  assert.equal(first.searchMode, "local-mock-semantic");
  assert.ok(first.hits.length >= 2);
});

test("creates valid AnswerCard and DocChallengeDraft without modifying sources", async () => {
  const target = path.join(repoRoot, "docs/zh-CN/capability-development-and-mvp.md");
  const before = digest(await readFile(target, "utf8"));
  const artifacts = await createKnowledgeNavigationArtifacts({
    repoRoot,
    query: "用户提问时如何保证答案可信？",
    inputs: [
      "docs/zh-CN/capability-development-and-mvp.md",
      "docs/zh-CN/adoption-and-growth.md",
      "docs/zh-CN/quality-gates.md"
    ]
  });
  const after = digest(await readFile(target, "utf8"));

  assert.equal(before, after);
  assert.ok(artifacts.answerCard.sourceRefs.length >= 2);
  assert.equal(validateAnswerCard(artifacts.answerCard).ok, true);
  assert.equal(artifacts.docChallengeDraft.status, "draft");
  assert.equal(artifacts.docChallengeDraft.approvalStatus, "requires_human_review");
  assert.equal(validateDocChallengeDraft(artifacts.docChallengeDraft).ok, true);
});
