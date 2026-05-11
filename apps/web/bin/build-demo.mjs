import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDemoExecution,
  createKnowledgeDemoExecution,
  getDefaultInputs,
  writeDemoExecution
} from "../../../packages/demo/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const webDist = path.join(repoRoot, "dist", "web");
const sampleOut = "dist/web/data";

const templateIds = [
  "repo_understanding_and_work_plan",
  "knowledge_navigation_and_challenge",
  "issue_pr_triage_and_review",
  "personal_work_proof",
  "docs_review_and_improvement"
];

const knowledgeQueries = [
  "AI-HRMS 下一步应该做什么？",
  "用户提问时如何保证答案可信？",
  "大型项目什么时候应该拆成多个 WorkShard？"
];

const entryModes = [
  {
    id: "goal",
    label: "I have a goal",
    summary:
      "Start from a task goal, select a governed template, and generate a reviewable work proof."
  },
  {
    id: "explore",
    label: "I want to explore",
    summary:
      "Start without a fixed identity. Use interests, materials, constraints, and time to choose a small proof."
  },
  {
    id: "demo",
    label: "Show me an example",
    summary:
      "Use built-in mock data to inspect the execution chain, report card, and next actions."
  }
];

const roadmap = [
  {
    horizon: "Now",
    title: "Mock software MVP",
    detail: "CLI and Web use the same demo engine, template manifests, and JSON report-card contract."
  },
  {
    horizon: "Next",
    title: "Knowledge navigation",
    detail: "Semantic source lookup, AnswerCard, and DocChallenge flows turn questions into reviewable work."
  },
  {
    horizon: "Later",
    title: "Community proof loops",
    detail: "Public cases, shared templates, and capability proofs grow only after review, redaction, and approval."
  }
];

function toWebHref(repoRelativePath) {
  const normalized = repoRelativePath.split(path.sep).join("/");
  const prefix = "dist/web/";
  return normalized.startsWith(prefix) ? `./${normalized.slice(prefix.length)}` : `../${normalized}`;
}

function toWorkbenchCard(execution, index) {
  const { template, reportCard, output } = execution;
  const demo = reportCard.extensions["ai-hrms.demo"];
  const knowledge = reportCard.extensions["ai-hrms.knowledge"];
  return {
    index,
    reportCardId: reportCard.reportCardId,
    schemaVersion: reportCard.schemaVersion,
    generatedAt: reportCard.generatedAt,
    templateId: reportCard.templateId,
    templateVersion: reportCard.templateVersion,
    displayName: template.displayName,
    taskGoal: reportCard.taskGoal,
    status: reportCard.status,
    riskLevel: reportCard.riskLevel,
    approvalStatus: reportCard.approvalStatus,
    sharePermission: reportCard.sharePermission,
    dataClassification: reportCard.dataClassification,
    redactionStatus: reportCard.redactionStatus,
    summary: reportCard.summary,
    findings: reportCard.findings,
    recommendations: reportCard.recommendations,
    nextActions: reportCard.nextActions,
    metrics: reportCard.metrics,
    skillRefs: reportCard.skillRefs,
    toolContractRefs: reportCard.toolContractRefs,
    inputRefs: reportCard.inputRefs.map((inputRef) => ({
      refId: inputRef.refId,
      path: inputRef.path,
      byteLength: inputRef.byteLength,
      dataClassification: inputRef.dataClassification
    })),
    outputRefs: reportCard.outputRefs,
    jsonHref: toWebHref(output.jsonRelativePath),
    markdownHref: toWebHref(output.markdownRelativePath),
    modelRoute: demo.modelRoute,
    workItem: demo.workItem,
    agentActor: demo.agentActor,
    approvalGate: demo.approvalGate,
    observation: demo.observation,
    executionTrace: demo.executionTrace,
    failureSample: reportCard.failure.sample,
    mockOutputNotice: demo.mockOutputNotice,
    answerCard: knowledge?.answerCard ?? null,
    docChallengeDraft: knowledge?.docChallengeDraft ?? null,
    answerCardHref: output.answerCardRelativePath ? toWebHref(output.answerCardRelativePath) : null,
    docChallengeDraftHref: output.docChallengeDraftRelativePath
      ? toWebHref(output.docChallengeDraftRelativePath)
      : null
  };
}

function toKnowledgeExample(execution, index) {
  const knowledge = execution.reportCard.extensions["ai-hrms.knowledge"];
  return {
    index,
    query: knowledge.query,
    answerCard: knowledge.answerCard,
    docChallengeDraft: knowledge.docChallengeDraft,
    reportCardId: execution.reportCard.reportCardId,
    reportCardHref: toWebHref(execution.output.jsonRelativePath),
    answerCardHref: toWebHref(execution.output.answerCardRelativePath),
    docChallengeDraftHref: toWebHref(execution.output.docChallengeDraftRelativePath),
    searchMode: knowledge.searchMode,
    sourceHitCount: knowledge.sourceHitCount
  };
}

function buildHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI-HRMS Workbench</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main class="shell">
      <section class="hero" aria-label="Workbench overview">
        <div>
          <p class="eyebrow">AI-HRMS Workbench</p>
          <h1>Turn AI-assisted work into reviewable proof.</h1>
          <p class="lead">A half-landed software MVP for goals, exploration, governed templates, execution traces, and JSON-first report cards. Everything here is deterministic mock output.</p>
        </div>
        <div class="hero-status" aria-label="MVP status">
          <span>Demo Mode</span>
          <strong>Mock route only</strong>
          <small>No model key, connector, HR data, or write side effect.</small>
        </div>
      </section>

      <section class="entry-strip" aria-label="Entry modes">
        <div class="entry-copy">
          <h2>Choose how to start</h2>
          <p id="entryNote">Start from a task goal, select a governed template, and generate a reviewable work proof.</p>
        </div>
        <div class="entry-actions" id="entryModes"></div>
      </section>

      <section class="workbench" aria-label="Workbench">
        <aside class="template-rail" aria-label="Template list">
          <div class="section-heading">
            <p class="eyebrow">Templates</p>
            <h2>First usable paths</h2>
          </div>
          <div id="templateList" class="template-list"></div>
        </aside>

        <article class="report-surface" id="reportSurface" aria-label="Execution report card preview"></article>

        <aside class="right-rail" aria-label="Execution details">
          <section class="panel">
            <div class="section-heading">
              <p class="eyebrow">Execution Chain</p>
              <h2>Governed loop</h2>
            </div>
            <ol id="executionTrace" class="trace-list"></ol>
          </section>

          <section class="panel">
            <div class="section-heading">
              <p class="eyebrow">Knowledge Loop</p>
              <h2>Next product slice</h2>
            </div>
            <div class="knowledge-box">
              <strong>AnswerCard</strong>
              <span>Answer with source references from maintained docs.</span>
            </div>
            <div class="knowledge-box">
              <strong>DocChallenge</strong>
              <span>Let users challenge a specific source point, then create a reviewable work item.</span>
            </div>
          </section>
        </aside>
      </section>

      <section class="knowledge-demo" aria-label="Ask maintained docs">
        <div class="section-heading">
          <p class="eyebrow">Ask Maintained Docs</p>
          <h2>Source-backed answers and reviewable challenges</h2>
        </div>
        <div class="knowledge-layout">
          <div class="question-list" id="knowledgeQuestionList"></div>
          <article class="knowledge-answer" id="knowledgeAnswer"></article>
        </div>
      </section>

      <section class="roadmap" aria-label="Roadmap">
        <div class="section-heading">
          <p class="eyebrow">Execution Plan</p>
          <h2>From visible MVP to longer-term system</h2>
        </div>
        <div id="roadmapList" class="roadmap-list"></div>
      </section>
    </main>
    <script src="./app.js"></script>
  </body>
</html>
`;
}

const css = `:root {
  color-scheme: light;
  --bg: #f5f6f2;
  --ink: #20242a;
  --muted: #5d6673;
  --line: #d7ddd7;
  --panel: #ffffff;
  --soft: #edf6f4;
  --soft-2: #f6f0e8;
  --accent: #0f766e;
  --accent-strong: #134e4a;
  --warn: #8a5a00;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
button, a { font: inherit; }
.shell {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 28px 24px 40px;
}
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: end;
  padding: 22px 0 26px;
  border-bottom: 1px solid var(--line);
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  max-width: 900px;
  font-size: 48px;
  line-height: 1.04;
  font-weight: 780;
  letter-spacing: 0;
}
h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: 0;
}
h3 {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.3;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0;
}
.lead {
  margin: 14px 0 0;
  max-width: 820px;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.55;
}
.hero-status, .panel, .template-rail, .report-surface {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.hero-status {
  display: grid;
  gap: 7px;
  padding: 16px;
}
.hero-status span {
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 760;
}
.hero-status strong { font-size: 18px; }
.hero-status small { color: var(--muted); line-height: 1.45; }
.entry-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.9fr);
  gap: 20px;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.entry-copy p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.5;
}
.entry-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.entry-actions button, .template-button {
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}
.entry-actions button[aria-pressed="true"],
.template-button[aria-current="true"] {
  border-color: var(--accent);
  background: var(--soft);
  color: var(--accent-strong);
}
.workbench {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
  padding-top: 20px;
}
.template-rail, .report-surface, .panel {
  padding: 18px;
}
.template-list {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}
.template-button {
  display: grid;
  gap: 6px;
}
.template-button strong {
  font-size: 14px;
  line-height: 1.25;
}
.template-button span {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.35;
}
.report-header {
  display: grid;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.report-title-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: start;
}
.report-title-row h2 {
  font-size: 26px;
  line-height: 1.2;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  padding: 5px 10px;
  background: var(--soft);
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 760;
  white-space: nowrap;
}
.mock-note {
  margin: 0;
  color: var(--warn);
  line-height: 1.45;
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0;
}
.meta-grid div {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 10px;
  background: #fbfcfa;
}
.meta-grid dt {
  color: var(--muted);
  font-size: 12px;
}
.meta-grid dd {
  margin: 5px 0 0;
  font-size: 13px;
  font-weight: 760;
  overflow-wrap: anywhere;
}
.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.wide { grid-column: 1 / -1; }
.stack-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.stack-list li {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.stack-list strong {
  display: block;
  margin-bottom: 4px;
}
.stack-list span {
  display: block;
  color: var(--muted);
  line-height: 1.45;
}
.data-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.data-links a {
  min-height: 38px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--accent-strong);
  padding: 8px 12px;
  text-decoration: none;
  font-weight: 700;
}
.right-rail {
  display: grid;
  gap: 14px;
}
.trace-list {
  margin: 14px 0 0;
  padding-left: 22px;
}
.trace-list li {
  margin-bottom: 8px;
  color: var(--muted);
  line-height: 1.35;
}
.knowledge-box {
  display: grid;
  gap: 5px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
  margin-top: 10px;
}
.knowledge-box span {
  color: var(--muted);
  line-height: 1.45;
}
.roadmap {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.knowledge-demo {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.knowledge-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
  margin-top: 14px;
}
.question-list {
  display: grid;
  gap: 8px;
}
.question-list button {
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}
.question-list button[aria-current="true"] {
  border-color: var(--accent);
  background: var(--soft);
  color: var(--accent-strong);
}
.knowledge-answer {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
}
.source-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.source-list li {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.source-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.source-actions button, .source-actions a {
  min-height: 34px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: transparent;
  color: var(--accent-strong);
  padding: 6px 9px;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
}
.challenge-status {
  margin: 12px 0 0;
  color: var(--warn);
  line-height: 1.45;
}
.roadmap-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.roadmap-item {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}
.roadmap-item span {
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 760;
}
.roadmap-item strong {
  display: block;
  margin-top: 6px;
}
.roadmap-item p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
@media (max-width: 1120px) {
  .workbench {
    grid-template-columns: 260px minmax(0, 1fr);
  }
  .right-rail {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 840px) {
  .shell { padding: 24px 16px 32px; }
  .hero, .entry-strip, .workbench, .right-rail, .knowledge-layout, .roadmap-list {
    grid-template-columns: 1fr;
  }
  h1 { font-size: 34px; }
  .entry-actions, .meta-grid, .report-grid {
    grid-template-columns: 1fr;
  }
  .report-title-row {
    display: grid;
  }
}
`;

function buildJs(state) {
  return `const state = ${JSON.stringify(state, null, 2)};
let selectedTemplateId = state.cards[0].templateId;
let selectedEntryId = state.entryModes[0].id;
let selectedKnowledgeIndex = 0;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function itemText(item) {
  return item.detail || item.reason || item.status || "";
}

function renderList(items, titleKey) {
  return '<ul class="stack-list">' + items.map(function (item) {
    const title = item[titleKey] || item.title || item.action || item.toolName || item.path || item.refId;
    return '<li><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(itemText(item)) + '</span></li>';
  }).join("") + '</ul>';
}

function renderMeta(card) {
  const entries = [
    ["Schema", card.schemaVersion],
    ["Risk", card.riskLevel],
    ["Approval", card.approvalStatus],
    ["Share", card.sharePermission],
    ["Model route", card.modelRoute.actual + (card.modelRoute.mock ? " / mock" : "")],
    ["Data", card.dataClassification + " / " + card.redactionStatus],
    ["Inputs", String(card.metrics.inputDocumentCount)],
    ["Human review", card.metrics.requiresHumanReview ? "required" : "not required"]
  ];
  return '<dl class="meta-grid">' + entries.map(function (entry) {
    return '<div><dt>' + escapeHtml(entry[0]) + '</dt><dd>' + escapeHtml(entry[1]) + '</dd></div>';
  }).join("") + '</dl>';
}

function renderReport(card) {
  const toolItems = card.toolContractRefs.map(function (tool) {
    return {
      toolName: tool.toolName,
      detail: tool.riskLevel + " risk, autoExecute=" + String(tool.autoExecute)
    };
  });
  const inputItems = card.inputRefs.map(function (input) {
    return {
      path: input.path,
      detail: input.dataClassification + ", " + input.byteLength + " bytes"
    };
  });
  document.getElementById("reportSurface").innerHTML =
    '<header class="report-header">' +
      '<div class="report-title-row">' +
        '<div><p class="eyebrow">ExecutionReportCard</p><h2>' + escapeHtml(card.displayName) + '</h2></div>' +
        '<span class="status-pill">' + escapeHtml(card.status) + '</span>' +
      '</div>' +
      '<p class="mock-note">' + escapeHtml(card.mockOutputNotice) + '</p>' +
      '<p>' + escapeHtml(card.summary) + '</p>' +
    '</header>' +
    renderMeta(card) +
    '<div class="report-grid">' +
      '<section><h3>Findings</h3>' + renderList(card.findings, "title") + '</section>' +
      '<section><h3>Recommendations</h3>' + renderList(card.recommendations, "title") + '</section>' +
      '<section><h3>Next Actions</h3>' + renderList(card.nextActions, "action") + '</section>' +
      '<section><h3>Tool Contracts</h3>' + renderList(toolItems, "toolName") + '</section>' +
      '<section class="wide"><h3>Input Refs</h3>' + renderList(inputItems, "path") + '</section>' +
      '<section class="wide"><h3>Failure Path Sample</h3>' +
        renderList([{ title: card.failureSample.failureType, detail: card.failureSample.recovery }], "title") +
      '</section>' +
    '</div>' +
    '<footer class="data-links">' +
      '<a href="' + escapeHtml(card.jsonHref) + '">Open canonical JSON</a>' +
      '<a href="' + escapeHtml(card.markdownHref) + '">Open Markdown render</a>' +
      (card.answerCardHref ? '<a href="' + escapeHtml(card.answerCardHref) + '">Open AnswerCard JSON</a>' : '') +
      (card.docChallengeDraftHref ? '<a href="' + escapeHtml(card.docChallengeDraftHref) + '">Open ChallengeDraft JSON</a>' : '') +
    '</footer>';

  document.getElementById("executionTrace").innerHTML = card.executionTrace.map(function (step) {
    return '<li>' + escapeHtml(step) + '</li>';
  }).join("");
}

function renderKnowledgeExamples() {
  const examples = state.knowledgeExamples || [];
  if (examples.length === 0) {
    return;
  }

  document.getElementById("knowledgeQuestionList").innerHTML = examples.map(function (example, index) {
    return '<button type="button" data-knowledge-index="' + String(index) + '" aria-current="' +
      String(index === selectedKnowledgeIndex) + '">' + escapeHtml(example.query) + '</button>';
  }).join("");

  document.querySelectorAll("[data-knowledge-index]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedKnowledgeIndex = Number(button.dataset.knowledgeIndex);
      renderAll();
    });
  });

  const example = examples[selectedKnowledgeIndex] || examples[0];
  const answerCard = example.answerCard;
  const sourceItems = answerCard.sourceRefs.map(function (sourceRef, index) {
    return '<li>' +
      '<strong>' + escapeHtml(sourceRef.heading) + '</strong>' +
      '<span>' + escapeHtml(sourceRef.path + ":L" + sourceRef.lineStart + "-L" + sourceRef.lineEnd) + '</span>' +
      '<span>' + escapeHtml(sourceRef.preview) + '</span>' +
      '<div class="source-actions">' +
        '<button type="button" data-challenge-source="' + String(index) + '">Challenge this point</button>' +
        '<a href="' + escapeHtml(example.docChallengeDraftHref) + '">Open draft</a>' +
      '</div>' +
    '</li>';
  }).join("");

  document.getElementById("knowledgeAnswer").innerHTML =
    '<header class="report-header">' +
      '<p class="eyebrow">' + escapeHtml(example.searchMode) + '</p>' +
      '<h2>' + escapeHtml(answerCard.question) + '</h2>' +
      '<p>' + escapeHtml(answerCard.answer) + '</p>' +
    '</header>' +
    '<dl class="meta-grid">' +
      '<div><dt>Schema</dt><dd>' + escapeHtml(answerCard.schemaVersion) + '</dd></div>' +
      '<div><dt>Confidence</dt><dd>' + escapeHtml(answerCard.confidence) + '</dd></div>' +
      '<div><dt>Sources</dt><dd>' + String(example.sourceHitCount) + '</dd></div>' +
      '<div><dt>Share</dt><dd>' + escapeHtml(answerCard.sharePermission) + '</dd></div>' +
    '</dl>' +
    '<section><h3>Sources</h3><ul class="source-list">' + sourceItems + '</ul></section>' +
    '<p class="challenge-status" id="challengeStatus">Challenge actions create draft review material only. No source document is modified.</p>' +
    '<footer class="data-links">' +
      '<a href="' + escapeHtml(example.answerCardHref) + '">Open AnswerCard JSON</a>' +
      '<a href="' + escapeHtml(example.docChallengeDraftHref) + '">Open ChallengeDraft JSON</a>' +
      '<a href="' + escapeHtml(example.reportCardHref) + '">Open ReportCard JSON</a>' +
    '</footer>';

  document.querySelectorAll("[data-challenge-source]").forEach(function (button) {
    button.addEventListener("click", function () {
      const source = answerCard.sourceRefs[Number(button.dataset.challengeSource)];
      document.getElementById("challengeStatus").textContent =
        "Draft challenge prepared for " + source.path + ":L" + source.lineStart +
        ". Human review is required before any documentation change.";
    });
  });
}

function renderTemplates() {
  document.getElementById("templateList").innerHTML = state.cards.map(function (card) {
    const current = card.templateId === selectedTemplateId;
    return '<button type="button" class="template-button" data-template="' + escapeHtml(card.templateId) + '" aria-current="' + String(current) + '">' +
      '<strong>' + escapeHtml(card.displayName) + '</strong>' +
      '<span>' + escapeHtml(card.taskGoal) + '</span>' +
    '</button>';
  }).join("");
  document.querySelectorAll("[data-template]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedTemplateId = button.dataset.template;
      renderAll();
    });
  });
}

function renderEntryModes() {
  document.getElementById("entryModes").innerHTML = state.entryModes.map(function (entry) {
    return '<button type="button" data-entry="' + escapeHtml(entry.id) + '" aria-pressed="' + String(entry.id === selectedEntryId) + '">' +
      escapeHtml(entry.label) +
    '</button>';
  }).join("");
  document.querySelectorAll("[data-entry]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedEntryId = button.dataset.entry;
      renderEntryModes();
    });
  });
  const selected = state.entryModes.find(function (entry) { return entry.id === selectedEntryId; });
  document.getElementById("entryNote").textContent = selected.summary;
}

function renderRoadmap() {
  document.getElementById("roadmapList").innerHTML = state.roadmap.map(function (item) {
    return '<div class="roadmap-item"><span>' + escapeHtml(item.horizon) + '</span><strong>' +
      escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.detail) + '</p></div>';
  }).join("");
}

function renderAll() {
  const card = state.cards.find(function (candidate) { return candidate.templateId === selectedTemplateId; }) || state.cards[0];
  renderTemplates();
  renderEntryModes();
  renderReport(card);
  renderKnowledgeExamples();
  renderRoadmap();
}

renderAll();
`;
}

await mkdir(webDist, { recursive: true });

const executions = [];
for (const templateId of templateIds) {
  const execution = await createDemoExecution({
    repoRoot,
    templateId,
    model: "mock",
    inputs: getDefaultInputs(templateId),
    outputDir: sampleOut
  });
  await writeDemoExecution(execution);
  executions.push(execution);
}

const knowledgeExecutions = [];
for (const query of knowledgeQueries) {
  const execution = await createKnowledgeDemoExecution({
    repoRoot,
    query,
    model: "mock",
    outputDir: sampleOut
  });
  await writeDemoExecution(execution);
  knowledgeExecutions.push(execution);
}

const state = {
  generatedAt: new Date().toISOString(),
  runtimeMode: "Demo Mode",
  dataSource: "packages/demo shared engine",
  entryModes,
  roadmap,
  cards: executions.map(toWorkbenchCard),
  knowledgeExamples: knowledgeExecutions.map(toKnowledgeExample)
};

await writeFile(path.join(webDist, "index.html"), buildHtml(), "utf8");
await writeFile(path.join(webDist, "styles.css"), css, "utf8");
await writeFile(path.join(webDist, "app.js"), buildJs(state), "utf8");

console.log("[web] ok");
console.log("[web] Workbench: dist/web/index.html");
for (const execution of executions) {
  console.log(`[web] Sample report card: ${execution.output.jsonRelativePath}`);
}
for (const execution of knowledgeExecutions) {
  console.log(`[web] Knowledge sample report card: ${execution.output.jsonRelativePath}`);
}
