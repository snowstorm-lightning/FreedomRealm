import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ANSWER_CARD_SCHEMA_VERSION,
  DOC_CHALLENGE_DRAFT_SCHEMA_VERSION,
  EXECUTION_REPORT_CARD_SCHEMA_VERSION,
  renderExecutionReportCardMarkdown,
  validateExecutionReportCard
} from "../../contracts/src/index.mjs";
import {
  collectDefaultKnowledgeInputs,
  createKnowledgeNavigationArtifacts,
  DEFAULT_KNOWLEDGE_QUERY
} from "../../knowledge/src/index.mjs";
import { evaluateToolExecution } from "../../policy/src/index.mjs";

export const DEFAULT_DEMO_TEMPLATE_ID = "docs_review_and_improvement";

export { DEFAULT_KNOWLEDGE_QUERY } from "../../knowledge/src/index.mjs";

export const DEFAULT_DEMO_INPUTS = Object.freeze({
  docs_review_and_improvement: Object.freeze([
    "README.md",
    "docs/zh-CN/README.md",
    "docs/zh-CN/capability-development-and-mvp.md",
    "docs/zh-CN/architecture-blueprint.md"
  ]),
  repo_understanding_and_work_plan: Object.freeze([
    "README.md",
    "ARCHITECTURE.md",
    "docs/zh-CN/developer-experience.md",
    "docs/zh-CN/roadmap.md"
  ]),
  issue_pr_triage_and_review: Object.freeze([
    "README.md",
    "docs/zh-CN/api-contracts.md",
    "docs/zh-CN/quality-gates.md"
  ]),
  personal_work_proof: Object.freeze([
    "README.md",
    "docs/zh-CN/capability-development-and-mvp.md",
    "docs/zh-CN/adoption-and-growth.md"
  ]),
  knowledge_navigation_and_challenge: Object.freeze([
    "README.md",
    "ARCHITECTURE.md",
    "docs/zh-CN/capability-development-and-mvp.md",
    "docs/zh-CN/adoption-and-growth.md",
    "docs/zh-CN/roadmap.md",
    "docs/zh-CN/api-contracts.md",
    "docs/zh-CN/quality-gates.md"
  ])
});

export function getDefaultInputs(templateId = DEFAULT_DEMO_TEMPLATE_ID) {
  return [...(DEFAULT_DEMO_INPUTS[templateId] ?? DEFAULT_DEMO_INPUTS[DEFAULT_DEMO_TEMPLATE_ID])];
}

function workspacePath(repoRoot, relativeOrAbsolutePath) {
  const absolutePath = path.resolve(repoRoot, relativeOrAbsolutePath);
  const relativePath = path.relative(repoRoot, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Input path must stay inside the workspace: ${relativeOrAbsolutePath}`);
  }
  return { absolutePath, relativePath: relativePath.split(path.sep).join("/") };
}

async function readJson(repoRoot, relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function collectInputRefs(repoRoot, inputs) {
  const refs = [];
  for (const input of inputs) {
    const { absolutePath, relativePath } = workspacePath(repoRoot, input);
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

function buildMockAnalysis(templateId, knowledgeArtifacts = null) {
  if (templateId === "knowledge_navigation_and_challenge") {
    const sourceFindings = (knowledgeArtifacts?.answerCard.sourceRefs ?? []).slice(0, 3).map((sourceRef, index) => ({
      id: `finding-${String(index + 1).padStart(3, "0")}`,
      title: `Source located: ${sourceRef.heading}`,
      detail: `${sourceRef.path}:L${sourceRef.lineStart}-L${sourceRef.lineEnd} matched through local mock semantic search.`
    }));

    return {
      summary:
        knowledgeArtifacts?.answerCard.answer ??
        "Mock analysis: the knowledge navigation template produces a sourced AnswerCard and a draft challenge for human review without modifying maintained documents.",
      findings:
        sourceFindings.length > 0
          ? sourceFindings
          : [
              {
                id: "finding-001",
                title: "No strong source located",
                detail:
                  "The local mock semantic search did not find enough maintained documentation for the question."
              }
            ],
      recommendations: [
        {
          id: "recommendation-001",
          title: "Review cited sources before trusting the answer",
          detail:
            "The AnswerCard is grounded in maintained repository documents, but the source selection is still a deterministic mock path."
        },
        {
          id: "recommendation-002",
          title: "Use DocChallengeDraft for disputed points",
          detail:
            "If a source appears outdated or incomplete, create a follow-up review WorkItem instead of allowing AI to edit the document directly."
        }
      ],
      nextActions: [
        {
          action: "review_answer_card",
          status: "pending",
          reason: "A human owner should verify the answer and cited sources."
        },
        {
          action: "decide_doc_challenge",
          status: "optional",
          reason: "Submit the draft only if the cited source should be challenged or improved."
        }
      ],
      requiresHumanReview: true
    };
  }

  if (templateId === "repo_understanding_and_work_plan") {
    return {
      summary:
        "Mock analysis: AI-HRMS is ready to turn its software-layer MVP into a Web-first Workbench. The next valuable step is to keep CLI as the tested core, expose a Web onboarding path, and generate report cards from the same execution data.",
      findings: [
        {
          id: "finding-001",
          title: "The Web path needs shared execution data",
          detail:
            "CLI and Web must consume the same template manifest and ExecutionReportCard schema so the Workbench does not fork business logic."
        },
        {
          id: "finding-002",
          title: "The first audience should be technical",
          detail:
            "Developers and open-source maintainers can validate repo understanding, review gates, and report-card semantics quickly."
        },
        {
          id: "finding-003",
          title: "Reality-layer work is not blocking",
          detail:
            "The current MVP should focus on software workflows, report cards, and reusable templates before reality capture is revisited."
        }
      ],
      recommendations: [
        {
          id: "recommendation-001",
          title: "Build the Workbench around one primary action",
          detail:
            "Use a Web-first path that asks for a goal or demo example, then generates the first AI-assisted work proof."
        },
        {
          id: "recommendation-002",
          title: "Treat WorkShard suggestions as review material",
          detail:
            "Show proposed WorkShards as planning output, not as autonomous assignments."
        },
        {
          id: "recommendation-003",
          title: "Keep mock output explicit",
          detail:
            "Make every generated card state that the route is mock unless a live route is explicitly enabled and still schema-checked."
        }
      ],
      nextActions: [
        {
          action: "create_web_workbench_shell",
          status: "recommended",
          reason: "The first screen is the highest-leverage propagation surface."
        },
        {
          action: "define_repo_template_contract",
          status: "recommended",
          reason: "The repo understanding template should become the first user-visible template."
        }
      ],
      requiresHumanReview: true
    };
  }

  if (templateId === "issue_pr_triage_and_review") {
    return {
      summary:
        "Mock analysis: the issue or PR should be triaged as a governed WorkItem. The output should help a human reviewer decide owner, risk, and next steps without posting comments or merging code automatically.",
      findings: [
        {
          id: "finding-001",
          title: "Human owner is required",
          detail: "The template can suggest a reviewer or owner, but assignment remains a reviewable recommendation."
        },
        {
          id: "finding-002",
          title: "Risk is medium by default",
          detail: "PR and issue triage can influence work direction, so it should produce suggestions and review points, not side effects."
        }
      ],
      recommendations: [
        {
          id: "recommendation-001",
          title: "Create follow-up WorkItems",
          detail: "Split unclear issues into scoped WorkItems before implementation."
        },
        {
          id: "recommendation-002",
          title: "Keep external connector calls out of MVP",
          detail: "Use pasted issue or PR context first; GitHub API integration can come later."
        }
      ],
      nextActions: [
        {
          action: "review_triage_summary",
          status: "pending",
          reason: "A human maintainer should validate labels, owner, and next steps."
        }
      ],
      requiresHumanReview: true
    };
  }

  if (templateId === "personal_work_proof") {
    return {
      summary:
        "Mock analysis: the user can start without a fixed identity by turning a goal and existing materials into a small AI-assisted work proof, then using the report card as a private capability record.",
      findings: [
        {
          id: "finding-001",
          title: "Identity can remain flexible",
          detail: "The user can describe goals and constraints without declaring a fixed role."
        },
        {
          id: "finding-002",
          title: "The first proof should be small",
          detail: "A narrow task with visible inputs, review notes, and next actions is more useful than a broad career assessment."
        }
      ],
      recommendations: [
        {
          id: "recommendation-001",
          title: "Generate a short LearningPath",
          detail: "Offer a 3-step path that turns current materials into a reviewed output."
        },
        {
          id: "recommendation-002",
          title: "Create one GrowthWorkItem",
          detail: "Suggest one voluntary next task; refusal or deferral must not count negatively."
        }
      ],
      nextActions: [
        {
          action: "choose_first_small_task",
          status: "pending",
          reason: "The user should select or edit the recommended task before execution."
        }
      ],
      requiresHumanReview: true
    };
  }

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
    nextActions: [
      {
        action: "review_recommendations",
        status: "pending",
        reason: "Suggestions are mock output and must be checked by a human owner."
      },
      {
        action: "decide_follow_up_work_item",
        status: "optional",
        reason: "Create a separate WorkItem if any documentation change should be made."
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

function ensureToolContractsAllowed(toolEvaluations) {
  const denied = toolEvaluations.filter((evaluation) => evaluation.result.decision === "deny");
  if (denied.length === 0) {
    return;
  }

  const details = denied
    .map((evaluation) => `${evaluation.toolName}: ${evaluation.result.reason}`)
    .join(", ");
  throw new Error(`Template ToolContract policy denied execution: ${details}`);
}

function buildModelRoute({ requestedModel, template }) {
  if (requestedModel === "live" && process.env.AI_HRMS_LIVE_MODEL_ENABLED === "true") {
    return {
      requested: "live",
      actual: "live",
      mock: false,
      routeId: "live.user-configured",
      note: "Live route was requested and explicitly enabled; schema and governance remain unchanged."
    };
  }

  return {
    requested: requestedModel,
    actual: "mock",
    mock: true,
    routeId: template.mockModel.modelRouteId,
    note:
      requestedModel === "live"
        ? "Live route was requested but not enabled; Demo Mode fell back to the required mock route."
        : "Default Demo Mode mock route."
  };
}

export async function createDemoExecution({
  repoRoot,
  templateId = DEFAULT_DEMO_TEMPLATE_ID,
  model = "mock",
  inputs = getDefaultInputs(templateId),
  query = DEFAULT_KNOWLEDGE_QUERY,
  outputDir = "dist/demo-mode"
}) {
  if (!["mock", "live"].includes(model)) {
    throw new Error("model must be mock or live.");
  }

  const templatePath = `config/templates/${templateId}.json`;
  const template = await readJson(repoRoot, templatePath);
  if (template.templateId !== templateId) {
    throw new Error(`Template id mismatch in ${templatePath}.`);
  }

  const generatedAt = new Date().toISOString();
  const trace = {
    reportCardId: `report-${randomUUID()}`,
    projectInstanceId: `project-${randomUUID()}`,
    workItemId: `work-${randomUUID()}`,
    agentRunId: `run-${randomUUID()}`,
    agentActorId: template.agentActorId ?? "agent-demo-docs-reviewer",
    humanOwnerId: "human-demo-owner",
    generatedAt
  };

  const inputRefs = await collectInputRefs(repoRoot, inputs);
  const toolEvaluations = template.toolContracts.map((toolContract) => ({
    toolName: toolContract.toolName,
    result: evaluateToolExecution({
      toolContract,
      env: "dev",
      actorType: "AgentActor"
    })
  }));
  ensureToolContractsAllowed(toolEvaluations);

  const approvalRequired = toolEvaluations.some((evaluation) => evaluation.result.decision === "require_approval");
  const modelRoute = buildModelRoute({ requestedModel: model, template });
  const knowledgeArtifacts =
    templateId === "knowledge_navigation_and_challenge"
      ? await createKnowledgeNavigationArtifacts({
          repoRoot,
          query,
          inputs,
          humanOwnerId: trace.humanOwnerId
        })
      : null;
  const analysis = buildMockAnalysis(templateId, knowledgeArtifacts);

  const workItem = {
    workItemId: trace.workItemId,
    title: template.workItemTitle ?? template.displayName,
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
    approvalPolicyId: `approval-policy.demo.${templateId}.v1`
  };

  const agentActor = {
    agentActorId: trace.agentActorId,
    role: template.agentRole ?? "DemoDocsReviewer",
    goal: template.agentGoal ?? "Generate structured suggestions without modifying files.",
    modelRoute,
    forbiddenActions: ["modify_repository_documents", "call_external_connectors", "use_real_hr_data"]
  };

  const approvalGate = {
    approvalId: `approval-${randomUUID()}`,
    workItemId: trace.workItemId,
    riskLevel: template.riskLevel,
    requestedAction: template.approvalAction ?? "human_review_before_side_effects",
    requestPayloadRef: "report-card.recommendations",
    policyEvaluationId: `policy-eval.demo.${templateId}.v1`,
    approverActorId: trace.humanOwnerId,
    decision: approvalRequired ? "pending" : "not_required",
    decisionReason: "Demo Mode only generates suggestions. Human review is required before side effects.",
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

  const learningArtifact = {
    learningArtifactId: `learning-${randomUUID()}`,
    artifactType: "Review note",
    source: "ExecutionReportCard",
    status: "candidate",
    dataClassification: template.dataClassification,
    redactionStatus: template.redactionStatus,
    sharePermission: template.sharePermission,
    approvalRequired: true,
    retention: "local-demo-run",
    note:
      "Candidate learning artifact derived from a deterministic Demo Mode run. It cannot become training or public material without human review, approval, audit, and retention controls."
  };

  const evalSample = {
    evalSampleId: `eval-sample-${randomUUID()}`,
    sampleType: "demo_mode_minimal_loop",
    status: "candidate",
    sourceTemplateId: template.templateId,
    inputRefIds: inputRefs.map((inputRef) => inputRef.refId),
    expectedBehaviors: [
      "Demo Mode completes without a real model key.",
      "ToolContract policy requires human review before side effects.",
      "ExecutionReportCard JSON remains the canonical source.",
      "No source document is modified by the demo run."
    ],
    approvalRequired: true,
    retention: "local-demo-run"
  };

  const absoluteOutputDir = path.resolve(repoRoot, outputDir);
  const jsonPath = path.join(absoluteOutputDir, `${trace.reportCardId}.json`);
  const markdownPath = path.join(absoluteOutputDir, `${trace.reportCardId}.md`);
  const answerCardPath = knowledgeArtifacts
    ? path.join(absoluteOutputDir, `${knowledgeArtifacts.answerCard.answerCardId}.json`)
    : null;
  const docChallengeDraftPath = knowledgeArtifacts
    ? path.join(absoluteOutputDir, `${knowledgeArtifacts.docChallengeDraft.challengeId}.json`)
    : null;
  const jsonRelativePath = path.relative(repoRoot, jsonPath).split(path.sep).join("/");
  const markdownRelativePath = path.relative(repoRoot, markdownPath).split(path.sep).join("/");
  const answerCardRelativePath = answerCardPath
    ? path.relative(repoRoot, answerCardPath).split(path.sep).join("/")
    : null;
  const docChallengeDraftRelativePath = docChallengeDraftPath
    ? path.relative(repoRoot, docChallengeDraftPath).split(path.sep).join("/")
    : null;

  const auditRefs = [
    makeAuditRef("task.created", trace, { actorType: "HumanActor", actorId: trace.humanOwnerId }),
    makeAuditRef("task.assigned", trace),
    makeAuditRef("agent_run.started", trace),
    makeAuditRef("approval.requested", trace, { data: { approvalId: approvalGate.approvalId } }),
    makeAuditRef("report.execution_card_created", trace)
  ];

  const outputRefs = [
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
  ];

  if (knowledgeArtifacts) {
    outputRefs.push(
      {
        refId: "output-answer-card",
        kind: "AnswerCard",
        path: answerCardRelativePath,
        canonical: true,
        schemaVersion: ANSWER_CARD_SCHEMA_VERSION
      },
      {
        refId: "output-doc-challenge-draft",
        kind: "DocChallengeDraft",
        path: docChallengeDraftRelativePath,
        canonical: true,
        schemaVersion: DOC_CHALLENGE_DRAFT_SCHEMA_VERSION
      }
    );
  }

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
    outputRefs,
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
    nextActions: analysis.nextActions,
    metrics: {
      inputDocumentCount: inputRefs.length,
      findingCount: analysis.findings.length,
      recommendationCount: analysis.recommendations.length,
      requiresHumanReview: analysis.requiresHumanReview,
      candidateLearningArtifactCount: 1,
      candidateEvalSampleCount: 1,
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
        learningArtifact,
        evalSample,
        toolContractEvaluations: toolEvaluations,
        executionTrace: [
          "WorkItem.created",
          "AgentActor.assigned",
          "ToolContract.evaluated",
          approvalRequired ? "ApprovalGate.required" : "ApprovalGate.not_required",
          "Observation.recorded",
          "LearningArtifact.candidate_created",
          "EvalSample.candidate_created",
          "ExecutionReportCard.generated"
        ],
        mockOutputNotice:
          "This report card was generated from deterministic mock output for Demo Mode and is not a live model analysis."
      },
      ...(knowledgeArtifacts
        ? {
            "ai-hrms.knowledge": {
              searchMode: knowledgeArtifacts.searchMode,
              query: knowledgeArtifacts.query,
              answerCard: knowledgeArtifacts.answerCard,
              docChallengeDraft: knowledgeArtifacts.docChallengeDraft,
              sourceHitCount: knowledgeArtifacts.hits.length,
              sourceHits: knowledgeArtifacts.hits,
              mockOutputNotice:
                "Knowledge navigation used local deterministic mock semantic search and did not call embeddings, live models, or external connectors."
            }
          }
        : {})
    }
  };

  const validation = validateExecutionReportCard(reportCard);
  if (!validation.ok) {
    const details = validation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
    throw new Error(`Generated invalid ExecutionReportCard: ${details}`);
  }

  return {
    template,
    reportCard,
    markdown: renderExecutionReportCardMarkdown(reportCard),
    artifacts: knowledgeArtifacts
      ? {
          answerCard: knowledgeArtifacts.answerCard,
          docChallengeDraft: knowledgeArtifacts.docChallengeDraft,
          knowledge: knowledgeArtifacts
        }
      : {},
    output: {
      absoluteOutputDir,
      jsonPath,
      markdownPath,
      jsonRelativePath,
      markdownRelativePath,
      answerCardPath,
      docChallengeDraftPath,
      answerCardRelativePath,
      docChallengeDraftRelativePath
    }
  };
}

export async function writeDemoExecution(execution) {
  await mkdir(execution.output.absoluteOutputDir, { recursive: true });
  await writeFile(execution.output.jsonPath, `${JSON.stringify(execution.reportCard, null, 2)}\n`, "utf8");
  await writeFile(execution.output.markdownPath, execution.markdown, "utf8");
  if (execution.artifacts?.answerCard && execution.output.answerCardPath) {
    await writeFile(
      execution.output.answerCardPath,
      `${JSON.stringify(execution.artifacts.answerCard, null, 2)}\n`,
      "utf8"
    );
  }
  if (execution.artifacts?.docChallengeDraft && execution.output.docChallengeDraftPath) {
    await writeFile(
      execution.output.docChallengeDraftPath,
      `${JSON.stringify(execution.artifacts.docChallengeDraft, null, 2)}\n`,
      "utf8"
    );
  }
  return execution.output;
}

export async function createKnowledgeDemoExecution({
  repoRoot,
  query = DEFAULT_KNOWLEDGE_QUERY,
  model = "mock",
  inputs,
  outputDir = "dist/knowledge-demo"
}) {
  const knowledgeInputs = inputs ?? (await collectDefaultKnowledgeInputs(repoRoot));
  return createDemoExecution({
    repoRoot,
    templateId: "knowledge_navigation_and_challenge",
    model,
    inputs: knowledgeInputs,
    query,
    outputDir
  });
}

export async function runKnowledgeDemo(options) {
  const execution = await createKnowledgeDemoExecution(options);
  await writeDemoExecution(execution);
  return execution;
}

export async function runDemoMode(options) {
  const execution = await createDemoExecution(options);
  await writeDemoExecution(execution);
  return execution;
}
