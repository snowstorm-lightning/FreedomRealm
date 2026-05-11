import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXECUTION_REPORT_CARD_SCHEMA_VERSION,
  renderExecutionReportCardMarkdown,
  validateExecutionReportCard
} from "../packages/contracts/src/index.mjs";
import { evaluateToolExecution } from "../packages/policy/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const defaultInputs = [
  "README.md",
  "docs/zh-CN/README.md",
  "docs/zh-CN/capability-development-and-mvp.md",
  "docs/zh-CN/architecture-blueprint.md"
];

function parseArgs(argv) {
  const options = {
    template: "docs_review_and_improvement",
    model: "mock",
    out: "dist/demo-mode",
    inputs: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--template") {
      options.template = next;
      index += 1;
    } else if (arg === "--model") {
      options.model = next;
      index += 1;
    } else if (arg === "--out") {
      options.out = next;
      index += 1;
    } else if (arg === "--input") {
      options.inputs.push(next);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!["mock", "live"].includes(options.model)) {
    throw new Error("--model must be mock or live.");
  }

  if (options.inputs.length === 0) {
    options.inputs = defaultInputs;
  }

  return options;
}

function printHelp() {
  console.log(`Usage: pnpm demo [--template docs_review_and_improvement] [--model mock|live] [--input path] [--out dist/demo-mode]

Demo Mode is CLI-first and writes JSON ExecutionReportCard as the canonical source.
The default model route is mock. The live route is optional and falls back to mock unless AI_HRMS_LIVE_MODEL_ENABLED=true.`);
}

function workspacePath(relativeOrAbsolutePath) {
  const absolutePath = path.resolve(repoRoot, relativeOrAbsolutePath);
  const relativePath = path.relative(repoRoot, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Input path must stay inside the workspace: ${relativeOrAbsolutePath}`);
  }
  return { absolutePath, relativePath: relativePath.split(path.sep).join("/") };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function collectInputRefs(inputs) {
  const refs = [];
  for (const input of inputs) {
    const { absolutePath, relativePath } = workspacePath(input);
    const content = await readFile(absolutePath, "utf8");
    refs.push({
      refId: `input-${refs.length + 1}`,
      kind: "repository_document",
      path: relativePath,
      digest: `sha256:${sha256(content)}`,
      byteLength: Buffer.byteLength(content),
      dataClassification: "internal",
      retention: "local-demo-run"
    });
  }
  return refs;
}

function buildMockAnalysis() {
  return {
    summary:
      "Mock analysis: the selected AI-HRMS documents already define a CLI-first Demo Mode path, JSON-first report cards, and governance boundaries. The MVP should keep the first template narrow: document review suggestions only, no automatic document edits.",
    findings: [
      {
        id: "finding-001",
        title: "CLI-first boundary is clear",
        detail:
          "The docs consistently say Demo Mode should run from CLI first and Web UI should later read the same execution data."
      },
      {
        id: "finding-002",
        title: "Report-card canonical source is explicit",
        detail:
          "ExecutionReportCard is defined as JSON with schemaVersion; Markdown and future UI views are renderers."
      },
      {
        id: "finding-003",
        title: "Human review remains required",
        detail:
          "The template produces recommendations only. It does not modify source documents and keeps ApprovalGate visible."
      }
    ],
    recommendations: [
      {
        id: "recommendation-001",
        title: "Keep the first template low dependency",
        detail:
          "Use repository documents as input and avoid external connectors, real HR data, and live model keys for MVP acceptance."
      },
      {
        id: "recommendation-002",
        title: "Treat mock output as a fixture",
        detail:
          "Keep the mock model deterministic and label it clearly so tests can assert structure without implying real model understanding."
      },
      {
        id: "recommendation-003",
        title: "Make failure review visible",
        detail:
          "Include a simulated live-model-unavailable path so users see how AI-HRMS records blocked work and recovery guidance."
      }
    ],
    requiresHumanReview: true
  };
}

function makeAuditRef(eventType, trace, extra = {}) {
  return {
    auditEventId: `audit-${randomUUID()}`,
    eventType,
    eventVersion: 1,
    occurredAt: trace.generatedAt,
    env: "dev",
    actor: {
      actorType: extra.actorType ?? "AgentActor",
      actorId: extra.actorId ?? trace.agentActorId
    },
    trace: {
      projectInstanceId: trace.projectInstanceId,
      workItemId: trace.workItemId,
      agentRunId: trace.agentRunId
    },
    data: extra.data ?? {}
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const templatePath = `config/templates/${options.template}.json`;
  const template = await readJson(templatePath);
  if (template.templateId !== options.template) {
    throw new Error(`Template id mismatch in ${templatePath}.`);
  }

  const generatedAt = new Date().toISOString();
  const trace = {
    reportCardId: `report-${randomUUID()}`,
    projectInstanceId: `project-${randomUUID()}`,
    workItemId: `work-${randomUUID()}`,
    agentRunId: `run-${randomUUID()}`,
    agentActorId: "agent-demo-docs-reviewer",
    humanOwnerId: "human-demo-owner",
    generatedAt
  };

  const inputRefs = await collectInputRefs(options.inputs);
  const toolEvaluations = template.toolContracts.map((toolContract) => ({
    toolName: toolContract.toolName,
    result: evaluateToolExecution({
      toolContract,
      env: "dev",
      actorType: "AgentActor"
    })
  }));

  const approvalRequired = toolEvaluations.some((evaluation) => evaluation.result.decision === "require_approval");
  const modelRoute =
    options.model === "live" && process.env.AI_HRMS_LIVE_MODEL_ENABLED === "true"
      ? {
          requested: "live",
          actual: "live",
          mock: false,
          routeId: "live.user-configured",
          note: "Live route was requested and explicitly enabled; schema and governance remain unchanged."
        }
      : {
          requested: options.model,
          actual: "mock",
          mock: true,
          routeId: template.mockModel.modelRouteId,
          note:
            options.model === "live"
              ? "Live route was requested but not enabled; Demo Mode fell back to the required mock route."
              : "Default Demo Mode mock route."
        };

  const analysis = buildMockAnalysis();

  const workItem = {
    workItemId: trace.workItemId,
    title: "Demo docs review and improvement",
    requestedBy: {
      actorType: "HumanActor",
      actorId: trace.humanOwnerId
    },
    assignedActor: {
      actorType: "AgentActor",
      actorId: trace.agentActorId
    },
    riskLevel: template.riskLevel,
    status: approvalRequired ? "awaiting_approval" : "completed",
    approvalPolicyId: "approval-policy.demo.docs-review.v1"
  };

  const agentActor = {
    agentActorId: trace.agentActorId,
    role: "DemoDocsReviewer",
    goal: "Generate structured document review suggestions without modifying files.",
    modelRoute,
    forbiddenActions: ["modify_repository_documents", "call_external_connectors", "use_real_hr_data"]
  };

  const approvalGate = {
    approvalId: `approval-${randomUUID()}`,
    workItemId: trace.workItemId,
    riskLevel: template.riskLevel,
    requestedAction: "human_review_before_document_changes",
    requestPayloadRef: "report-card.recommendations",
    policyEvaluationId: "policy-eval.demo.docs-review.v1",
    approverActorId: trace.humanOwnerId,
    decision: approvalRequired ? "pending" : "not_required",
    decisionReason:
      "Demo Mode only generates suggestions. Human review is required before any source document change.",
    rollbackRef: "not_applicable_no_write_side_effects"
  };

  const observation = {
    observationId: `observation-${randomUUID()}`,
    kind: "demo_mode_execution",
    status: "recorded",
    modelRoute,
    notes: [
      "No real model key was required.",
      "No external connector was called.",
      "No source document was modified."
    ]
  };

  const outputDir = path.resolve(repoRoot, options.out);
  const jsonPath = path.join(outputDir, `${trace.reportCardId}.json`);
  const markdownPath = path.join(outputDir, `${trace.reportCardId}.md`);
  const jsonRelativePath = path.relative(repoRoot, jsonPath).split(path.sep).join("/");
  const markdownRelativePath = path.relative(repoRoot, markdownPath).split(path.sep).join("/");

  const auditRefs = [
    makeAuditRef("task.created", trace, { actorType: "HumanActor", actorId: trace.humanOwnerId }),
    makeAuditRef("task.assigned", trace),
    makeAuditRef("agent_run.started", trace),
    makeAuditRef("approval.requested", trace, { data: { approvalId: approvalGate.approvalId } }),
    makeAuditRef("report.execution_card_created", trace)
  ];

  const reportCard = {
    reportCardId: trace.reportCardId,
    schemaVersion: EXECUTION_REPORT_CARD_SCHEMA_VERSION,
    generatedAt,
    projectInstanceId: trace.projectInstanceId,
    workItemId: trace.workItemId,
    agentRunId: trace.agentRunId,
    templateId: template.templateId,
    templateVersion: template.templateVersion,
    taskGoal: template.taskGoal,
    inputRefs,
    outputRefs: [
      {
        refId: "output-json",
        kind: "ExecutionReportCard",
        path: jsonRelativePath,
        canonical: true,
        schemaVersion: EXECUTION_REPORT_CARD_SCHEMA_VERSION
      },
      {
        refId: "output-markdown",
        kind: "ExecutionReportCardMarkdown",
        path: markdownRelativePath,
        canonical: false,
        renderedFrom: "output-json"
      }
    ],
    agentActorId: trace.agentActorId,
    humanOwnerId: trace.humanOwnerId,
    skillRefs: template.skillRefs,
    toolContractRefs: template.toolContracts.map((toolContract) => ({
      toolName: toolContract.toolName,
      inputSchemaRef: toolContract.inputSchemaRef,
      outputSchemaRef: toolContract.outputSchemaRef,
      riskLevel: toolContract.riskLevel,
      autoExecute: toolContract.autoExecute
    })),
    riskLevel: template.riskLevel,
    approvalStatus: approvalRequired ? "requires_human_review" : "not_required",
    auditRefs,
    dataClassification: template.dataClassification,
    redactionStatus: template.redactionStatus,
    sharePermission: template.sharePermission,
    status: analysis.requiresHumanReview ? "needs_review" : "completed",
    summary: analysis.summary,
    findings: analysis.findings,
    recommendations: analysis.recommendations,
    nextActions: [
      {
        action: "review_recommendations",
        ownerActorId: trace.humanOwnerId,
        status: "pending",
        reason: "Suggestions are mock output and must be checked by a human owner."
      },
      {
        action: "decide_follow_up_work_item",
        ownerActorId: trace.humanOwnerId,
        status: "optional",
        reason: "Create a separate WorkItem if any documentation change should be made."
      }
    ],
    metrics: {
      inputDocumentCount: inputRefs.length,
      findingCount: analysis.findings.length,
      recommendationCount: analysis.recommendations.length,
      requiresHumanReview: analysis.requiresHumanReview,
      modelRouteActual: modelRoute.actual,
      mock: modelRoute.mock
    },
    failure: {
      occurred: false,
      sample: template.failureSample
    },
    extensions: {
      "ai-hrms.demo": {
        runtimeMode: template.runtimeMode,
        templateManifestPath: templatePath,
        modelRoute,
        workItem,
        agentActor,
        approvalGate,
        observation,
        toolContractEvaluations: toolEvaluations,
        executionTrace: [
          "WorkItem.created",
          "AgentActor.assigned",
          "ToolContract.evaluated",
          approvalRequired ? "ApprovalGate.required" : "ApprovalGate.not_required",
          "Observation.recorded",
          "ExecutionReportCard.generated"
        ],
        mockOutputNotice:
          "This report card was generated from deterministic mock output for Demo Mode and is not a live model analysis."
      }
    }
  };

  const validation = validateExecutionReportCard(reportCard);
  if (!validation.ok) {
    const details = validation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
    throw new Error(`Generated invalid ExecutionReportCard: ${details}`);
  }

  const markdown = renderExecutionReportCardMarkdown(reportCard);
  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(reportCard, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, markdown, "utf8");

  console.log("[demo] ok");
  console.log(`[demo] JSON canonical source: ${jsonRelativePath}`);
  console.log(`[demo] Markdown render: ${markdownRelativePath}`);
  console.log(`[demo] model route: ${modelRoute.actual}${modelRoute.mock ? " (mock)" : ""}`);
  console.log(`[demo] approval status: ${reportCard.approvalStatus}`);
}

run().catch((error) => {
  console.error(`[demo] FAIL ${error.message}`);
  process.exit(1);
});
