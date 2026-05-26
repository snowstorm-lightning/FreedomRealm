import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const operatingEntryPath = "config/project-operating-entry.json";
const activePlansPath = "docs/zh-CN/execution-plans/active";

export const templateIds = [
  "repo_understanding_and_work_plan",
  "knowledge_navigation_and_challenge",
  "external_agent_connector_safety_demo",
  "issue_pr_triage_and_review",
  "personal_work_proof",
  "project_self_review_and_decay_prevention",
  "docs_review_and_improvement"
];

export const knowledgeQueries = [
  "FreedomRealm 下一步应该做什么？",
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
    command: "pnpm knowledge:demo -- --query \"FreedomRealm 下一步应该做什么？\""
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
    focus: "FreedomRealm"
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

const feedbackTargets = [
  {
    label: "定位清晰 / Positioning clarity",
    cue: "30 秒内能否看懂项目不是传统 HRMS，也不是普通 agent framework？ / Can the reviewer tell in 30 seconds that this is not traditional HRMS or a generic agent framework?",
    anchor: "FreedomRealm"
  },
  {
    label: "治理边界 / Governance boundary",
    cue: "ApprovalGate、数据分级、审计和回滚是否足够显眼？ / Are ApprovalGate, data classification, audit, and rollback visible enough?",
    anchor: "ApprovalGate"
  },
  {
    label: "下一步清楚 / Next action clarity",
    cue: "候选建议、人类决策和不可自动推进的事项是否分开？ / Are candidate suggestions, human decisions, and blocked auto-progress separated?",
    anchor: "Owner Decision Queue"
  },
  {
    label: "视觉负担 / Visual load",
    cue: "哪些内容太密、太轻或太隐蔽，影响修改意见？ / What feels too dense, too light, or too hidden for useful feedback?",
    anchor: "Workbench"
  }
];

const safetyBadges = [
  "仅 mock / Mock only",
  "无真实连接器 / No real connector",
  "无生产数据 / No production data",
  "无 secret / No secret",
  "保留 ApprovalGate / ApprovalGate preserved"
];

const languageBoundaryNotice =
  "页面框架提供中英双语；报告卡正文保持 canonical JSON 原文。 / UI frame is bilingual; report-card body keeps canonical JSON source text.";

const languageBoundary = [
  {
    label: "页面框架 / UI frame",
    detail: "导航、控制、提示和反馈入口提供中英双语。 / Navigation, controls, prompts, and feedback surfaces are bilingual."
  },
  {
    label: "报告卡原文 / Report-card source text",
    detail:
      "报告卡正文按 canonical JSON 原文展示，不自动翻译、摘要或改写事实。 / Report-card body content is rendered from canonical JSON as written; no automatic translation, summarization, or fact rewriting."
  },
  {
    label: "修改路径 / Change path",
    detail:
      "需要补中文或英文事实源时，转成候选 WorkItem 并由 human owner 复核。 / Missing Chinese or English source content becomes a candidate WorkItem for human owner review."
  }
];

const modeCards = [
  {
    mode: "Tiny Mode",
    audience: "低配设备与个人试用 / Low-resource devices and personal trials",
    boundary: "文件或 SQLite、mock 或人工接管；适合 Windows 个人用户起步。 / File or SQLite storage with mock or human handoff; good for Windows personal starts."
  },
  {
    mode: "Demo Mode",
    audience: "首次体验 / First run",
    boundary: "5-10 分钟跑通 mock 闭环，不需要模型 key、secret 或真实连接器。 / Runs the mock loop in 5-10 minutes with no model key, secret, or real connector."
  },
  {
    mode: "Local Mode",
    audience: "个人长期使用 / Long-term personal use",
    boundary: "本地数据库、基础审计、本地或远程模型路由；仍不绕过 ApprovalGate。 / Local database, basic audit, local or remote ModelRoute; still cannot bypass ApprovalGate."
  },
  {
    mode: "Community Mode",
    audience: "多人协作实例 / Multi-person instances",
    boundary: "角色权限、审批流、模板共享和可选 FederationLink；默认不共享私有数据。 / Roles, approval flows, shared templates, and optional FederationLink; private data is not shared by default."
  },
  {
    mode: "Enterprise Mode",
    audience: "强治理组织 / Strong-governance organizations",
    boundary: "Keycloak、Temporal、PostgreSQL、LiteLLM Proxy 和完整可观测性。 / Keycloak, Temporal, PostgreSQL, LiteLLM Proxy, and full observability."
  }
];

const learningTasks = [
  {
    id: "structure",
    label: "先看结构 / Structure first",
    title: "10 分钟理解仓库骨架 / Understand the repo shape in 10 minutes",
    summary:
      "从入口文档、执行计划、Demo engine、Web Workbench 和策略校验五条线建立项目地图。 / Build a project map through entry docs, execution plans, the demo engine, Web Workbench, and policy checks.",
    steps: [
      "读 README、ARCHITECTURE 和 docs/zh-CN/README，确认项目定位。",
      "看 project-operating-entry 和 active execution plans，确认当前下一步。",
      "进入 Web Workbench 和报告卡，理解 Demo Mode 的闭环数据从哪里来。"
    ],
    primaryHref: "./workbench.html#tasks",
    primaryAction: "打开当前任务 / Open current tasks"
  },
  {
    id: "loop",
    label: "跑通闭环 / Run the loop",
    title: "从 WorkItem 到 ReportCard / From WorkItem to ReportCard",
    summary:
      "沿着 WorkItem、AgentActor、ToolContract、ApprovalGate、Observation 和 ExecutionReportCard 看一遍 mock 执行链。 / Follow WorkItem, AgentActor, ToolContract, ApprovalGate, Observation, and ExecutionReportCard through the mock chain.",
    steps: [
      "先查看模板报告卡，不把渲染页面当事实源。",
      "确认 ApprovalGate、dataClassification 和 sharePermission 出现在报告卡中。",
      "再打开 canonical JSON，理解审计、评测和复核字段。"
    ],
    primaryHref: "./workbench.html#reports",
    primaryAction: "查看报告卡 / View report cards"
  },
  {
    id: "governance",
    label: "理解治理 / Governance",
    title: "知道哪些事不能自动做 / Know what cannot be automated",
    summary:
      "把 owner 决策、P2 live connector、self-review backlog 和 Go 控制面决策点分开看。 / Separate owner decisions, P2 live connectors, self-review backlog, and Go control-plane decisions.",
    steps: [
      "Owner Decision Queue 是候选决策，不是自动分派。",
      "live connector、secret、生产数据和高风险动作仍停在 ApprovalGate。",
      "Go 控制面 skeleton 需要 human owner 先确认技术边界。"
    ],
    primaryHref: "./workbench.html#decisions",
    primaryAction: "查看决策队列 / View decisions"
  }
];

const projectStructureModules = [
  {
    id: "entry-docs",
    layer: "入口层 / Entry",
    title: "项目入口与导航 / Project entry and navigation",
    detail:
      "AGENTS、README、ARCHITECTURE 和中文索引定义 agent 读仓库的起点。 / AGENTS, README, ARCHITECTURE, and the Chinese index define the starting path.",
    files: ["AGENTS.md", "README.md", "ARCHITECTURE.md", "docs/zh-CN/README.md"],
    href: toWebHref("docs/zh-CN/README.md")
  },
  {
    id: "operating",
    layer: "运行层 / Operating",
    title: "当前任务与执行计划 / Current tasks and execution plans",
    detail:
      "project-operating-entry.v1 是当前任务、分派规则、停止条件和防冲突规则的事实源。 / project-operating-entry.v1 is the source for tasks, assignment rules, stop conditions, and conflict guards.",
    files: ["config/project-operating-entry.json", "docs/zh-CN/project-operating-entry.md", "docs/zh-CN/execution-plans/active/"],
    href: "./workbench.html#tasks"
  },
  {
    id: "demo-engine",
    layer: "Demo 层 / Demo",
    title: "Demo Mode 和报告卡 / Demo Mode and report cards",
    detail:
      "packages/demo 生成 ExecutionReportCard；Web 只做可复核渲染。 / packages/demo generates ExecutionReportCard; Web only renders it for review.",
    files: ["packages/demo/src/", "config/templates/", "dist/web/data/"],
    href: "./workbench.html#reports"
  },
  {
    id: "web",
    layer: "可视层 / Visual",
    title: "Web 学习系统与工作台 / Web learning system and workbench",
    detail:
      "默认首页解释项目结构；Workbench 承载模板、报告卡、知识问答和 owner 队列。 / The default page explains structure; Workbench carries templates, report cards, knowledge Q&A, and the owner queue.",
    files: ["apps/web/bin/build-demo.mjs", "dist/web/index.html", "dist/web/workbench.html"],
    href: "./workbench.html"
  },
  {
    id: "contracts-policy",
    layer: "校验层 / Guard",
    title: "契约与策略校验 / Contracts and policy checks",
    detail:
      "contracts 和 policy 把环境隔离、ToolContract 和 manifest 规则变成可测试门禁。 / contracts and policy turn environment isolation, ToolContract, and manifest rules into testable gates.",
    files: ["packages/contracts/", "packages/policy/", "scripts/check.mjs"],
    href: toWebHref("docs/zh-CN/quality-gates.md")
  }
];

const learningPages = [
  {
    title: "项目学习首页 / Learning home",
    detail: "先看结构、路径和当前任务，降低单页信息压力。 / Start with structure, paths, and current tasks to reduce information load.",
    href: "./index.html"
  },
  {
    title: "完整工作台 / Full workbench",
    detail: "保留原报告卡、模板、知识问答和治理细节。 / Keeps report cards, templates, knowledge Q&A, and governance detail.",
    href: "./workbench.html"
  },
  {
    title: "当前任务 / Current tasks",
    detail: "直接跳到 P0/P1/P2、AgentWorkLease、MergeGate 和 backlog。 / Jump to P0/P1/P2, AgentWorkLease, MergeGate, and backlog.",
    href: "./workbench.html#tasks"
  },
  {
    title: "知识问答 / Ask maintained docs",
    detail: "用带来源的 AnswerCard 和 DocChallenge 理解文档。 / Use source-backed AnswerCard and DocChallenge to learn docs.",
    href: "./workbench.html#docs"
  }
];

function toWebHref(repoRelativePath) {
  const normalized = repoRelativePath.split(path.sep).join("/");
  const prefix = "dist/web/";
  return normalized.startsWith(prefix) ? `./${normalized.slice(prefix.length)}` : `../../${normalized}`;
}

function toWorkbenchCard(execution, index) {
  const { template, reportCard, output } = execution;
  const demo = reportCard.extensions["freedomrealm.demo"];
  const knowledge = reportCard.extensions["freedomrealm.knowledge"];
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
    workPlan: reportCard.extensions["freedomrealm.workPlan"] ?? null,
    selfReview: reportCard.extensions["freedomrealm.selfReview"] ?? null,
    answerCard: knowledge?.answerCard ?? null,
    docChallengeDraft: knowledge?.docChallengeDraft ?? null,
    answerCardHref: output.answerCardRelativePath ? toWebHref(output.answerCardRelativePath) : null,
    docChallengeDraftHref: output.docChallengeDraftRelativePath
      ? toWebHref(output.docChallengeDraftRelativePath)
      : null
  };
}

function toKnowledgeExample(execution, index) {
  const knowledge = execution.reportCard.extensions["freedomrealm.knowledge"];
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
  return {
    value: statusLines[0] || "Active",
    source: statusLines.length > 0 ? "explicit" : "inferred"
  };
}

export async function readActivePlans(repoRoot) {
  const planDir = path.join(repoRoot, activePlansPath);
  const filenames = (await readdir(planDir))
    .filter((filename) => filename.endsWith(".md"))
    .sort();
  return Promise.all(filenames.map(async (filename, index) => {
    const repoRelativePath = path.join(activePlansPath, filename).split(path.sep).join("/");
    const markdown = await readFile(path.join(repoRoot, repoRelativePath), "utf8");
    const title = markdown.match(/^#\s+(.+)$/mu)?.[1] || filename.replace(/\.md$/u, "");
    const humanDecisionBullets = extractBullets(markdown, "Human Owner 决策点", 5);
    const status = extractStatus(markdown);
    return {
      index,
      filename,
      path: repoRelativePath,
      title,
      status: status.value,
      statusSource: status.source,
      goals: extractBullets(markdown, "目标", 3),
      nonGoals: extractBullets(markdown, "非目标", 3),
      acceptance: extractBullets(markdown, "验收标准", 3),
      humanDecisionCount: humanDecisionBullets.length,
      humanDecisionPreview: humanDecisionBullets.slice(0, 5),
      planOnly:
        markdown.includes("不是本轮自动实现授权") ||
        markdown.includes("不在本计划创建") ||
        markdown.includes("不实现"),
      href: toWebHref(repoRelativePath)
    };
  }));
}


export async function readOperatingEntry(repoRoot) {
  return JSON.parse(await readFile(path.join(repoRoot, operatingEntryPath), "utf8"));
}

export function buildWebState({ operatingEntry, activePlans, executions, knowledgeExecutions }) {
  return {
    generatedAt: new Date().toISOString(),
    runtimeMode: "Demo Mode",
    dataSource: "packages/demo shared engine",
    operatingEntry,
    activePlans,
    entryModes,
    roadmap,
    proofStats,
    reviewPrompts,
    feedbackTargets,
    safetyBadges,
    languageBoundaryNotice,
    languageBoundary,
    modeCards,
    learningTasks,
    projectStructureModules,
    learningPages,
    cards: executions.map(toWorkbenchCard),
    knowledgeExamples: knowledgeExecutions.map(toKnowledgeExample)
  };
}
