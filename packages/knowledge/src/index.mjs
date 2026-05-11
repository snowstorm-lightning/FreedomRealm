import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  ANSWER_CARD_SCHEMA_VERSION,
  DOC_CHALLENGE_DRAFT_SCHEMA_VERSION,
  validateAnswerCard,
  validateDocChallengeDraft
} from "../../contracts/src/index.mjs";

export const DEFAULT_KNOWLEDGE_QUERY = "AI-HRMS 下一步应该做什么？";
export const KNOWLEDGE_SEARCH_MODE = "local-mock-semantic";

const KNOWLEDGE_VOCABULARY = Object.freeze({
  "ai-hrms": ["ai hrms", "hrms", "人类与智能体资源管理系统"],
  "mvp": ["最小可行产品", "最小闭环", "demo mode", "workbench"],
  "demo": ["demo mode", "演示", "mock", "样例"],
  "web": ["workbench", "web-first", "onboarding", "页面"],
  "cli": ["命令", "demo runner", "可测试内核"],
  "report": ["executionreportcard", "report card", "报告卡", "工作证明"],
  "source": ["来源", "引用", "source ref", "文档索引"],
  "challenge": ["异议", "复核", "docchallenge", "人工审查"],
  "approval": ["approvalgate", "审批", "human review", "人工复核"],
  "template": ["模板", "workflow template", "toolcontract"],
  "knowledge": ["知识", "语义搜索", "answercard", "问答"],
  "agent": ["agentactor", "智能体", "多 agent", "workshard"],
  "next": ["下一步", "后续", "路线图", "phase"]
});

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function pathExists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function workspacePath(repoRoot, relativeOrAbsolutePath) {
  const absolutePath = path.resolve(repoRoot, relativeOrAbsolutePath);
  const relativePath = path.relative(repoRoot, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Knowledge input must stay inside the workspace: ${relativeOrAbsolutePath}`);
  }
  return { absolutePath, relativePath: relativePath.split(path.sep).join("/") };
}

async function collectMarkdownFiles(repoRoot, relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!(await pathExists(absoluteDir))) {
    return [];
  }

  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const relativePath = `${relativeDir}/${entry.name}`;
        if (entry.isDirectory()) {
          return collectMarkdownFiles(repoRoot, relativePath);
        }
        return entry.isFile() && entry.name.endsWith(".md") ? [relativePath] : [];
      })
  );

  return files.flat();
}

export async function collectDefaultKnowledgeInputs(repoRoot) {
  const roots = [];
  for (const candidate of ["README.md", "ARCHITECTURE.md"]) {
    if (await pathExists(path.join(repoRoot, candidate))) {
      roots.push(candidate);
    }
  }
  roots.push(...(await collectMarkdownFiles(repoRoot, "docs/zh-CN")));
  return [...new Set(roots)].sort((left, right) => left.localeCompare(right));
}

function normalizeHeading(line) {
  return line.replace(/^#{1,6}\s*/u, "").trim();
}

function normalizePreview(text) {
  return text.replace(/\s+/gu, " ").trim().slice(0, 260);
}

export function chunkMarkdownDocument({ relativePath, content }) {
  const lines = content.split(/\r?\n/u);
  const chunks = [];
  let heading = "Document";
  let paragraph = [];
  let paragraphStart = 1;

  function flush(endLine) {
    const text = paragraph.join("\n").trim();
    if (!text) {
      paragraph = [];
      return;
    }

    chunks.push({
      chunkId: `${relativePath}#L${paragraphStart}-L${endLine}`,
      path: relativePath,
      heading,
      lineStart: paragraphStart,
      lineEnd: endLine,
      text,
      preview: normalizePreview(text),
      digest: `sha256:${sha256(`${relativePath}\n${heading}\n${paragraphStart}\n${endLine}\n${text}`)}`
    });
    paragraph = [];
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (/^#{1,6}\s+\S/u.test(line)) {
      flush(lineNumber - 1);
      heading = normalizeHeading(line);
      return;
    }

    if (line.trim().length === 0) {
      flush(lineNumber - 1);
      return;
    }

    if (paragraph.length === 0) {
      paragraphStart = lineNumber;
    }
    paragraph.push(line);
  });

  flush(lines.length);

  if (chunks.length === 0 && content.trim().length > 0) {
    const text = content.trim();
    chunks.push({
      chunkId: `${relativePath}#L1-L${lines.length}`,
      path: relativePath,
      heading,
      lineStart: 1,
      lineEnd: lines.length,
      text,
      preview: normalizePreview(text),
      digest: `sha256:${sha256(`${relativePath}\n${text}`)}`
    });
  }

  return chunks;
}

export async function indexKnowledgeDocs({ repoRoot, inputs }) {
  const inputPaths = inputs ?? (await collectDefaultKnowledgeInputs(repoRoot));
  const chunksByDocument = await Promise.all(
    inputPaths.map(async (input) => {
      const { absolutePath, relativePath } = workspacePath(repoRoot, input);
      const content = await readFile(absolutePath, "utf8");
      return chunkMarkdownDocument({ relativePath, content });
    })
  );

  return {
    inputPaths,
    sourceChunks: chunksByDocument.flat()
  };
}

function tokenize(value) {
  const lower = String(value).toLowerCase();
  const tokens = new Set();
  for (const match of lower.matchAll(/[a-z0-9][a-z0-9_-]{1,}/gu)) {
    tokens.add(match[0]);
  }
  for (const match of lower.matchAll(/[\p{Script=Han}]{2,}/gu)) {
    const sequence = match[0];
    tokens.add(sequence);
    for (let index = 0; index < sequence.length - 1; index += 1) {
      tokens.add(sequence.slice(index, index + 2));
    }
    for (let index = 0; index < sequence.length - 2; index += 1) {
      tokens.add(sequence.slice(index, index + 3));
    }
  }

  for (const [term, synonyms] of Object.entries(KNOWLEDGE_VOCABULARY)) {
    if (lower.includes(term) || synonyms.some((synonym) => lower.includes(synonym.toLowerCase()))) {
      tokens.add(term);
      for (const synonym of synonyms) {
        tokens.add(synonym.toLowerCase());
      }
    }
  }

  return [...tokens].filter((token) => token.trim().length >= 2);
}

function scoreChunk(chunk, queryTokens, rawQuery) {
  const pathText = chunk.path.toLowerCase();
  const headingText = chunk.heading.toLowerCase();
  const bodyText = chunk.text.toLowerCase();
  const rawLower = rawQuery.toLowerCase();
  let score = 0;
  const reasons = [];

  if (bodyText.includes(rawLower) || headingText.includes(rawLower)) {
    score += 16;
    reasons.push("exact_query_match");
  }

  for (const token of queryTokens) {
    if (headingText.includes(token)) {
      score += 8;
      reasons.push(`heading:${token}`);
    }
    if (pathText.includes(token)) {
      score += 4;
      reasons.push(`path:${token}`);
    }
    if (bodyText.includes(token)) {
      score += 3;
      reasons.push(`body:${token}`);
    }
  }

  if (/roadmap|路线图/u.test(rawLower) && pathText.includes("roadmap")) {
    score += 10;
    reasons.push("path:roadmap");
  }
  if (/mvp|下一步|next|workbench|demo/u.test(rawLower) && pathText.includes("capability-development-and-mvp")) {
    score += 8;
    reasons.push("path:mvp");
  }
  if (/传播|growth|分享|公开/u.test(rawLower) && pathText.includes("adoption-and-growth")) {
    score += 8;
    reasons.push("path:growth");
  }
  if (/审批|风险|质量|门禁|gate/u.test(rawLower) && pathText.includes("quality-gates")) {
    score += 8;
    reasons.push("path:quality");
  }

  return {
    score,
    matchReasons: [...new Set(reasons)].slice(0, 8)
  };
}

function toSearchHit(chunk, score, matchReasons, index) {
  return {
    sourceRefId: `source-${index + 1}`,
    path: chunk.path,
    heading: chunk.heading,
    lineStart: chunk.lineStart,
    lineEnd: chunk.lineEnd,
    preview: chunk.preview,
    score,
    matchReasons,
    digest: chunk.digest
  };
}

export function searchSourceChunks({ sourceChunks, query, limit = 4 }) {
  const tokens = tokenize(query);
  return sourceChunks
    .map((chunk) => {
      const result = scoreChunk(chunk, tokens, query);
      return { chunk, ...result };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (left.chunk.path !== right.chunk.path) {
        return left.chunk.path.localeCompare(right.chunk.path);
      }
      if (left.chunk.heading !== right.chunk.heading) {
        return left.chunk.heading.localeCompare(right.chunk.heading);
      }
      return left.chunk.lineStart - right.chunk.lineStart;
    })
    .slice(0, limit)
    .map((candidate, index) =>
      toSearchHit(candidate.chunk, candidate.score, candidate.matchReasons, index)
    );
}

export async function searchKnowledge({ repoRoot, query = DEFAULT_KNOWLEDGE_QUERY, inputs, limit = 4 }) {
  const index = await indexKnowledgeDocs({ repoRoot, inputs });
  const hits = searchSourceChunks({
    sourceChunks: index.sourceChunks,
    query,
    limit
  });

  return {
    ...index,
    query,
    searchMode: KNOWLEDGE_SEARCH_MODE,
    hits
  };
}

function buildAnswerText(question, hits) {
  if (hits.length === 0) {
    return "本地 mock 语义搜索没有找到足够可信的维护文档来源。请缩小问题范围或补充输入文档，再由人工 owner 决定是否创建后续 WorkItem。";
  }

  const sourceSummary = hits
    .slice(0, 3)
    .map((hit, index) => `${index + 1}. ${hit.heading}（${hit.path}:L${hit.lineStart}）`)
    .join("；");

  return `基于本地维护文档的 mock 语义定位，问题“${question}”应先回到已登记的 MVP、传播和治理边界处理。当前最可信的来源是：${sourceSummary}。建议把回答作为可复核的 AnswerCard，而不是直接修改文档；如果用户认为来源过期或不完整，应生成 DocChallengeDraft 并交给 human owner 复核。`;
}

export function buildAnswerCard({
  question = DEFAULT_KNOWLEDGE_QUERY,
  hits,
  dataClassification = "internal",
  redactionStatus = "redacted",
  sharePermission = "private"
}) {
  const sourceRefs = hits.map((hit) => ({
    sourceRefId: hit.sourceRefId,
    path: hit.path,
    heading: hit.heading,
    lineStart: hit.lineStart,
    lineEnd: hit.lineEnd,
    preview: hit.preview,
    score: hit.score,
    matchReasons: hit.matchReasons,
    digest: hit.digest
  }));

  const answerCard = {
    answerCardId: `answer-${randomUUID()}`,
    schemaVersion: ANSWER_CARD_SCHEMA_VERSION,
    question,
    answer: buildAnswerText(question, hits),
    sourceRefs,
    confidence: hits.length >= 2 && hits[0].score >= 10 ? "medium" : "low",
    limitations: [
      "This is local deterministic mock semantic search, not a live model or embedding result.",
      "The answer cites maintained repository documents but still requires human review before document changes.",
      "No source document was modified."
    ],
    nextActions: [
      {
        action: "review_answer_sources",
        status: "pending",
        reason: "A human owner should verify that the cited sources still match project intent."
      },
      {
        action: "create_doc_challenge_if_needed",
        status: "optional",
        reason: "Use DocChallengeDraft when a cited point appears outdated, incomplete, or disputed."
      }
    ],
    dataClassification,
    redactionStatus,
    sharePermission,
    extensions: {
      "ai-hrms.knowledge": {
        searchMode: KNOWLEDGE_SEARCH_MODE,
        sourceHitCount: hits.length,
        mock: true
      }
    }
  };

  const validation = validateAnswerCard(answerCard);
  if (!validation.ok) {
    const details = validation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
    throw new Error(`Generated invalid AnswerCard: ${details}`);
  }

  return answerCard;
}

export function buildDocChallengeDraft({
  answerCard,
  humanOwnerId = "human-demo-owner",
  objection = "Please verify whether this cited source is still accurate and whether a follow-up documentation WorkItem is needed."
}) {
  const sourceRef = answerCard.sourceRefs[0] ?? {
    sourceRefId: "source-none",
    path: "unknown",
    heading: "No source located",
    lineStart: 1,
    lineEnd: 1,
    preview: "No source was located.",
    digest: "sha256:none"
  };

  const draft = {
    challengeId: `challenge-${randomUUID()}`,
    schemaVersion: DOC_CHALLENGE_DRAFT_SCHEMA_VERSION,
    sourceRef,
    objection,
    evidenceRefs: answerCard.sourceRefs.slice(0, 2),
    proposedReviewAction: "create_follow_up_doc_review_work_item",
    status: "draft",
    humanOwnerId,
    approvalStatus: "requires_human_review"
  };

  const validation = validateDocChallengeDraft(draft);
  if (!validation.ok) {
    const details = validation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
    throw new Error(`Generated invalid DocChallengeDraft: ${details}`);
  }

  return draft;
}

export async function createKnowledgeNavigationArtifacts({
  repoRoot,
  query = DEFAULT_KNOWLEDGE_QUERY,
  inputs,
  limit = 4,
  humanOwnerId = "human-demo-owner"
}) {
  const search = await searchKnowledge({ repoRoot, query, inputs, limit });
  const answerCard = buildAnswerCard({ question: query, hits: search.hits });
  const docChallengeDraft = buildDocChallengeDraft({ answerCard, humanOwnerId });

  return {
    query,
    inputPaths: search.inputPaths,
    sourceChunks: search.sourceChunks,
    hits: search.hits,
    searchMode: search.searchMode,
    answerCard,
    docChallengeDraft
  };
}
