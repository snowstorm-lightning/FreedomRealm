import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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
const activePlansPath = "docs/zh-CN/execution-plans/active";

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
    label: "有明确目标 / I have a goal",
    summary:
      "从任务目标开始，选择治理模板，生成可复核工作凭证。 / Start from a task goal, select a governed template, and generate a reviewable work proof.",
    primaryTemplateId: "repo_understanding_and_work_plan",
    action: "起草有边界的 WorkItem / Draft a bounded WorkItem",
    command: "pnpm demo -- --template repo_understanding_and_work_plan"
  },
  {
    id: "explore",
    label: "先探索 / I want to explore",
    summary:
      "无需固定身份，从兴趣、材料、约束和时间中选择一个小凭证。 / Start without a fixed identity. Use interests, materials, constraints, and time to choose a small proof.",
    primaryTemplateId: "knowledge_navigation_and_challenge",
    action: "询问维护文档 / Ask maintained docs",
    command: "pnpm knowledge:demo -- --query \"AI-HRMS 下一步应该做什么？\""
  },
  {
    id: "demo",
    label: "查看示例 / Show me an example",
    summary:
      "用内置 mock 数据查看执行链、报告卡和候选下一步。 / Use built-in mock data to inspect the execution chain, report card, and next actions.",
    primaryTemplateId: "personal_work_proof",
    action: "查看样例凭证 / Inspect a sample proof",
    command: "pnpm web:demo"
  }
];

const roadmap = [
  {
    horizon: "当前 / Now",
    title: "Mock 软件 MVP / Mock software MVP",
    detail: "CLI 与 Web 共用 Demo engine、模板 manifest 和 JSON 报告卡契约。 / CLI and Web use the same demo engine, template manifests, and JSON report-card contract."
  },
  {
    horizon: "下一步 / Next",
    title: "知识导航 / Knowledge navigation",
    detail: "语义来源检索、AnswerCard 与 DocChallenge 把问题转成可复核工作。 / Semantic source lookup, AnswerCard, and DocChallenge flows turn questions into reviewable work."
  },
  {
    horizon: "后续 / Later",
    title: "社区凭证循环 / Community proof loops",
    detail: "公开案例、共享模板和能力凭证只能在复核、脱敏和审批后增长。 / Public cases, shared templates, and capability proofs grow only after review, redaction, and approval."
  }
];

const proofStats = [
  {
    label: "理解 / Understand",
    value: "30 秒 / 30 sec",
    detail: "不读架构也能看懂定位。 / Positioning must be obvious without reading the architecture."
  },
  {
    label: "运行 / Run",
    value: "5-10 分钟 / 5-10 min",
    detail: "Demo Mode 使用 mock 数据，无需模型 key。 / Demo Mode works with mock data and no model key."
  },
  {
    label: "凭证 / Proof",
    value: "30 分钟 / 30 min",
    detail: "首个 AI 协助工作凭证可见、可复核。 / A first AI-assisted work proof is visible and reviewable."
  },
  {
    label: "治理 / Governance",
    value: "0 绕过 / 0 bypass",
    detail: "高风险动作仍需 ApprovalGate。 / High-risk actions still require ApprovalGate."
  }
];

const reviewPrompts = [
  {
    label: "定位 / Positioning",
    prompt:
      "30 秒内是否能看出它不是传统 HRMS，也不是普通 agent framework？ / In 30 seconds, is it clear this is neither traditional HRMS nor a generic agent framework?",
    focus: "FreedomRealm / AI-HRMS"
  },
  {
    label: "治理 / Governance",
    prompt:
      "哪些位置还需要更清楚地显示 ApprovalGate、数据分级、审计或回滚？ / Where should ApprovalGate, data classification, audit, or rollback be clearer?",
    focus: "ApprovalGate"
  },
  {
    label: "下一步 / Next action",
    prompt:
      "Owner Decision Queue 是否清楚说明哪些事需要人决策，哪些只是候选建议？ / Does the Owner Decision Queue clearly separate human decisions from candidate suggestions?",
    focus: "HumanActor"
  },
  {
    label: "观感 / Visual load",
    prompt:
      "哪些信息太密、太轻、太隐蔽，影响你提出修改意见？ / Which information feels too dense, too light, or too hidden for useful feedback?",
    focus: "Workbench"
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
    humanOwnerId: reportCard.humanOwnerId,
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

function extractSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/u);
  const startIndex = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (startIndex < 0) {
    return [];
  }
  const section = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) {
      break;
    }
    section.push(lines[index]);
  }
  return section;
}

function extractBullets(markdown, heading, limit = 3) {
  return extractSection(markdown, heading)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .slice(0, limit);
}

function extractStatus(markdown) {
  const statusLines = extractSection(markdown, "状态")
    .map((line) => line.trim())
    .filter(Boolean);
  return statusLines[0] || "Active";
}

async function readActivePlans() {
  const planDir = path.join(repoRoot, activePlansPath);
  const filenames = (await readdir(planDir))
    .filter((filename) => filename.endsWith(".md"))
    .sort();
  return Promise.all(filenames.map(async (filename, index) => {
    const repoRelativePath = path.join(activePlansPath, filename).split(path.sep).join("/");
    const markdown = await readFile(path.join(repoRoot, repoRelativePath), "utf8");
    const title = markdown.match(/^#\s+(.+)$/mu)?.[1] || filename.replace(/\.md$/u, "");
    const humanDecisionBullets = extractBullets(markdown, "Human Owner 决策点", 5);
    return {
      index,
      filename,
      path: repoRelativePath,
      title,
      status: extractStatus(markdown),
      goals: extractBullets(markdown, "目标", 3),
      nonGoals: extractBullets(markdown, "非目标", 3),
      acceptance: extractBullets(markdown, "验收标准", 3),
      humanDecisionCount: humanDecisionBullets.length,
      humanDecisionPreview: humanDecisionBullets.slice(0, 2),
      planOnly:
        markdown.includes("不是本轮自动实现授权") ||
        markdown.includes("不在本计划创建") ||
        markdown.includes("不实现"),
      href: "../" + repoRelativePath
    };
  }));
}

function buildHtml() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI-HRMS Workbench / AI-HRMS 工作台</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main class="shell">
      <section class="hero" aria-label="工作台概览 / Workbench overview">
        <div class="topbar">
          <div class="brand-lockup">
            <span class="brand-mark" aria-hidden="true">FR</span>
            <div>
              <p class="eyebrow">FreedomRealm / AI-HRMS</p>
              <strong>治理工作台 / Governed workbench</strong>
            </div>
          </div>
          <div class="topbar-actions" aria-label="运行状态 / Runtime status">
            <span>演示档位 / Demo Mode</span>
            <span>Mock 路由 / Mock route</span>
            <span>JSON 事实源 / JSON source</span>
            <span>跨平台 / OS-neutral</span>
          </div>
        </div>

        <div class="command-board">
          <div class="command-copy">
            <p class="eyebrow">下一步驾驶舱 / Next action cockpit</p>
            <h1>让 AI 协助工作可见、有边界、可复核。 / Make AI-assisted work visible, bounded, and reviewable.</h1>
            <p class="lead">选择入口、查看治理模板，并复核 canonical JSON 报告卡；无需连接模型、账号、连接器或生产数据。 / Pick an entry path, inspect a governed template, and review the canonical JSON report card without connecting a model, account, connector, or production data.</p>
          </div>
          <div class="hero-status" aria-label="MVP 状态 / MVP status">
            <span>运行契约 / Runtime contract</span>
            <strong>无实时副作用 / No live side effects</strong>
            <small>无模型 key、连接器、HR 数据、外部写入或隐藏训练资源。 / No model key, connector, HR data, external write, or hidden training resource.</small>
          </div>
          <div class="proof-stats" id="proofStats" aria-label="MVP 凭证目标 / MVP proof targets"></div>
          <div class="flow-map" aria-label="治理执行流 / Governed execution flow">
            <span>工作单元 / WorkItem</span>
            <span>智能体 / AgentActor</span>
            <span>工具契约 / ToolContract</span>
            <span>审批闸门 / ApprovalGate</span>
            <span>观测记录 / Observation</span>
            <span>报告卡 / ReportCard</span>
          </div>
        </div>
      </section>

      <section class="entry-strip" aria-label="入口模式 / Entry modes">
        <div class="entry-copy">
          <h2>选择开始方式 / Choose how to start</h2>
          <p id="entryNote">从任务目标开始，选择治理模板，生成可复核工作凭证。 / Start from a task goal, select a governed template, and generate a reviewable work proof.</p>
          <div class="entry-recommendation" aria-label="当前入口建议 / Current entry recommendation">
            <span>推荐下一步 / Recommended Next Action</span>
            <strong id="entryInlineActionTitle">起草有边界的 WorkItem / Draft a bounded WorkItem</strong>
            <code id="entryInlineCommand">pnpm demo -- --template repo_understanding_and_work_plan</code>
          </div>
        </div>
        <div class="entry-actions" id="entryModes"></div>
      </section>

      <section class="review-prompts" aria-label="修改意见入口 / Review prompts">
        <div class="section-heading">
          <p class="eyebrow">修改意见入口 / Review Prompts</p>
          <h2>让反馈直接落在定位、治理、下一步和页面负担上 / Keep feedback focused on positioning, governance, next actions, and visual load</h2>
        </div>
        <div class="review-prompt-grid" id="reviewPrompts"></div>
      </section>

      <section class="decision-strip" aria-label="推荐下一步 / Recommended next action">
        <div>
          <p class="eyebrow">推荐下一步 / Recommended Next Action</p>
          <h2 id="entryActionTitle">起草有边界的 WorkItem / Draft a bounded WorkItem</h2>
          <p id="entryActionDetail">从任务目标开始，选择治理模板，生成可复核工作凭证。 / Start from a task goal, select a governed template, and generate a reviewable work proof.</p>
        </div>
        <div class="command-tile">
          <span>本地命令 / Local command</span>
          <code id="entryCommand">pnpm demo -- --template repo_understanding_and_work_plan</code>
        </div>
      </section>

      <section class="owner-decisions" id="ownerDecisionQueue" aria-label="需要 owner 决策 / Owner decision queue"></section>

      <section class="next-workbench" aria-label="下一步工作台 / Next Workbench">
        <div class="section-heading">
          <p class="eyebrow">下一步工作台 / Next Workbench</p>
          <h2>任务、租约、冲突防护与停止规则 / Tasks, leases, conflict guards, and stopping rules</h2>
        </div>
        <div class="next-grid">
          <article class="panel" id="operatingTasks"></article>
          <article class="panel" id="operatingGuards"></article>
          <article class="panel backlog-panel" id="decayBacklog"></article>
        </div>
        <div class="active-plan-strip" id="activePlans"></div>
      </section>

      <section class="workbench" aria-label="工作台 / Workbench">
        <aside class="template-rail" aria-label="模板列表 / Template list">
          <div class="section-heading">
            <p class="eyebrow">模板 / Templates</p>
            <h2>首批可用路径 / First usable paths</h2>
          </div>
          <div id="templateList" class="template-list"></div>
        </aside>

        <article class="report-surface" id="reportSurface" aria-label="执行报告卡预览 / Execution report card preview"></article>

        <aside class="right-rail" aria-label="执行细节 / Execution details">
          <section class="panel">
            <div class="section-heading">
              <p class="eyebrow">执行链 / Execution Chain</p>
              <h2>治理闭环 / Governed loop</h2>
            </div>
            <ol id="executionTrace" class="trace-list"></ol>
          </section>

          <section class="panel">
            <div class="section-heading">
              <p class="eyebrow">知识循环 / Knowledge Loop</p>
              <h2>下一段产品切片 / Next product slice</h2>
            </div>
            <div class="knowledge-box">
              <strong>AnswerCard</strong>
              <span>用维护文档的来源引用回答。 / Answer with source references from maintained docs.</span>
            </div>
            <div class="knowledge-box">
              <strong>DocChallenge</strong>
              <span>允许用户挑战具体来源点，再形成可复核工作项。 / Let users challenge a specific source point, then create a reviewable work item.</span>
            </div>
          </section>
        </aside>
      </section>

      <section class="knowledge-demo" aria-label="询问维护文档 / Ask maintained docs">
        <div class="section-heading">
          <p class="eyebrow">询问维护文档 / Ask Maintained Docs</p>
          <h2>有来源的回答与可复核挑战 / Source-backed answers and reviewable challenges</h2>
        </div>
        <div class="knowledge-layout">
          <div class="question-list" id="knowledgeQuestionList"></div>
          <article class="knowledge-answer" id="knowledgeAnswer"></article>
        </div>
      </section>

      <section class="roadmap" aria-label="路线图 / Roadmap">
        <div class="section-heading">
          <p class="eyebrow">执行计划 / Execution Plan</p>
          <h2>从可见 MVP 到长期系统 / From visible MVP to longer-term system</h2>
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
  line-height: 1.2;
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
  overflow-wrap: anywhere;
}
h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}
h3 {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.3;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0;
  overflow-wrap: anywhere;
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
.entry-recommendation {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}
.entry-recommendation span {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.entry-recommendation strong {
  font-size: 15px;
  line-height: 1.25;
}
.entry-recommendation code {
  display: block;
  overflow-wrap: anywhere;
  border-radius: 6px;
  background: #f1f5f2;
  color: var(--ink);
  padding: 8px;
  line-height: 1.35;
  font-size: 12px;
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
.review-prompts {
  display: grid;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.review-prompt-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.review-prompt-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
}
.review-prompt-card span {
  display: block;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.review-prompt-card strong {
  display: block;
  margin-top: 7px;
}
.review-prompt-card p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
.decision-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.55fr);
  gap: 14px;
  align-items: stretch;
  padding: 16px 0 20px;
  border-bottom: 1px solid var(--line);
}
.owner-decisions {
  display: grid;
  grid-template-columns: 280px repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.decision-queue-intro,
.decision-queue-item {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
}
.decision-queue-intro {
  display: grid;
  gap: 8px;
  align-content: start;
}
.decision-queue-intro p,
.decision-queue-item p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}
.decision-queue-item {
  display: grid;
  gap: 8px;
}
.decision-queue-item header {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: start;
}
.decision-queue-item strong {
  overflow-wrap: anywhere;
}
.decision-queue-item code {
  display: block;
  overflow-wrap: anywhere;
  border-radius: 6px;
  background: #f1f5f2;
  color: var(--ink);
  padding: 8px;
  line-height: 1.35;
  font-size: 12px;
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
  grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.85fr) minmax(280px, 0.75fr);
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
.task-meta {
  display: grid;
  gap: 6px;
  margin-top: 9px;
  color: var(--muted);
}
.task-meta span {
  color: var(--ink);
  font-size: 12px;
  font-weight: 760;
}
.task-meta ul {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-left: 18px;
  line-height: 1.35;
}
.task-origin {
  margin-top: 9px;
  border-left: 3px solid var(--accent);
  padding-left: 10px;
  color: var(--muted);
  line-height: 1.4;
}
.task-origin strong {
  display: block;
  color: var(--ink);
  font-size: 12px;
}
.backlog-panel {
  display: grid;
  align-content: start;
  gap: 12px;
}
.backlog-summary {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfa;
  padding: 12px;
}
.backlog-summary strong {
  font-size: 16px;
}
.backlog-summary p,
.backlog-item p,
.backlog-note {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}
.backlog-list {
  display: grid;
  gap: 10px;
}
.backlog-item {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.backlog-item header {
  display: flex;
  gap: 10px;
  align-items: start;
  justify-content: space-between;
}
.backlog-item strong {
  overflow-wrap: anywhere;
}
.status-pill.compact {
  min-height: 24px;
  padding: 3px 8px;
  font-size: 12px;
  white-space: nowrap;
}
.backlog-meta {
  display: grid;
  gap: 5px;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.35;
}
.backlog-meta span {
  overflow-wrap: anywhere;
}
.active-plan-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.plan-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
}
.plan-card header {
  display: flex;
  gap: 8px;
  align-items: start;
  justify-content: space-between;
}
.plan-card strong {
  overflow-wrap: anywhere;
}
.plan-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.4;
}
.plan-card ul {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.35;
}
.plan-card a {
  color: var(--accent-strong);
  font-weight: 760;
  text-decoration: none;
}
.plan-warning {
  border-left: 3px solid var(--amber);
  padding-left: 9px;
  color: var(--warn);
  font-size: 13px;
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
.template-proof {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}
.template-proof b {
  color: var(--ink);
}
.template-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.template-badges span {
  min-height: 22px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #f8fafc;
  color: var(--muted);
  padding: 3px 7px;
  font-size: 11px;
  font-weight: 720;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.template-button[aria-current="true"] .template-badges span {
  border-color: rgba(15, 118, 110, 0.28);
  background: #ffffff;
  color: var(--accent-strong);
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
.evidence-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
}
.evidence-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}
.evidence-card span {
  display: block;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.evidence-card strong {
  display: block;
  margin-top: 6px;
  overflow-wrap: anywhere;
}
.evidence-card p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}
.decision-checkpoint {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
  border: 1px solid #d8c37a;
  border-radius: 8px;
  background: #fff8e1;
  padding: 12px;
}
.decision-checkpoint header {
  grid-column: 1 / -1;
}
.decision-checkpoint header p {
  margin: 6px 0 0;
  color: var(--warn);
  line-height: 1.45;
}
.decision-checkpoint article {
  min-width: 0;
  border: 1px solid #ecdca7;
  border-radius: 6px;
  background: #fffdf5;
  padding: 10px;
}
.decision-checkpoint span {
  display: block;
  color: var(--warn);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.decision-checkpoint strong {
  display: block;
  margin-top: 5px;
  overflow-wrap: anywhere;
}
.decision-checkpoint p {
  margin: 7px 0 0;
  color: #6b5414;
  font-size: 13px;
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
  .review-prompt-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .owner-decisions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .active-plan-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .right-rail {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 840px) {
  .shell { padding: 24px 16px 32px; }
  .command-board, .entry-strip, .review-prompt-grid, .decision-strip, .owner-decisions, .next-grid, .active-plan-strip, .workbench, .right-rail, .knowledge-layout, .roadmap-list {
    grid-template-columns: 1fr;
  }
  h1 { font-size: 30px; }
  .entry-actions, .meta-grid, .report-grid, .report-digest, .guard-grid, .proof-stats, .flow-map {
    grid-template-columns: 1fr;
  }
  .evidence-strip {
    grid-template-columns: 1fr;
  }
  .decision-checkpoint {
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
    ["契约 / Schema", card.schemaVersion],
    ["风险 / Risk", card.riskLevel],
    ["审批 / Approval", card.approvalStatus],
    ["共享 / Share", card.sharePermission],
    ["模型路由 / Model route", card.modelRoute.actual + (card.modelRoute.mock ? " / mock" : "")],
    ["数据 / Data", card.dataClassification + " / " + card.redactionStatus],
    ["输入 / Inputs", String(card.metrics.inputDocumentCount)],
    ["人工复核 / Human review", card.metrics.requiresHumanReview ? "required" : "not required"]
  ];
  return '<dl class="meta-grid">' + entries.map(function (entry) {
    return '<div><dt>' + escapeHtml(entry[0]) + '</dt><dd>' + escapeHtml(entry[1]) + '</dd></div>';
  }).join("") + '</dl>';
}

function renderTaskMetaList(label, items, limit) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }
  const visibleItems = items.slice(0, limit);
  const overflowCount = Math.max(0, items.length - visibleItems.length);
  return '<div class="task-meta">' +
    '<span>' + escapeHtml(label) + '</span>' +
    '<ul>' + visibleItems.map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join("") +
      (overflowCount > 0 ? '<li>+' + String(overflowCount) + ' more</li>' : '') +
    '</ul>' +
  '</div>';
}

function renderTaskOrigin(origin) {
  if (!origin || typeof origin !== "object") {
    return "";
  }
  const findingIds = Array.isArray(origin.sourceFindingIds)
    ? origin.sourceFindingIds.join(", ")
    : "";
  const recommendationIds = Array.isArray(origin.sourceRecommendationIds)
    ? origin.sourceRecommendationIds.join(", ")
    : "";
  const parts = [
    origin.candidateWorkItemId ? "candidateWorkItemId=" + origin.candidateWorkItemId : "",
    findingIds ? "sourceFindingIds=" + findingIds : "",
    recommendationIds ? "sourceRecommendationIds=" + recommendationIds : "",
    origin.humanApprovalRef ? "humanApprovalRef=" + origin.humanApprovalRef : ""
  ].filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  return '<div class="task-origin">' +
    '<strong>候选来源 / Candidate origin</strong>' +
    escapeHtml(parts.join("; ")) +
  '</div>';
}

function compactJoin(items, fallback) {
  return Array.isArray(items) && items.length > 0 ? items.join(", ") : fallback;
}

function renderDecayPreventionBacklog(entry) {
  const backlog = entry.extensions?.["ai-hrms.decayPreventionBacklog"];
  if (!backlog || !Array.isArray(backlog.items)) {
    return '<div class="section-heading">' +
      '<p class="eyebrow">衰减预防 / Decay prevention</p>' +
      '<h2>暂无已复核 backlog / No reviewed backlog</h2>' +
    '</div>';
  }

  const items = backlog.items.slice(0, 3).map(function (item) {
    const implementationRefs = compactJoin(item.implementationRefs, "none");
    return '<article class="backlog-item">' +
      '<header><strong>' + escapeHtml(item.candidateWorkItemId + " -> " + item.formalTaskId) +
        '</strong><span class="status-pill compact">' + escapeHtml(item.status) + '</span></header>' +
      '<p>优先级 / Priority: ' + escapeHtml(item.priority) + '; 风险 / Risk: ' +
        escapeHtml(item.riskLevel) + '</p>' +
      '<div class="backlog-meta">' +
        '<span>owner: ' + escapeHtml(compactJoin(item.ownerActorTypes, "HumanActor")) + '</span>' +
        '<span>sourceFindingIds: ' + escapeHtml(compactJoin(item.sourceFindingIds, "none")) + '</span>' +
        '<span>sourceRecommendationIds: ' + escapeHtml(compactJoin(item.sourceRecommendationIds, "none")) + '</span>' +
        '<span>verify: ' + escapeHtml(compactJoin(item.verificationCommands, "pnpm check")) + '</span>' +
        '<span>writeSet: ' + escapeHtml(compactJoin(item.writeSet, "read-only")) + '</span>' +
        '<span>implementationRefs: ' + escapeHtml(implementationRefs) + '</span>' +
      '</div>' +
    '</article>';
  }).join("");

  return '<div class="section-heading">' +
      '<p class="eyebrow">衰减预防 / Decay prevention</p>' +
      '<h2>人工复核 backlog / Human-reviewed backlog</h2>' +
    '</div>' +
    '<section class="backlog-summary" aria-label="衰减预防 backlog 摘要 / Decay prevention backlog summary">' +
      '<strong>只追踪候选项，不自动执行 / Tracking only, no automatic execution</strong>' +
      '<p>promotionPolicy=' + escapeHtml(backlog.promotionPolicy) +
        '; humanApprovalRef=' + escapeHtml(backlog.humanApprovalRef) +
        '; autoCreateExternalIssues=' + escapeHtml(String(backlog.autoCreateExternalIssues)) + '</p>' +
      '<p>自我审查输出仍需 human owner 复核；不会自动修改仓库、创建外部 issue/PR、发布 Commons、训练模型或给成员创造义务。 / Self-review output still needs human owner review. It does not automatically modify the repo, create external issues or PRs, publish Commons assets, train models, or create member obligations.</p>' +
    '</section>' +
    '<div class="backlog-list">' + items + '</div>' +
    '<p class="backlog-note">高风险 live connector 仍需要 ApprovalGate；该面板只读取本地 manifest。 / High-risk live connector work still requires ApprovalGate; this panel only reads the local manifest.</p>';
}

function renderActivePlans() {
  const plans = state.activePlans || [];
  if (plans.length === 0) {
    document.getElementById("activePlans").innerHTML = "";
    return;
  }

  document.getElementById("activePlans").innerHTML = plans.map(function (plan) {
    const goalItems = (plan.goals || []).slice(0, 2).map(function (goal) {
      return '<li>' + escapeHtml(goal) + '</li>';
    }).join("");
    const decisionPreview = plan.humanDecisionPreview.length > 0
      ? plan.humanDecisionPreview.join(" / ")
      : "无阻塞决策 / no blocking decision";
    return '<article class="plan-card">' +
      '<header><strong>' + escapeHtml(plan.title) + '</strong><span class="status-pill compact">' +
        escapeHtml(plan.status) + '</span></header>' +
      '<p>计划入口 / Plan entry: <a href="' + escapeHtml(plan.href) + '">' +
        escapeHtml(plan.filename) + '</a></p>' +
      '<p>决策点 / Human decisions: ' + escapeHtml(String(plan.humanDecisionCount)) + '</p>' +
      (goalItems ? '<ul>' + goalItems + '</ul>' : '') +
      '<p class="plan-warning">只读计划入口，不是自动实现授权。 / Read-only plan entry, not automatic implementation authorization.</p>' +
      (plan.planOnly
        ? '<p class="plan-warning">该计划包含非目标或待决策边界。 / This plan includes non-goals or decision boundaries.</p>'
        : '') +
      '<p>预览 / Preview: ' + escapeHtml(decisionPreview) + '</p>' +
    '</article>';
  }).join("");
}

function renderOwnerDecisionQueue() {
  const tasks = state.operatingEntry.currentTasks || [];
  const highRiskTasks = tasks.filter(function (task) { return task.riskLevel === "high"; });
  const plansWithDecisions = (state.activePlans || []).filter(function (plan) {
    return plan.humanDecisionCount > 0;
  });
  const decayBacklog = state.operatingEntry.extensions?.["ai-hrms.decayPreventionBacklog"];
  const activeBacklogItem = decayBacklog?.items?.find(function (item) {
    return item.status === "active";
  });

  const queueItems = [
    ...plansWithDecisions.slice(0, 2).map(function (plan) {
      return {
        label: "计划决策 / Plan decision",
        status: String(plan.humanDecisionCount) + " pending",
        title: plan.title,
        detail: plan.humanDecisionPreview.join(" / "),
        command: plan.filename
      };
    }),
    ...highRiskTasks.slice(0, 1).map(function (task) {
      return {
        label: "高风险候选 / High-risk candidate",
        status: task.riskLevel,
        title: task.title,
        detail: "需要 human owner 决策、ApprovalGate、secret 边界和数据生命周期设计。 / Requires human owner decision, ApprovalGate, secret boundary, and data lifecycle design.",
        command: task.taskId
      };
    }),
    activeBacklogItem
      ? {
          label: "人工复核 / Human review",
          status: activeBacklogItem.status,
          title: activeBacklogItem.formalTaskId,
          detail: "衰减预防 backlog 只追踪来源和验证；不自动创建 issue、发布 Commons 或修改仓库。 / Decay prevention backlog only tracks provenance and validation; it does not create issues, publish Commons assets, or modify the repo automatically.",
          command: activeBacklogItem.candidateWorkItemId
        }
      : null
  ].filter(Boolean).slice(0, 4);

  document.getElementById("ownerDecisionQueue").innerHTML =
    '<div class="decision-queue-intro">' +
      '<p class="eyebrow">需要 owner 决策 / Owner Decision Queue</p>' +
      '<h2>候选决策，不是自动分派 / Candidate decisions, not automatic assignments</h2>' +
      '<p>这里集中展示会影响架构、连接器、数据生命周期或自审晋升的人工 checkpoint。拒绝、延后、缩小范围或转交都不能成为负面贡献信号。 / This queue gathers human checkpoints that affect architecture, connectors, data lifecycle, or self-review promotion. Refusal, delay, scope reduction, or transfer must not become a negative contribution signal.</p>' +
    '</div>' +
    queueItems.map(function (item) {
      return '<article class="decision-queue-item">' +
        '<header><span class="eyebrow">' + escapeHtml(item.label) + '</span><span class="status-pill compact">' +
          escapeHtml(item.status) + '</span></header>' +
        '<strong>' + escapeHtml(item.title) + '</strong>' +
        '<p>' + escapeHtml(item.detail) + '</p>' +
        '<code>' + escapeHtml(item.command) + '</code>' +
      '</article>';
    }).join("");
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
      '<h2>当前任务队列 / Current task queue</h2>' +
      '<p>默认下一条命令 / Default next command: <strong>' + escapeHtml(startupCommand) + '</strong></p>' +
    '</div>' +
    (activeTask ? '<section class="active-task">' +
      '<span>当前 P0 WorkItem / Active P0 WorkItem</span>' +
      '<strong>' + escapeHtml(activeTask.taskId) + '</strong>' +
      '<p>' + escapeHtml(activeTask.title) + '</p>' +
      '<div class="chip-row">' +
        (activeTask.outputs || []).slice(0, 4).map(function (output) {
          return '<span>' + escapeHtml(output) + '</span>';
        }).join("") +
      '</div>' +
    '</section>' : '') +
    '<div class="task-list">' + taskGroups.map(function (group) {
      return '<section class="task-lane" aria-label="' + escapeHtml(group.priority) + ' 任务 / tasks">' +
        '<h3>' + escapeHtml(group.priority) + ' 队列 / lane</h3>' +
        group.tasks.slice(0, 3).map(function (task) {
          return '<article class="task-card">' +
            '<header><strong>' + escapeHtml(task.title) + '</strong><span class="priority-pill">' +
              escapeHtml(task.priority) + '</span></header>' +
            '<p>任务 ID / TaskId: ' + escapeHtml(task.taskId) + '</p>' +
            '<p>负责人 / Owner: ' + escapeHtml(task.ownerActorTypes.join(" + ")) + '</p>' +
            '<p>风险 / Risk: ' + escapeHtml(task.riskLevel) + '; 验证 / verify: ' +
              escapeHtml(task.verificationCommands.join(" / ")) + '</p>' +
            '<p>writeSet: ' + escapeHtml(task.suggestedWriteSet.join(", ")) + '</p>' +
            renderTaskMetaList("验收 / Acceptance", task.acceptanceCriteria, 2) +
            renderTaskMetaList("来源 / Sources", task.sourceRefs, 2) +
            renderTaskOrigin(task.candidateOrigin) +
            (task.riskLevel === "high"
              ? '<p class="risk-note">任何 live 执行前都需要 human owner 决策和 ApprovalGate。 / Human owner decision and ApprovalGate are required before any live execution.</p>'
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
      '<p class="eyebrow">执行防护 / Harness Guards</p>' +
      '<h2>AgentWorkLease、writeSet、MergeGate 与 checkpoint / AgentWorkLease, writeSet, MergeGate, checkpoint</h2>' +
    '</div>' +
    '<section class="lease-preview" aria-label="当前 AgentWorkLease 预览 / Current AgentWorkLease preview">' +
      '<strong>当前 shard 的 AgentWorkLease 预览 / AgentWorkLease preview for current shard</strong>' +
      '<dl>' +
        '<div><dt>readSet</dt><dd>config/project-operating-entry.json; generated ExecutionReportCard JSON</dd></div>' +
        '<div><dt>writeSet</dt><dd>apps/web/bin/build-demo.mjs; packages/demo/test/web-workbench-build.test.mjs</dd></div>' +
        '<div><dt>validationCommands</dt><dd>pnpm web:demo; pnpm check</dd></div>' +
        '<div><dt>rollbackPlan</dt><dd>回退本次静态 Web Workbench 文案并重建 dist/web / revert this static Web Workbench change and rebuild dist/web</dd></div>' +
      '</dl>' +
    '</section>' +
    '<div class="guard-grid">' +
      '<section class="guard-block"><strong>AgentWorkLease 字段 / AgentWorkLease fields</strong><p>' +
        escapeHtml(leaseFields.join(", ")) + '</p></section>' +
      '<section class="guard-block"><strong>writeSet 策略 / writeSet policy</strong><p>' +
        escapeHtml(entry.conflictRules.defaultWriteSetPolicy) + '; ' + escapeHtml(mergeRule) + '</p>' +
        '<ul>' + conflictRuleItems + '</ul></section>' +
      '<section class="guard-block"><strong>停止条件 / Stop conditions</strong><p>' +
        escapeHtml(stopRules.slice(0, 3).join(" / ")) + '</p></section>' +
      '<section class="guard-block"><strong>执行原则 / Harness principles</strong><p>' +
        escapeHtml(entry.harnessPrinciples.slice(0, 3).join(" / ")) + '</p></section>' +
    '</div>';

  document.getElementById("decayBacklog").innerHTML = renderDecayPreventionBacklog(entry);
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

function renderReviewPrompts() {
  document.getElementById("reviewPrompts").innerHTML = state.reviewPrompts.map(function (item) {
    return '<article class="review-prompt-card">' +
      '<span>' + escapeHtml(item.label) + '</span>' +
      '<strong>' + escapeHtml(item.focus) + '</strong>' +
      '<p>' + escapeHtml(item.prompt) + '</p>' +
    '</article>';
  }).join("");
}

function renderHumanDecisionCheckpoint(card, firstNextAction) {
  const reviewRequired = card.metrics.requiresHumanReview === true;
  const approvalNeeded = card.approvalStatus === "requires_human_review";
  const approvalGateDecision = card.approvalGate?.decision || card.approvalStatus;
  const decisionItems = [
    {
      label: "Owner 决策 / Owner decision",
      title: reviewRequired ? card.humanOwnerId : "无 owner 动作待处理 / No owner action pending",
      detail: reviewRequired
        ? "HumanActor 接受、编辑、延后或拒绝前，只能把输出视为候选证据。 / Treat this output as candidate evidence until a HumanActor accepts, edits, defers, or rejects it."
        : "阅读渲染输出前，当前报告卡不需要人工 checkpoint。 / The current report card does not require a human checkpoint before reading the rendered output."
    },
    {
      label: "ApprovalGate",
      title: approvalGateDecision,
      detail: approvalNeeded
        ? "审批前，不得据此执行副作用、发布、分派、共享或训练。 / Do not execute side effects, publish, assign, share, or train from this card before approval."
        : "该 demo 卡未请求高风险副作用。 / No high-risk side effect is requested by this demo card."
    },
    {
      label: "下一选择 / Next choice",
      title: firstNextAction ? firstNextAction.action : "无候选动作 / No candidate action",
      detail: firstNextAction
        ? firstNextAction.reason
        : "保留为审计材料，不自动创建 WorkItem。 / Keep the card as an audit artifact; no automatic WorkItem is created."
    }
  ];

  return '<section class="decision-checkpoint" aria-label="人工决策 checkpoint / Human decision checkpoint">' +
    '<header><p class="eyebrow">人工决策 checkpoint / Human decision checkpoint</p>' +
      '<h3>继续前需要人确认什么 / What needs a person before this moves forward</h3>' +
      '<p>AI 输出仍是建议，不是命令；拒绝、延后、缩小范围或转交不能成为负面贡献信号。 / AI output remains a recommendation. Refusal, delay, scope reduction, or transfer must not become a negative contribution signal.</p></header>' +
    decisionItems.map(function (item) {
      return '<article><span>' + escapeHtml(item.label) + '</span><strong>' + escapeHtml(item.title) +
        '</strong><p>' + escapeHtml(item.detail) + '</p></article>';
    }).join("") +
  '</section>';
}

function renderReport(card) {
  const toolItems = card.toolContractRefs.map(function (tool) {
    return {
      toolName: tool.toolName,
      detail: tool.riskLevel + " 风险 / risk, autoExecute=" + String(tool.autoExecute)
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
  const firstTemplateEvaluationSample = templateEvaluationSamples[0];
  const evalSampleItem = card.evalSample
    ? [
        {
          title: card.evalSample.sampleType,
          detail:
            "状态 / status: " +
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
    '<section class="report-digest" aria-label="报告卡摘要 / Report card digest">' +
      '<div><span>状态 / Status</span><strong>' + escapeHtml(card.status) + '</strong></div>' +
      '<div><span>风险 / Risk</span><strong>' + escapeHtml(card.riskLevel) + '</strong></div>' +
      '<div><span>审批 / Approval</span><strong>' + escapeHtml(card.approvalStatus) + '</strong></div>' +
      '<div><span>数据 / Data</span><strong>' + escapeHtml(card.dataClassification) + '</strong></div>' +
      '<div class="wide"><span>候选下一步 / Candidate next action</span><strong>' +
        escapeHtml(firstNextAction ? firstNextAction.action : "人工复核 / Human review") + '</strong></div>' +
      '<p class="wide">ExecutionReportCard JSON 是 canonical 事实源；Markdown、HTML 和 Web Workbench 只是复核渲染。 / ExecutionReportCard JSON is canonical. Markdown, HTML, and this Web Workbench are renders for review.</p>' +
    '</section>' +
    '<section class="evidence-strip" aria-label="报告卡证据条 / Report-card evidence strip">' +
      '<article class="evidence-card"><span>Canonical JSON source / canonical JSON 来源</span><strong>' +
        escapeHtml(card.reportCardId) + '</strong><p>使用 JSON 链接进行审计、重放和报告卡校验。 / Use the JSON link for audit, replay, and report-card validation.</p></article>' +
      '<article class="evidence-card"><span>评测样本 / Eval samples</span><strong>' +
        escapeHtml(firstTemplateEvaluationSample ? firstTemplateEvaluationSample.sampleId : "none") +
        '</strong><p>candidate, reviewRequired=' + escapeHtml(String(card.templateEvaluationSamples?.reviewRequired === true)) +
        '</p></article>' +
      '<article class="evidence-card"><span>失败路径 / Failure path</span><strong>' +
        escapeHtml(card.failureSample.failureType) + '</strong><p>' +
        escapeHtml(card.failureSample.statusIfTriggered) + '</p></article>' +
      '<article class="evidence-card"><span>审批 / 数据边界 / Approval / data boundary</span><strong>' +
        escapeHtml(card.approvalStatus) + '</strong><p>' +
        escapeHtml(card.dataClassification + ", " + card.redactionStatus + ", " + card.sharePermission) +
        '</p></article>' +
    '</section>' +
    renderHumanDecisionCheckpoint(card, firstNextAction) +
    renderMeta(card) +
    '<div class="report-grid">' +
      '<section><h3>发现 / Findings</h3>' + renderList(card.findings, "title") + '</section>' +
      '<section><h3>建议 / Recommendations</h3>' + renderList(card.recommendations, "title") + '</section>' +
      '<section><h3>候选下一步 / Candidate Next Actions</h3>' + renderList(card.nextActions, "action") + '</section>' +
      '<section><h3>工具契约 / Tool Contracts</h3>' + renderList(toolItems, "toolName") + '</section>' +
      (allCandidateWorkItems.length > 0
        ? '<section class="wide"><h3>候选 WorkItems / Candidate WorkItems</h3>' + renderList(allCandidateWorkItems.map(function (item) {
            return {
              title: (item.candidateWorkItemId ? item.candidateWorkItemId + " / " : "") + item.title,
              detail:
                "状态 / status: " + item.status +
                ", approvalRequired=" + String(item.approvalRequired === true) +
                ", 负责人 / owner: " + (item.ownerActorTypes || []).join(" + ") +
                ", " + item.priority +
                ", " + item.riskLevel +
                ", writeSet: " + item.suggestedWriteSet.join(", ")
            };
          }), "title") + '</section>'
        : '') +
      (suggestedWorkShards.length > 0
        ? '<section class="wide"><h3>候选 WorkShards / Candidate WorkShards</h3>' + renderList(suggestedWorkShards.map(function (shard) {
            return {
              title: shard.shardId + " / " + shard.ownerAgentRole,
              detail: "候选 shard，未分派 / candidate shard, not assigned, " + shard.riskLevel + ", modelRoute: " + shard.modelRoute + ", verify: " +
                shard.validationCommands.join(" / ") + ", writeSet: " + (shard.writeSet.length > 0 ? shard.writeSet.join(", ") : "read-only")
            };
          }), "title") + '</section>'
        : '') +
      '<section class="wide"><h3>输入引用 / Input Refs</h3>' + renderList(inputItems, "path") + '</section>' +
      (evalSampleItem.length > 0
        ? '<section><h3>候选评测样本 / Eval Sample Candidate</h3>' + renderList(evalSampleItem, "title") + '</section>'
        : '') +
      (templateEvaluationSamples.length > 0
        ? '<section class="wide"><h3>模板评测样本 / Template Evaluation Samples</h3>' + renderList(templateEvaluationSamples.map(function (sample) {
            return {
              title: sample.sampleId,
              detail: sample.purpose + " 失败模式 / Failure mode: " + sample.failureModeCovered
            };
          }), "title") + '</section>'
        : '') +
      '<section class="wide"><h3>失败路径样本 / Failure Path Sample</h3>' +
        renderList([{ title: card.failureSample.failureType, detail: card.failureSample.recovery }], "title") +
      '</section>' +
    '</div>' +
    '<footer class="data-links">' +
      '<a href="' + escapeHtml(card.jsonHref) + '">打开 canonical JSON / Open canonical JSON</a>' +
      '<a href="' + escapeHtml(card.markdownHref) + '">打开 Markdown 渲染 / Open Markdown render</a>' +
      (card.answerCardHref ? '<a href="' + escapeHtml(card.answerCardHref) + '">打开 AnswerCard JSON / Open AnswerCard JSON</a>' : '') +
      (card.docChallengeDraftHref ? '<a href="' + escapeHtml(card.docChallengeDraftHref) + '">打开 ChallengeDraft JSON / Open ChallengeDraft JSON</a>' : '') +
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
        '<button type="button" data-challenge-source="' + String(index) + '">挑战此点 / Challenge this point</button>' +
        '<a href="' + escapeHtml(example.docChallengeDraftHref) + '">打开草稿 / Open draft</a>' +
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
      '<div><dt>契约 / Schema</dt><dd>' + escapeHtml(answerCard.schemaVersion) + '</dd></div>' +
      '<div><dt>置信度 / Confidence</dt><dd>' + escapeHtml(answerCard.confidence) + '</dd></div>' +
      '<div><dt>来源 / Sources</dt><dd>' + String(example.sourceHitCount) + '</dd></div>' +
      '<div><dt>共享 / Share</dt><dd>' + escapeHtml(answerCard.sharePermission) + '</dd></div>' +
    '</dl>' +
    '<section><h3>来源 / Sources</h3><ul class="source-list">' + sourceItems + '</ul></section>' +
    '<p class="challenge-status" id="challengeStatus">挑战动作只生成复核草稿，不修改来源文档。 / Challenge actions create draft review material only. No source document is modified.</p>' +
    '<footer class="data-links">' +
      '<a href="' + escapeHtml(example.answerCardHref) + '">打开 AnswerCard JSON / Open AnswerCard JSON</a>' +
      '<a href="' + escapeHtml(example.docChallengeDraftHref) + '">打开 ChallengeDraft JSON / Open ChallengeDraft JSON</a>' +
      '<a href="' + escapeHtml(example.reportCardHref) + '">打开 ReportCard JSON / Open ReportCard JSON</a>' +
    '</footer>';

  document.querySelectorAll("[data-challenge-source]").forEach(function (button) {
    button.addEventListener("click", function () {
      const source = answerCard.sourceRefs[Number(button.dataset.challengeSource)];
      document.getElementById("challengeStatus").textContent =
        "已为 " + source.path + ":L" + source.lineStart +
        " 准备挑战草稿；任何文档修改前都需要人工复核。 / Draft challenge prepared for " + source.path + ":L" +
        source.lineStart + ". Human review is required before any documentation change.";
    });
  });
}

function renderTemplateBadges(card) {
  const route = card.modelRoute.mock ? "mock route" : card.modelRoute.actual;
  const badges = [
    "风险 / Risk: " + card.riskLevel,
    "审批 / Approval: " + card.approvalStatus,
    "路由 / Route: " + route,
    "共享 / Share: " + card.sharePermission
  ];
  return '<div class="template-badges" aria-label="模板治理标记 / Template governance badges">' +
    badges.map(function (badge) {
      return '<span>' + escapeHtml(badge) + '</span>';
    }).join("") +
  '</div>';
}

function renderTemplates() {
  document.getElementById("templateList").innerHTML = state.cards.map(function (card) {
    const current = card.templateId === selectedTemplateId;
    const firstEvalSample = card.templateEvaluationSamples?.samples?.[0];
    const proofLine = firstEvalSample
      ? "评测 / Eval: " + firstEvalSample.sampleId + "; 失败路径 / failure: " + card.failureSample.failureType
      : "评测 / Eval: missing; 失败路径 / failure: " + card.failureSample.failureType;
    return '<button type="button" class="template-button" data-template="' + escapeHtml(card.templateId) + '" aria-current="' + String(current) + '">' +
      '<strong>' + escapeHtml(card.displayName) + '</strong>' +
      '<span>' + escapeHtml(card.taskGoal) + '</span>' +
      '<span class="template-proof"><b>评测证据 / Eval evidence</b> ' + escapeHtml(proofLine) + '</span>' +
      renderTemplateBadges(card) +
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
  document.getElementById("entryInlineActionTitle").textContent = selected.action;
  document.getElementById("entryInlineCommand").textContent = selected.command;
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
  renderReviewPrompts();
  renderOperatingEntry();
  renderActivePlans();
  renderOwnerDecisionQueue();
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
const activePlans = await readActivePlans();

const state = {
  generatedAt: new Date().toISOString(),
  runtimeMode: "Demo Mode",
  dataSource: "packages/demo shared engine",
  operatingEntry,
  activePlans,
  entryModes,
  roadmap,
  proofStats,
  reviewPrompts,
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
