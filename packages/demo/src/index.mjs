import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ANSWER_CARD_SCHEMA_VERSION,
  DOC_CHALLENGE_DRAFT_SCHEMA_VERSION,
  EXECUTION_REPORT_CARD_SCHEMA_VERSION,
  EXTERNAL_AGENT_RUN_REQUEST_SCHEMA_VERSION,
  EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION,
  renderExecutionReportCardMarkdown,
  validateExecutionReportCard,
  validateExternalAgentRunRequest,
  validateExternalAgentRunResult
} from "../../contracts/src/index.mjs";
import {
  collectDefaultKnowledgeInputs,
  createKnowledgeNavigationArtifacts,
  DEFAULT_KNOWLEDGE_QUERY
} from "../../knowledge/src/index.mjs";
import { evaluateExternalAgentRun, evaluateToolExecution } from "../../policy/src/index.mjs";

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
  ]),
  external_agent_connector_safety_demo: Object.freeze([
    "README.md",
    "ARCHITECTURE.md",
    "docs/zh-CN/api-contracts.md",
    "docs/zh-CN/security-and-governance.md",
    "docs/zh-CN/quality-gates.md"
  ]),
  project_self_review_and_decay_prevention: Object.freeze([
    "README.md",
    "ARCHITECTURE.md",
    "docs/zh-CN/developer-experience.md",
    "docs/zh-CN/quality-gates.md",
    "docs/zh-CN/roadmap.md",
    "docs/zh-CN/capability-development-and-mvp.md"
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

  if (templateId === "external_agent_connector_safety_demo") {
    return {
      summary:
        "Mock analysis: OpenClaw and Hermes Agent style runtimes can increase ecosystem reach, but AI-HRMS must treat them as governed ExternalConnector profiles. The demo creates bounded mock requests, evaluates policy, and records candidate results without launching real external agents.",
      findings: [
        {
          id: "finding-001",
          title: "External agent runtimes are not trusted by default",
          detail:
            "Inbound messages, persistent memory, skills, MCP tools, and channel gateways are treated as untrusted surfaces until a connector profile, data boundary, and audit path are approved."
        },
        {
          id: "finding-002",
          title: "Real execution stays disabled in Demo Mode",
          detail:
            "The mock connector profiles do not read OpenClaw or Hermes Agent local configuration, do not call their CLIs, and do not access user messages, memory, or secrets."
        },
        {
          id: "finding-003",
          title: "ApprovalGate remains local",
          detail:
            "External agent output can become candidate evidence, but high-risk action, assignment, publication, and data sharing still return to the local AI-HRMS ApprovalGate."
        }
      ],
      recommendations: [
        {
          id: "recommendation-001",
          title: "Keep the first connector profiles mock-only",
          detail:
            "Use deterministic connector profiles to validate schema, policy, audit, and report-card rendering before enabling any local CLI bridge."
        },
        {
          id: "recommendation-002",
          title: "Require explicit profile review for each provider",
          detail:
            "OpenClaw and Hermes Agent should be registered as ExternalConnector profiles with allowed environments, risk levels, data classifications, and secret reference policy."
        },
        {
          id: "recommendation-003",
          title: "Capture external results as candidates",
          detail:
            "ExternalAgentRunResult should be reviewed as candidate input and should never be treated as a production fact without human ownership."
        }
      ],
      nextActions: [
        {
          action: "review_connector_profiles",
          status: "pending",
          reason: "A human owner should verify provider assumptions and allowed data boundaries."
        },
        {
          action: "keep_real_cli_disabled",
          status: "required",
          reason: "Real external agent calls need a separate local configuration, approval, and audit trail."
        }
      ],
      requiresHumanReview: true
    };
  }

  if (templateId === "project_self_review_and_decay_prevention") {
    return {
      summary:
        "Mock analysis: project decay prevention should become a recurring self-review loop. The current repository already has quality gates and Demo Mode checks; the next step is to make drift, stale docs, missing tests, and scope creep visible as reviewable WorkItems.",
      findings: [
        {
          id: "finding-001",
          title: "Documentation and code can drift as connectors are added",
          detail:
            "External agent connector language touches API contracts, security, quality gates, templates, CLI commands, and Web display; these must change together."
        },
        {
          id: "finding-002",
          title: "Self-review should not auto-edit the repository",
          detail:
            "The self-review template produces findings and next actions only. It intentionally avoids changing docs, code, issues, PRs, or connector configuration."
        },
        {
          id: "finding-003",
          title: "Healthy failure samples should remain visible",
          detail:
            "Reports should preserve blocked and needs_review states so the project does not hide governance friction as it grows."
        }
      ],
      recommendations: [
        {
          id: "recommendation-001",
          title: "Run self-review before expanding real connectors",
          detail:
            "Use the self-review report to check whether new connector capabilities have matching docs, policy, tests, and rollback notes."
        },
        {
          id: "recommendation-002",
          title: "Track decay as candidate WorkItems",
          detail:
            "Represent stale docs, missing tests, unclear ownership, and broken runbooks as explicit follow-up WorkItems instead of letting them stay implicit."
        },
        {
          id: "recommendation-003",
          title: "Keep HTML for delivery summaries",
          detail:
            "Per-run report cards should remain JSON-first with Markdown rendering; HTML should summarize a delivery batch when visual presentation is worth the extra tokens."
        }
      ],
      nextActions: [
        {
          action: "create_decay_prevention_backlog",
          status: "recommended",
          reason: "Convert self-review findings into human-reviewed WorkItems."
        },
        {
          action: "schedule_recurring_self_review",
          status: "optional",
          reason: "A regular self-review loop keeps drift visible without adding autonomous write side effects."
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

function buildSelfReviewCandidateWorkItems({ analysis, inputRefs }) {
  return [
    {
      candidateWorkItemId: "candidate-work-item-001",
      title: "Synchronize connector governance docs and tests",
      status: "candidate",
      priority: "P1",
      riskLevel: "medium",
      ownerActorTypes: ["HumanActor", "AgentActor"],
      sourceFindingIds: ["finding-001"],
      sourceRecommendationIds: ["recommendation-001"],
      goal:
        "Keep external agent connector docs, policy checks, templates, CLI commands, and Web display aligned before real connector work expands.",
      nonGoals: [
        "Do not enable real external agent execution.",
        "Do not store connector secrets or local agent configuration."
      ],
      suggestedReadSet: inputRefs.map((inputRef) => inputRef.path),
      suggestedWriteSet: [
        "docs/zh-CN/api-contracts.md",
        "docs/zh-CN/security-and-governance.md",
        "docs/zh-CN/quality-gates.md",
        "packages/policy/test/environment-isolation.test.mjs"
      ],
      acceptanceCriteria: [
        "Connector governance docs and policy tests describe the same ApprovalGate and data classification boundary.",
        "No real connector execution is enabled by the change.",
        "All affected docs keep ExternalConnector terminology."
      ],
      verificationCommands: ["pnpm check"],
      approvalRequired: true,
      auditReason: analysis.findings.find((finding) => finding.id === "finding-001")?.detail ?? ""
    },
    {
      candidateWorkItemId: "candidate-work-item-002",
      title: "Create a human-reviewed decay prevention backlog",
      status: "candidate",
      priority: "P1",
      riskLevel: "medium",
      ownerActorTypes: ["HumanActor"],
      sourceFindingIds: ["finding-002", "finding-003"],
      sourceRecommendationIds: ["recommendation-002"],
      goal:
        "Convert self-review findings into explicit WorkItem candidates without giving the self-review command write authority.",
      nonGoals: [
        "Do not auto-create issues, PRs, or production WorkItems.",
        "Do not hide blocked or needs_review samples."
      ],
      suggestedReadSet: inputRefs.map((inputRef) => inputRef.path),
      suggestedWriteSet: [
        "config/project-operating-entry.json",
        "docs/zh-CN/project-operating-entry.md",
        "docs/zh-CN/quality-gates.md"
      ],
      acceptanceCriteria: [
        "Candidate WorkItems include source finding ids, owner, risk, readSet, writeSet, and verification commands.",
        "Self-review output remains JSON-first and requires human review.",
        "The command still does not modify repository documents or code."
      ],
      verificationCommands: ["pnpm self-review", "pnpm check"],
      approvalRequired: true,
      auditReason: analysis.recommendations.find((recommendation) => recommendation.id === "recommendation-002")?.detail ?? ""
    }
  ];
}

const selfReviewMappingRules = Object.freeze([
  {
    ruleId: "self-review-map-finding-to-workitem",
    source: "finding.id",
    target: "candidateWorkItems[].sourceFindingIds",
    requirement:
      "Every candidate WorkItem must reference at least one self-review finding so it remains traceable to report-card evidence."
  },
  {
    ruleId: "self-review-map-recommendation-to-workitem",
    source: "recommendation.id",
    target: "candidateWorkItems[].sourceRecommendationIds",
    requirement:
      "Recommendations can justify next steps, but they remain review material until a human owner promotes the candidate."
  },
  {
    ruleId: "self-review-preserve-review-boundary",
    source: "candidateWorkItems[]",
    target: "promotionPolicy",
    requirement:
      "Self-review output must not create issues, PRs, assignments, repository edits, public assets, or production WorkItems."
  }
]);

const candidateWorkItemRequiredFields = Object.freeze([
  "candidateWorkItemId",
  "title",
  "status",
  "priority",
  "riskLevel",
  "ownerActorTypes",
  "sourceFindingIds",
  "sourceRecommendationIds",
  "goal",
  "nonGoals",
  "suggestedReadSet",
  "suggestedWriteSet",
  "acceptanceCriteria",
  "verificationCommands",
  "approvalRequired"
]);

function buildRepoWorkPlanArtifacts({ analysis, inputRefs }) {
  const suggestedReadSet = inputRefs.map((inputRef) => inputRef.path);
  return {
    noWriteSideEffects: true,
    reviewRequired: true,
    sourceFindingIds: analysis.findings.map((finding) => finding.id),
    sourceRecommendationIds: analysis.recommendations.map((recommendation) => recommendation.id),
    candidateWorkItems: [
      {
        candidateWorkItemId: "repo-work-item-001",
        title: "Turn repo understanding into a visible next-action Workbench",
        status: "candidate",
        priority: "P0",
        riskLevel: "medium",
        ownerActorTypes: ["HumanActor", "AgentActor"],
        goal:
          "Make the first Web Workbench screen show entry modes, current P0 work, report-card proof, and governance boundaries from shared data.",
        nonGoals: [
          "Do not connect live models or real external connectors.",
          "Do not replace JSON ExecutionReportCard with HTML as the source of truth."
        ],
        suggestedReadSet,
        suggestedWriteSet: [
          "apps/web/bin/build-demo.mjs",
          "packages/demo/test/web-workbench-build.test.mjs",
          "config/project-operating-entry.json"
        ],
        acceptanceCriteria: [
          "Workbench renders current P0/P1/P2 task lanes from project-operating-entry.v1.",
          "Entry mode selection updates a recommended template and keeps report cards JSON-first.",
          "Browser verification finds no horizontal overflow."
        ],
        verificationCommands: ["pnpm web:demo", "pnpm check"],
        approvalRequired: true,
        sourceRefIds: inputRefs.map((inputRef) => inputRef.refId)
      },
      {
        candidateWorkItemId: "repo-work-item-002",
        title: "Harden multi-agent WorkShard handoff before larger implementation",
        status: "candidate",
        priority: "P0",
        riskLevel: "medium",
        ownerActorTypes: ["HumanActor", "AgentActor"],
        goal:
          "Make AgentWorkLease, writeSet conflict rules, ChangePacket, and MergeGate visible in docs, manifest, Web Workbench, and tests.",
        nonGoals: [
          "Do not let subagents expand writeSet without approval.",
          "Do not downgrade ApprovalGate, DataClassification, member rights, or ModelRoute requirements."
        ],
        suggestedReadSet,
        suggestedWriteSet: [
          "config/project-operating-entry.json",
          "docs/zh-CN/project-operating-entry.md",
          "docs/zh-CN/harness-engineering.md",
          "docs/zh-CN/quality-gates.md"
        ],
        acceptanceCriteria: [
          "AgentWorkLease fields include modelRoute, dataClassification, riskLevel, rollbackPlan, mergeGateRequirements, and stopConditions.",
          "Conflict rules require non-overlapping writeSet and human owner review when conflicts cannot be resolved.",
          "Web Workbench displays the same manifest-derived guard rules."
        ],
        verificationCommands: ["pnpm validate:operating-entry", "pnpm check"],
        approvalRequired: true,
        sourceRefIds: inputRefs.map((inputRef) => inputRef.refId)
      }
    ],
    suggestedWorkShards: [
      {
        shardId: "repo-shard-product",
        ownerAgentRole: "ProductAgent",
        objective: "Review first-screen clarity and next-action flow.",
        readSet: ["apps/web/bin/build-demo.mjs", "docs/zh-CN/execution-plans/active/phase-0-6-web-workbench-mvp.md"],
        writeSet: [],
        riskLevel: "low",
        dataClassification: "internal",
        modelRoute: "reasoning_deep",
        validationCommands: ["pnpm web:demo"],
        expectedOutputSchema: "ShardResult"
      },
      {
        shardId: "repo-shard-contract",
        ownerAgentRole: "ContractAgent",
        objective: "Check that report-card, operating-entry, and Web state remain machine-verifiable.",
        readSet: ["packages/demo/test/web-workbench-build.test.mjs", "config/project-operating-entry.json"],
        writeSet: [],
        riskLevel: "low",
        dataClassification: "internal",
        modelRoute: "coding_strong",
        validationCommands: ["pnpm check"],
        expectedOutputSchema: "ShardResult"
      },
      {
        shardId: "repo-shard-implementation",
        ownerAgentRole: "ImplementationAgent",
        objective: "Apply the smallest scoped UI or documentation change after product and contract review.",
        readSet: suggestedReadSet,
        writeSet: ["apps/web/bin/build-demo.mjs", "packages/demo/test/web-workbench-build.test.mjs"],
        riskLevel: "medium",
        dataClassification: "internal",
        modelRoute: "coding_strong",
        validationCommands: ["pnpm web:demo", "pnpm check"],
        expectedOutputSchema: "ChangePacket"
      }
    ],
    mockOutputNotice:
      "Repo work-plan candidates are review material only. They do not create issues, PRs, assignments, or repository changes."
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

async function createExternalAgentArtifacts({ repoRoot, template, trace, inputRefs }) {
  const profilePaths = template.externalAgentConnectorProfilePaths ?? [];
  if (!Array.isArray(profilePaths) || profilePaths.length === 0) {
    return null;
  }

  const connectors = [];
  for (const profilePath of profilePaths) {
    const profile = await readJson(repoRoot, profilePath);
    const request = {
      requestId: `external-agent-request-${randomUUID()}`,
      schemaVersion: EXTERNAL_AGENT_RUN_REQUEST_SCHEMA_VERSION,
      connectorId: profile.connectorId,
      direction: "ai_hrms_to_external_agent",
      env: "dev",
      actor: {
        actorType: "AgentActor",
        actorId: trace.agentActorId
      },
      projectInstanceId: trace.projectInstanceId,
      workItemId: trace.workItemId,
      agentRunId: trace.agentRunId,
      riskLevel: template.riskLevel,
      dataClassification: template.dataClassification,
      taskGoal: template.taskGoal,
      inputRefs: inputRefs.map((inputRef) => ({
        refId: inputRef.refId,
        kind: inputRef.kind,
        path: inputRef.path,
        digest: inputRef.digest,
        dataClassification: inputRef.dataClassification
      })),
      requestedCapabilities: [
        "summarize_governed_task",
        "propose_candidate_next_steps"
      ],
      approvalRef: null,
      extensions: {
        "ai-hrms.external-agent": {
          mock: true,
          realExecution: false,
          provider: profile.provider
        }
      }
    };

    const requestValidation = validateExternalAgentRunRequest(request);
    if (!requestValidation.ok) {
      const details = requestValidation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
      throw new Error(`Generated invalid ExternalAgentRunRequest: ${details}`);
    }

    const policy = evaluateExternalAgentRun({
      connectorProfile: profile,
      request,
      env: "dev",
      hasApproval: false,
      realExecutionEnabled: false,
      autoExecute: false
    });
    if (policy.decision === "deny") {
      throw new Error(`External agent policy denied ${profile.connectorId}: ${policy.reason}`);
    }

    const runResult = {
      resultId: `external-agent-result-${randomUUID()}`,
      schemaVersion: EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION,
      connectorId: profile.connectorId,
      direction: "external_agent_to_ai_hrms",
      env: "dev",
      agentRunId: trace.agentRunId,
      status: "needs_review",
      outputRefs: [],
      summary:
        `${profile.provider} mock connector returned a candidate summary. No real external agent process, channel, memory, or secret was accessed.`,
      findings: [
        {
          id: "external-finding-001",
          title: "Candidate output only",
          detail:
            "The result can inform a human review, but it cannot create assignments, publish content, or change repository files."
        }
      ],
      recommendations: [
        {
          id: "external-recommendation-001",
          title: "Keep local ApprovalGate in control",
          detail:
            "Review the connector profile, data classification, risk level, and policy result before enabling any real bridge."
        }
      ],
      auditRefs: [
        makeAuditRef("agent_run.external_agent_mock_result_created", trace, {
          data: {
            connectorId: profile.connectorId,
            provider: profile.provider,
            policyDecision: policy.decision
          }
        })
      ],
      dataClassification: template.dataClassification,
      redactionStatus: template.redactionStatus,
      extensions: {
        "ai-hrms.external-agent": {
          mock: true,
          realExecution: false,
          provider: profile.provider
        }
      }
    };

    const resultValidation = validateExternalAgentRunResult(runResult);
    if (!resultValidation.ok) {
      const details = resultValidation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
      throw new Error(`Generated invalid ExternalAgentRunResult: ${details}`);
    }

    connectors.push({
      profilePath,
      profile,
      request,
      policy,
      runResult
    });
  }

  return {
    connectors,
    policyDecisions: connectors.map((connector) => connector.policy.decision),
    requiresApproval: connectors.some((connector) => connector.policy.decision === "require_approval")
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHtmlList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "<li>None</li>";
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return `<li>${escapeHtml(item)}</li>`;
      }
      const title = item.title ?? item.id ?? item.action ?? item.path ?? "Item";
      const detail = item.detail ?? item.description ?? item.reason ?? item.status ?? "";
      return `<li><strong>${escapeHtml(title)}</strong>${detail ? `: ${escapeHtml(detail)}` : ""}</li>`;
    })
    .join("");
}

export function renderDeliveryReportHtml({
  reportCards,
  title = "AI-HRMS Delivery Report",
  generatedAt = new Date().toISOString()
}) {
  if (!Array.isArray(reportCards)) {
    throw new Error("reportCards must be an array.");
  }

  const cards = reportCards.map((card) => {
    const validation = validateExecutionReportCard(card);
    if (!validation.ok) {
      const details = validation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
      throw new Error(`Cannot render invalid ExecutionReportCard: ${details}`);
    }
    return card;
  });

  const cardsHtml = cards
    .map(
      (card) => {
        const canonicalJson = card.outputRefs.find(
          (outputRef) => outputRef.kind === "ExecutionReportCard" && outputRef.canonical === true
        );
        const templateEvaluationSamples = card.extensions["ai-hrms.demo"]?.templateEvaluationSamples?.samples ?? [];
        const failureSample = card.failure?.sample;
        return `<article class="card">
        <header>
          <p class="eyebrow">${escapeHtml(card.templateId)}@${escapeHtml(card.templateVersion)}</p>
          <h2>${escapeHtml(card.taskGoal)}</h2>
          <dl>
            <div><dt>Status</dt><dd>${escapeHtml(card.status)}</dd></div>
            <div><dt>Risk</dt><dd>${escapeHtml(card.riskLevel)}</dd></div>
            <div><dt>Approval</dt><dd>${escapeHtml(card.approvalStatus)}</dd></div>
            <div><dt>Share</dt><dd>${escapeHtml(card.sharePermission)}</dd></div>
          </dl>
        </header>
        <p>${escapeHtml(card.summary)}</p>
        <section class="evidence" aria-label="Report evidence">
          <div><span>Canonical JSON</span><strong>${escapeHtml(canonicalJson?.path ?? "missing")}</strong></div>
          <div><span>Eval samples</span><strong>${escapeHtml(card.metrics?.candidateEvalSampleCount ?? 0)}</strong></div>
          <div><span>Failure path</span><strong>${escapeHtml(failureSample?.failureType ?? "none")}</strong></div>
          <div><span>Data boundary</span><strong>${escapeHtml(`${card.dataClassification} / ${card.redactionStatus}`)}</strong></div>
        </section>
        <section>
          <h3>Findings</h3>
          <ul>${renderHtmlList(card.findings)}</ul>
        </section>
        <section>
          <h3>Template Evaluation Samples</h3>
          <ul>${renderHtmlList(
            templateEvaluationSamples.map((sample) => ({
              title: sample.sampleId,
              detail: `${sample.failureModeCovered}; reviewRequired=true`
            }))
          )}</ul>
        </section>
        <section>
          <h3>Next Actions</h3>
          <ul>${renderHtmlList(card.nextActions)}</ul>
        </section>
      </article>`;
      }
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Segoe UI, Arial, sans-serif; color: #17201b; background: #f7f8f5; }
    body { margin: 0; }
    main { max-width: 1120px; margin: 0 auto; padding: 40px 20px 56px; }
    header.hero { border-bottom: 1px solid #cfd7cd; margin-bottom: 28px; padding-bottom: 22px; }
    h1 { font-size: 34px; line-height: 1.12; margin: 0 0 12px; }
    h2 { font-size: 20px; line-height: 1.28; margin: 0 0 16px; }
    h3 { font-size: 14px; margin: 20px 0 8px; }
    p { line-height: 1.62; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .metric, .card { background: #ffffff; border: 1px solid #dbe2d8; border-radius: 8px; box-shadow: 0 1px 2px rgba(23, 32, 27, 0.05); }
    .metric { padding: 16px; }
    .metric strong { display: block; font-size: 24px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
    .card { padding: 22px; }
    .eyebrow, dt { color: #536158; font-size: 12px; text-transform: uppercase; letter-spacing: 0; }
    dl { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 0; }
    dt, dd { margin: 0; }
    dd { font-weight: 700; }
    .evidence { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
    .evidence div { min-width: 0; border: 1px solid #dbe2d8; border-radius: 6px; background: #fbfcfa; padding: 10px; }
    .evidence span { display: block; color: #536158; font-size: 12px; text-transform: uppercase; }
    .evidence strong { display: block; margin-top: 5px; overflow-wrap: anywhere; }
    ul { margin: 0; padding-left: 20px; }
    li { margin: 7px 0; }
    @media (max-width: 720px) {
      .summary, dl, .evidence { grid-template-columns: 1fr 1fr; }
      h1 { font-size: 28px; }
    }
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <p class="eyebrow">Generated ${escapeHtml(generatedAt)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p>This HTML is a delivery-level render. The canonical source remains JSON ExecutionReportCard; Markdown remains the default per-run reading format.</p>
    </header>
    <section class="summary" aria-label="Report summary">
      <div class="metric"><span>Report cards</span><strong>${cards.length}</strong></div>
      <div class="metric"><span>Needs review</span><strong>${cards.filter((card) => card.status === "needs_review").length}</strong></div>
      <div class="metric"><span>Approval required</span><strong>${cards.filter((card) => card.approvalStatus === "requires_human_review").length}</strong></div>
      <div class="metric"><span>Private</span><strong>${cards.filter((card) => card.sharePermission === "private").length}</strong></div>
    </section>
    <section class="grid" aria-label="Report cards">
      ${cardsHtml || '<article class="card"><h2>No report cards found</h2><p>Run Demo Mode or self-review first.</p></article>'}
    </section>
  </main>
</body>
</html>
`;
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
  const externalAgentArtifacts = await createExternalAgentArtifacts({
    repoRoot,
    template,
    trace,
    inputRefs
  });
  const toolEvaluations = template.toolContracts.map((toolContract) => ({
    toolName: toolContract.toolName,
    result: evaluateToolExecution({
      toolContract,
      env: "dev",
      actorType: "AgentActor"
    })
  }));
  ensureToolContractsAllowed(toolEvaluations);

  const approvalRequired =
    toolEvaluations.some((evaluation) => evaluation.result.decision === "require_approval") ||
    externalAgentArtifacts?.requiresApproval === true;
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
  const repoWorkPlan =
    templateId === "repo_understanding_and_work_plan"
      ? buildRepoWorkPlanArtifacts({ analysis, inputRefs })
      : null;
  const selfReviewCandidateWorkItems =
    templateId === "project_self_review_and_decay_prevention"
      ? buildSelfReviewCandidateWorkItems({ analysis, inputRefs })
      : [];
  const candidateWorkItemCount =
    selfReviewCandidateWorkItems.length + (repoWorkPlan?.candidateWorkItems.length ?? 0);

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
    forbiddenActions: [
      "modify_repository_documents",
      "call_real_external_agent_runtime",
      "read_external_agent_memory_or_messages",
      "use_real_hr_data"
    ]
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
      externalAgentArtifacts
        ? "External agent connector profiles were evaluated through deterministic mock requests only."
        : "No external connector was called.",
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

  const templateEvaluationSamples = {
    source: "template.evaluationSamples",
    status: "candidate",
    reviewRequired: true,
    jsonFirst: true,
    samples: Array.isArray(template.evaluationSamples) ? template.evaluationSamples : []
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
    ...(externalAgentArtifacts
      ? [
          makeAuditRef("policy.external_agent_connector_evaluated", trace, {
            data: {
              connectorIds: externalAgentArtifacts.connectors.map((connector) => connector.profile.connectorId),
              decisions: externalAgentArtifacts.policyDecisions
            }
          })
        ]
      : []),
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
      candidateEvalSampleCount: 1 + templateEvaluationSamples.samples.length,
      candidateWorkItemCount,
      suggestedWorkShardCount: repoWorkPlan?.suggestedWorkShards.length ?? 0,
      modelRouteActual: modelRoute.actual,
      externalAgentConnectorCount: externalAgentArtifacts?.connectors.length ?? 0,
      externalAgentRequiresApproval: externalAgentArtifacts?.requiresApproval ?? false,
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
        templateEvaluationSamples,
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
      ...(externalAgentArtifacts
        ? {
            "ai-hrms.externalAgent": {
              mockOnly: true,
              realExecution: false,
              connectorCount: externalAgentArtifacts.connectors.length,
              connectors: externalAgentArtifacts.connectors.map((connector) => ({
                profilePath: connector.profilePath,
                connectorId: connector.profile.connectorId,
                provider: connector.profile.provider,
                mode: connector.profile.mode,
                allowedEnvironments: connector.profile.allowedEnvironments,
                dataClassificationAllowed: connector.profile.dataClassificationAllowed,
                riskLevelAllowed: connector.profile.riskLevelAllowed,
                policyDecision: connector.policy.decision,
                policyReason: connector.policy.reason,
                request: connector.request,
                runResult: connector.runResult
              })),
              mockOutputNotice:
                "External agent connector safety used deterministic mock requests and did not launch OpenClaw, Hermes Agent, messaging channels, MCP servers, or local CLIs."
            }
          }
        : {}),
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
        : {}),
      ...(repoWorkPlan
        ? {
            "ai-hrms.workPlan": repoWorkPlan
          }
        : {}),
      ...(selfReviewCandidateWorkItems.length > 0
        ? {
            "ai-hrms.selfReview": {
              noWriteSideEffects: true,
              reviewRequired: true,
              promotionPolicy: "human_owner_review_required",
              mappingRules: selfReviewMappingRules,
              requiredCandidateFields: candidateWorkItemRequiredFields,
              candidateWorkItems: selfReviewCandidateWorkItems,
              mockOutputNotice:
                "Self-review candidate WorkItems are review material only. They do not create issues, PRs, assignments, or repository changes."
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
    artifacts: {
      ...(knowledgeArtifacts
        ? {
            answerCard: knowledgeArtifacts.answerCard,
            docChallengeDraft: knowledgeArtifacts.docChallengeDraft,
            knowledge: knowledgeArtifacts
          }
        : {}),
      ...(externalAgentArtifacts
        ? {
            externalAgent: externalAgentArtifacts
          }
        : {})
    },
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
