import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const operatingEntryPath = "config/project-operating-entry.json";

const templateIds = [
  "repo_understanding_and_work_plan",
  "knowledge_navigation_and_challenge",
  "external_agent_connector_safety_demo",
  "issue_pr_triage_and_review",
  "personal_work_proof",
  "project_self_review_and_decay_prevention",
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
      "Start from a task goal, select a governed template, and generate a reviewable work proof.",
    primaryTemplateId: "repo_understanding_and_work_plan",
    action: "Draft a bounded WorkItem",
    command: "pnpm demo -- --template repo_understanding_and_work_plan"
  },
  {
    id: "explore",
    label: "I want to explore",
    summary:
      "Start without a fixed identity. Use interests, materials, constraints, and time to choose a small proof.",
    primaryTemplateId: "knowledge_navigation_and_challenge",
    action: "Ask maintained docs",
    command: "pnpm knowledge:demo -- --query \"AI-HRMS 下一步应该做什么？\""
  },
  {
    id: "demo",
    label: "Show me an example",
    summary:
      "Use built-in mock data to inspect the execution chain, report card, and next actions.",
    primaryTemplateId: "personal_work_proof",
    action: "Inspect a sample proof",
    command: "pnpm web:demo"
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

const proofStats = [
  {
    label: "Understand",
    value: "30 sec",
    detail: "Positioning must be obvious without reading the architecture."
  },
  {
    label: "Run",
    value: "5-10 min",
    detail: "Demo Mode works with mock data and no model key."
  },
  {
    label: "Proof",
    value: "30 min",
    detail: "A first AI-assisted work proof is visible and reviewable."
  },
  {
    label: "Governance",
    value: "0 bypass",
    detail: "High-risk actions still require ApprovalGate."
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
    evalSample: demo.evalSample,
    templateEvaluationSamples: demo.templateEvaluationSamples,
    executionTrace: demo.executionTrace,
    failureSample: reportCard.failure.sample,
    mockOutputNotice: demo.mockOutputNotice,
    workPlan: reportCard.extensions["ai-hrms.workPlan"] ?? null,
    selfReview: reportCard.extensions["ai-hrms.selfReview"] ?? null,
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
        <div class="topbar">
          <div class="brand-lockup">
            <span class="brand-mark" aria-hidden="true">FR</span>
            <div>
              <p class="eyebrow">FreedomRealm / AI-HRMS</p>
              <strong>Governed workbench</strong>
            </div>
          </div>
          <div class="topbar-actions" aria-label="Runtime status">
            <span>Demo Mode</span>
            <span>Mock route</span>
            <span>JSON source</span>
            <span>OS-neutral</span>
          </div>
        </div>

        <div class="command-board">
          <div class="command-copy">
            <p class="eyebrow">Next action cockpit</p>
            <h1>Make AI-assisted work visible, bounded, and reviewable.</h1>
            <p class="lead">Pick an entry path, inspect a governed template, and review the canonical JSON report card without connecting a model, account, connector, or production data.</p>
          </div>
          <div class="hero-status" aria-label="MVP status">
            <span>Runtime contract</span>
            <strong>No live side effects</strong>
            <small>No model key, connector, HR data, external write, or hidden training resource.</small>
          </div>
          <div class="proof-stats" id="proofStats" aria-label="MVP proof targets"></div>
          <div class="flow-map" aria-label="Governed execution flow">
            <span>WorkItem</span>
            <span>AgentActor</span>
            <span>ToolContract</span>
            <span>ApprovalGate</span>
            <span>Observation</span>
            <span>ReportCard</span>
          </div>
        </div>
      </section>

      <section class="entry-strip" aria-label="Entry modes">
        <div class="entry-copy">
          <h2>Choose how to start</h2>
          <p id="entryNote">Start from a task goal, select a governed template, and generate a reviewable work proof.</p>
        </div>
        <div class="entry-actions" id="entryModes"></div>
      </section>

      <section class="decision-strip" aria-label="Recommended next action">
        <div>
          <p class="eyebrow">Recommended Next Action</p>
          <h2 id="entryActionTitle">Draft a bounded WorkItem</h2>
          <p id="entryActionDetail">Start from a task goal, select a governed template, and generate a reviewable work proof.</p>
        </div>
        <div class="command-tile">
          <span>Local command</span>
          <code id="entryCommand">pnpm demo -- --template repo_understanding_and_work_plan</code>
        </div>
      </section>

      <section class="next-workbench" aria-label="Next Workbench">
        <div class="section-heading">
          <p class="eyebrow">Next Workbench</p>
          <h2>Tasks, leases, conflict guards, and stopping rules</h2>
        </div>
        <div class="next-grid">
          <article class="panel" id="operatingTasks"></article>
          <article class="panel" id="operatingGuards"></article>
        </div>
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
  --bg: #f6f8fb;
  --ink: #1f252e;
  --muted: #5f6977;
  --line: #d8dee8;
  --panel: #ffffff;
  --soft: #e9f7f5;
  --soft-2: #f3eefc;
  --accent: #0f766e;
  --accent-strong: #115e59;
  --indigo: #4338ca;
  --amber: #9a6700;
  --warn: #8a5a00;
  --shadow: 0 18px 45px rgba(31, 37, 46, 0.08);
}

* { box-sizing: border-box; }
html { overflow-x: hidden; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  overflow-x: hidden;
}
button, a { font: inherit; }
.shell {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 28px 24px 40px;
}
.hero {
  display: grid;
  gap: 16px;
  padding: 0 0 18px;
  border-bottom: 1px solid var(--line);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 54px;
}
.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-mark {
  display: inline-grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 8px;
  background: var(--ink);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}
.brand-lockup strong {
  display: block;
  font-size: 16px;
}
.topbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.topbar-actions span {
  min-height: 28px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--muted);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 730;
}
.command-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
  align-items: stretch;
}
.command-copy {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 22px;
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
  font-size: 36px;
  line-height: 1.08;
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
  font-size: 16px;
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
.proof-stats {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.proof-stat {
  min-width: 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
}
.proof-stat span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 740;
}
.proof-stat strong {
  display: block;
  margin-top: 5px;
  color: var(--ink);
  font-size: 24px;
  line-height: 1.1;
}
.proof-stat p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.4;
  font-size: 13px;
}
.flow-map {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  align-items: stretch;
}
.flow-map span {
  min-height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 780;
  text-align: center;
  padding: 8px;
}
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
.entry-actions button {
  display: grid;
  gap: 5px;
}
.entry-actions button small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}
.entry-actions button[aria-pressed="true"],
.template-button[aria-current="true"] {
  border-color: var(--accent);
  background: var(--soft);
  color: var(--accent-strong);
}
.decision-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.55fr);
  gap: 14px;
  align-items: stretch;
  padding: 16px 0 20px;
  border-bottom: 1px solid var(--line);
}
.decision-strip > div,
.command-tile {
  min-width: 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}
.decision-strip p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
.command-tile {
  display: grid;
  align-content: center;
  gap: 8px;
}
.command-tile span {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.command-tile code {
  display: block;
  overflow-wrap: anywhere;
  border-radius: 6px;
  background: #f1f5f2;
  color: var(--ink);
  padding: 10px;
  line-height: 1.4;
}
.next-workbench {
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}
.next-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 14px;
  margin-top: 14px;
}
.task-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}
.active-task {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfa;
  padding: 12px;
  margin-top: 12px;
}
.active-task span {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.active-task p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip-row span {
  min-height: 24px;
  border-radius: 999px;
  background: var(--soft);
  color: var(--accent-strong);
  padding: 4px 8px;
  text-transform: none;
}
.task-card {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.task-card header {
  display: flex;
  gap: 10px;
  align-items: start;
  justify-content: space-between;
}
.priority-pill {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  border-radius: 999px;
  background: var(--soft-2);
  color: var(--amber);
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 760;
  white-space: nowrap;
}
.task-card p,
.guard-block p {
  margin: 6px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
.guard-block ul {
  display: grid;
  gap: 6px;
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.4;
}
.risk-note {
  color: var(--warn);
  font-weight: 700;
}
.guard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.lease-preview {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfa;
  padding: 12px;
  margin-top: 12px;
}
.lease-preview dl {
  display: grid;
  gap: 8px;
  margin: 10px 0 0;
}
.lease-preview div {
  min-width: 0;
}
.lease-preview dt {
  color: var(--muted);
  font-size: 12px;
}
.lease-preview dd {
  margin: 3px 0 0;
  overflow-wrap: anywhere;
  line-height: 1.35;
}
.guard-block {
  min-width: 0;
  border-top: 1px solid var(--line);
  padding-top: 10px;
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
.template-rail, .report-surface {
  box-shadow: var(--shadow);
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
.report-digest {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfa;
}
.report-digest div {
  min-width: 0;
}
.report-digest span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 730;
}
.report-digest strong {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.report-digest p {
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
  .command-board, .entry-strip, .decision-strip, .next-grid, .workbench, .right-rail, .knowledge-layout, .roadmap-list {
    grid-template-columns: 1fr;
  }
  h1 { font-size: 30px; }
  .entry-actions, .meta-grid, .report-grid, .report-digest, .guard-grid, .proof-stats, .flow-map {
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

function renderOperatingEntry() {
  const entry = state.operatingEntry;
  const tasks = entry.currentTasks || [];
  const p0Tasks = tasks.filter(function (task) { return task.priority === "P0"; });
  const activeTask = tasks.find(function (task) { return task.taskId === "p0-next-workbench-entry"; }) ||
    p0Tasks[0] ||
    tasks[0];
  const taskGroups = ["P0", "P1", "P2"].map(function (priority) {
    return {
      priority,
      tasks: tasks.filter(function (task) { return task.priority === priority; })
    };
  }).filter(function (group) { return group.tasks.length > 0; });
  const startupCommand = entry.startupCommands[0] || "pnpm self-review";
  document.getElementById("operatingTasks").innerHTML =
    '<div class="section-heading">' +
      '<p class="eyebrow">' + escapeHtml(entry.schemaVersion) + '</p>' +
      '<h2>Current task queue</h2>' +
      '<p>Default next command: <strong>' + escapeHtml(startupCommand) + '</strong></p>' +
    '</div>' +
    (activeTask ? '<section class="active-task">' +
      '<span>Active P0 WorkItem</span>' +
      '<strong>' + escapeHtml(activeTask.taskId) + '</strong>' +
      '<p>' + escapeHtml(activeTask.title) + '</p>' +
      '<div class="chip-row">' +
        (activeTask.outputs || []).slice(0, 4).map(function (output) {
          return '<span>' + escapeHtml(output) + '</span>';
        }).join("") +
      '</div>' +
    '</section>' : '') +
    '<div class="task-list">' + taskGroups.map(function (group) {
      return '<section class="task-lane" aria-label="' + escapeHtml(group.priority) + ' tasks">' +
        '<h3>' + escapeHtml(group.priority) + ' lane</h3>' +
        group.tasks.slice(0, 3).map(function (task) {
          return '<article class="task-card">' +
            '<header><strong>' + escapeHtml(task.title) + '</strong><span class="priority-pill">' +
              escapeHtml(task.priority) + '</span></header>' +
            '<p>TaskId: ' + escapeHtml(task.taskId) + '</p>' +
            '<p>Owner: ' + escapeHtml(task.ownerActorTypes.join(" + ")) + '</p>' +
            '<p>Risk: ' + escapeHtml(task.riskLevel) + '; verify: ' +
              escapeHtml(task.verificationCommands.join(" / ")) + '</p>' +
            '<p>writeSet: ' + escapeHtml(task.suggestedWriteSet.join(", ")) + '</p>' +
            (task.riskLevel === "high"
              ? '<p class="risk-note">Human owner decision and ApprovalGate are required before any live execution.</p>'
              : '') +
          '</article>';
        }).join("") +
      '</section>';
    }).join("") + '</div>';

  const leaseFields = entry.leaseTemplate.requiredFields || [];
  const stopRules = entry.continuationRules.allowStopWhen || [];
  const mergeRule = entry.conflictRules.rules.find(function (rule) {
    return rule.includes("MergeGate");
  }) || "MergeGate checks contracts, docs, tests, dataClassification, and ApprovalGate.";
  const conflictRuleItems = entry.conflictRules.rules.slice(0, 4).map(function (rule) {
    return '<li>' + escapeHtml(rule) + '</li>';
  }).join("");
  document.getElementById("operatingGuards").innerHTML =
    '<div class="section-heading">' +
      '<p class="eyebrow">Harness Guards</p>' +
      '<h2>AgentWorkLease, writeSet, MergeGate, checkpoint</h2>' +
    '</div>' +
    '<section class="lease-preview" aria-label="Current AgentWorkLease preview">' +
      '<strong>AgentWorkLease preview for current shard</strong>' +
      '<dl>' +
        '<div><dt>readSet</dt><dd>config/project-operating-entry.json; generated ExecutionReportCard JSON</dd></div>' +
        '<div><dt>writeSet</dt><dd>apps/web/bin/build-demo.mjs; packages/demo/test/web-workbench-build.test.mjs</dd></div>' +
        '<div><dt>validationCommands</dt><dd>pnpm web:demo; pnpm check</dd></div>' +
        '<div><dt>rollbackPlan</dt><dd>revert this static Web Workbench change and rebuild dist/web</dd></div>' +
      '</dl>' +
    '</section>' +
    '<div class="guard-grid">' +
      '<section class="guard-block"><strong>AgentWorkLease fields</strong><p>' +
        escapeHtml(leaseFields.join(", ")) + '</p></section>' +
      '<section class="guard-block"><strong>writeSet policy</strong><p>' +
        escapeHtml(entry.conflictRules.defaultWriteSetPolicy) + '; ' + escapeHtml(mergeRule) + '</p>' +
        '<ul>' + conflictRuleItems + '</ul></section>' +
      '<section class="guard-block"><strong>Stop conditions</strong><p>' +
        escapeHtml(stopRules.slice(0, 3).join(" / ")) + '</p></section>' +
      '<section class="guard-block"><strong>Harness principles</strong><p>' +
        escapeHtml(entry.harnessPrinciples.slice(0, 3).join(" / ")) + '</p></section>' +
    '</div>';
}

function renderProofStats() {
  document.getElementById("proofStats").innerHTML = state.proofStats.map(function (item) {
    return '<article class="proof-stat">' +
      '<span>' + escapeHtml(item.label) + '</span>' +
      '<strong>' + escapeHtml(item.value) + '</strong>' +
      '<p>' + escapeHtml(item.detail) + '</p>' +
    '</article>';
  }).join("");
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
  const candidateWorkItems = card.selfReview?.candidateWorkItems || [];
  const workPlanCandidateItems = card.workPlan?.candidateWorkItems || [];
  const allCandidateWorkItems = [...candidateWorkItems, ...workPlanCandidateItems];
  const suggestedWorkShards = card.workPlan?.suggestedWorkShards || [];
  const templateEvaluationSamples = card.templateEvaluationSamples?.samples || [];
  const evalSampleItem = card.evalSample
    ? [
        {
          title: card.evalSample.sampleType,
          detail:
            card.evalSample.status +
            ", approvalRequired=" +
            String(card.evalSample.approvalRequired) +
            ", sourceTemplate=" +
            card.evalSample.sourceTemplateId
        }
      ]
    : [];
  const firstNextAction = card.nextActions[0];
  document.getElementById("reportSurface").innerHTML =
    '<header class="report-header">' +
      '<div class="report-title-row">' +
        '<div><p class="eyebrow">ExecutionReportCard</p><h2>' + escapeHtml(card.displayName) + '</h2></div>' +
        '<span class="status-pill">' + escapeHtml(card.status) + '</span>' +
      '</div>' +
      '<p class="mock-note">' + escapeHtml(card.mockOutputNotice) + '</p>' +
      '<p>' + escapeHtml(card.summary) + '</p>' +
    '</header>' +
    '<section class="report-digest" aria-label="Report card digest">' +
      '<div><span>Status</span><strong>' + escapeHtml(card.status) + '</strong></div>' +
      '<div><span>Risk</span><strong>' + escapeHtml(card.riskLevel) + '</strong></div>' +
      '<div><span>Approval</span><strong>' + escapeHtml(card.approvalStatus) + '</strong></div>' +
      '<div><span>Data</span><strong>' + escapeHtml(card.dataClassification) + '</strong></div>' +
      '<div class="wide"><span>Candidate next action</span><strong>' +
        escapeHtml(firstNextAction ? firstNextAction.action : "Human review") + '</strong></div>' +
      '<p class="wide">ExecutionReportCard JSON is canonical. Markdown, HTML, and this Web Workbench are renders for review.</p>' +
    '</section>' +
    renderMeta(card) +
    '<div class="report-grid">' +
      '<section><h3>Findings</h3>' + renderList(card.findings, "title") + '</section>' +
      '<section><h3>Recommendations</h3>' + renderList(card.recommendations, "title") + '</section>' +
      '<section><h3>Candidate Next Actions</h3>' + renderList(card.nextActions, "action") + '</section>' +
      '<section><h3>Tool Contracts</h3>' + renderList(toolItems, "toolName") + '</section>' +
      (allCandidateWorkItems.length > 0
        ? '<section class="wide"><h3>Candidate WorkItems</h3>' + renderList(allCandidateWorkItems.map(function (item) {
            return {
              title: (item.candidateWorkItemId ? item.candidateWorkItemId + " / " : "") + item.title,
              detail: item.priority + ", " + item.riskLevel + ", writeSet: " + item.suggestedWriteSet.join(", ")
            };
          }), "title") + '</section>'
        : '') +
      (suggestedWorkShards.length > 0
        ? '<section class="wide"><h3>Candidate WorkShards</h3>' + renderList(suggestedWorkShards.map(function (shard) {
            return {
              title: shard.shardId + " / " + shard.ownerAgentRole,
              detail: shard.riskLevel + ", modelRoute: " + shard.modelRoute + ", verify: " +
                shard.validationCommands.join(" / ") + ", writeSet: " + (shard.writeSet.length > 0 ? shard.writeSet.join(", ") : "read-only")
            };
          }), "title") + '</section>'
        : '') +
      '<section class="wide"><h3>Input Refs</h3>' + renderList(inputItems, "path") + '</section>' +
      (evalSampleItem.length > 0
        ? '<section><h3>Eval Sample Candidate</h3>' + renderList(evalSampleItem, "title") + '</section>'
        : '') +
      (templateEvaluationSamples.length > 0
        ? '<section class="wide"><h3>Template Evaluation Samples</h3>' + renderList(templateEvaluationSamples.map(function (sample) {
            return {
              title: sample.sampleId,
              detail: sample.purpose + " Failure mode: " + sample.failureModeCovered
            };
          }), "title") + '</section>'
        : '') +
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
      '<strong>' + escapeHtml(entry.label) + '</strong>' +
      '<small>' + escapeHtml(entry.summary) + '</small>' +
    '</button>';
  }).join("");
  document.querySelectorAll("[data-entry]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedEntryId = button.dataset.entry;
      const selected = state.entryModes.find(function (entry) { return entry.id === selectedEntryId; });
      if (selected && selected.primaryTemplateId) {
        selectedTemplateId = selected.primaryTemplateId;
      }
      renderEntryModes();
      renderTemplates();
      const card = state.cards.find(function (candidate) { return candidate.templateId === selectedTemplateId; }) || state.cards[0];
      renderReport(card);
    });
  });
  const selected = state.entryModes.find(function (entry) { return entry.id === selectedEntryId; });
  document.getElementById("entryNote").textContent = selected.summary;
  document.getElementById("entryActionTitle").textContent = selected.action;
  document.getElementById("entryActionDetail").textContent = selected.summary;
  document.getElementById("entryCommand").textContent = selected.command;
}

function renderRoadmap() {
  document.getElementById("roadmapList").innerHTML = state.roadmap.map(function (item) {
    return '<div class="roadmap-item"><span>' + escapeHtml(item.horizon) + '</span><strong>' +
      escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.detail) + '</p></div>';
  }).join("");
}

function renderAll() {
  const card = state.cards.find(function (candidate) { return candidate.templateId === selectedTemplateId; }) || state.cards[0];
  renderProofStats();
  renderOperatingEntry();
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

const operatingEntry = JSON.parse(await readFile(path.join(repoRoot, operatingEntryPath), "utf8"));

const state = {
  generatedAt: new Date().toISOString(),
  runtimeMode: "Demo Mode",
  dataSource: "packages/demo shared engine",
  operatingEntry,
  entryModes,
  roadmap,
  proofStats,
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
