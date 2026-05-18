import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateExternalAgentRun,
  evaluateToolExecution,
  validateEnvironmentConfig,
  validatePromotionPath,
  validateToolContract
} from "../src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const baseConfig = {
  env: "staging",
  service: "control-plane",
  version: "0.1.0",
  resources: {
    database: { name: "ai_hrms_staging" },
    temporal: { namespace: "ai-hrms-staging" },
    keycloak: { realm: "ai-hrms-staging" },
    litellm: { deployment: "litellm-staging" },
    langfuse: { project: "ai-hrms-staging" },
    objectStorage: { bucketOrPrefix: "ai-hrms-staging/uploads/" },
    kubernetes: { namespace: "ai-hrms-staging" },
    secretPath: "ai-hrms/staging/"
  },
  telemetry: {
    labels: {
      env: "staging",
      service: "control-plane",
      version: "0.1.0",
      workflow_id: "wf-001",
      agent_run_id: "run-001",
      actor_type: "ServiceAccount",
      actor_id: "ci",
      policy_version: "policy-v1",
      approval_refs: "approval-001"
    }
  },
  promotion: {
    from: "ci",
    to: "staging",
    rollbackVersion: "0.0.9",
    observationWindow: "PT1H"
  },
  crossEnvironmentAccess: []
};

const lowRiskTool = {
  toolName: "knowledge.search",
  description: "Search approved knowledge.",
  inputSchemaRef: "schema://knowledge.search.input.v1",
  outputSchemaRef: "schema://knowledge.search.output.v1",
  requiredPermissions: ["knowledge:read"],
  riskLevel: "low",
  allowedActorTypes: ["AgentActor"],
  allowedEnvironments: ["dev", "staging"],
  autoExecute: true,
  budgetLimit: {
    currency: "token",
    amount: 1000
  },
  auditTags: ["knowledge", "read"]
};

const externalAgentProfile = {
  connectorId: "external-agent.openclaw.mock",
  schemaVersion: "external-agent-connector-profile.v1",
  provider: "openclaw",
  mode: "mock",
  supportedDirections: ["ai_hrms_to_external_agent", "external_agent_to_ai_hrms"],
  allowedEnvironments: ["dev", "ci"],
  dataClassificationAllowed: ["public", "internal"],
  riskLevelAllowed: ["low", "medium"],
  toolContractRefs: [
    "tool-contract://external-agent.openclaw.mock.request.v1",
    "tool-contract://external-agent.openclaw.mock.result.v1"
  ],
  approvalRequiredByDefault: false,
  secretRefPolicy: {
    allowsPlaintext: false,
    requiredRefTypes: ["env", "secretPath"],
    secretRefs: []
  },
  auditTags: ["external-agent", "openclaw", "mock"],
  extensions: {
    "ai-hrms.external-agent": {
      mock: true
    }
  }
};

function externalAgentStressProfile(overrides = {}) {
  return {
    ...externalAgentProfile,
    ...overrides
  };
}

function externalAgentRequest(overrides = {}) {
  return {
    requestId: "external-agent-request-001",
    schemaVersion: "external-agent-run-request.v1",
    connectorId: "external-agent.openclaw.mock",
    direction: "ai_hrms_to_external_agent",
    env: "dev",
    actor: {
      actorType: "AgentActor",
      actorId: "agent-demo-open-agent-bridge"
    },
    projectInstanceId: "project-demo-001",
    workItemId: "work-demo-001",
    agentRunId: "run-demo-001",
    riskLevel: "low",
    dataClassification: "internal",
    taskGoal: "Ask a mock external agent for a bounded planning suggestion.",
    inputRefs: [],
    requestedCapabilities: ["planning"],
    approvalRef: null,
    extensions: {
      "ai-hrms.external-agent": {
        mock: true
      }
    },
    ...overrides
  };
}

test("validates an isolated staging environment config", () => {
  const result = validateEnvironmentConfig(baseConfig);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("validate environment CLI keeps target path inside the workspace", () => {
  const result = spawnSync(process.execPath, ["packages/policy/bin/validate-environment.mjs", "../outside-env.json"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must stay inside the workspace/u);
});

test("rejects a config that points staging at prod resources", () => {
  const result = validateEnvironmentConfig({
    ...baseConfig,
    resources: {
      ...baseConfig.resources,
      database: { name: "ai_hrms_prod" }
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "environment_resource_mismatch"), true);
});

test("enforces one-step promotion paths", () => {
  assert.equal(validatePromotionPath("dev", "staging").ok, false);
  assert.equal(validatePromotionPath("ci", "staging").ok, true);
});

test("allows a low-risk tool in its configured environment", () => {
  const result = evaluateToolExecution({
    toolContract: lowRiskTool,
    env: "staging",
    actorType: "AgentActor"
  });
  assert.equal(result.decision, "allow");
});

test("requires ApprovalGate for high-risk production tools", () => {
  const result = evaluateToolExecution({
    toolContract: {
      ...lowRiskTool,
      toolName: "attendance.correct",
      riskLevel: "high",
      allowedEnvironments: ["prod"],
      autoExecute: false,
      auditTags: ["attendance", "correction"]
    },
    env: "prod",
    actorType: "AgentActor"
  });
  assert.equal(result.decision, "require_approval");
  assert.equal(result.reason, "approval_required");
});

test("rejects high-risk production auto-execute contracts", () => {
  const result = validateToolContract({
    ...lowRiskTool,
    riskLevel: "critical",
    allowedEnvironments: ["prod"],
    autoExecute: true
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "prod_high_risk_auto_execute_forbidden"), true);
});

test("allows a low-risk mock external agent run", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentProfile,
    request: externalAgentRequest(),
    env: "dev"
  });
  assert.equal(result.decision, "allow");
});

test("allows checked-in mock connector profiles only inside their declared boundary", async () => {
  const profilePaths = [
    "config/connectors/openclaw.mock.json",
    "config/connectors/hermes-agent.mock.json"
  ];

  for (const profilePath of profilePaths) {
    const profile = JSON.parse(await readFile(path.join(repoRoot, profilePath), "utf8"));

    const allowed = evaluateExternalAgentRun({
      connectorProfile: profile,
      request: externalAgentRequest({ connectorId: profile.connectorId }),
      env: "dev"
    });
    assert.equal(allowed.decision, "allow", profilePath);

    const prod = evaluateExternalAgentRun({
      connectorProfile: profile,
      request: externalAgentRequest({ connectorId: profile.connectorId, env: "prod" }),
      env: "prod"
    });
    assert.equal(prod.decision, "deny", profilePath);
    assert.equal(prod.reason, "environment_not_allowed", profilePath);

    const restricted = evaluateExternalAgentRun({
      connectorProfile: profile,
      request: externalAgentRequest({
        connectorId: profile.connectorId,
        dataClassification: "restricted"
      }),
      env: "dev"
    });
    assert.equal(restricted.decision, "deny", profilePath);
    assert.equal(restricted.reason, "data_classification_not_allowed", profilePath);
  }
});

test("requires approval for medium and high risk external agent runs", () => {
  const medium = evaluateExternalAgentRun({
    connectorProfile: externalAgentProfile,
    request: externalAgentRequest({ riskLevel: "medium" }),
    env: "dev"
  });
  assert.equal(medium.decision, "require_approval");
  assert.equal(medium.reason, "approval_required");

  const high = evaluateExternalAgentRun({
    connectorProfile: externalAgentStressProfile({ riskLevelAllowed: ["low", "medium", "high"] }),
    request: externalAgentRequest({ riskLevel: "high" }),
    env: "dev"
  });
  assert.equal(high.decision, "require_approval");
  assert.equal(high.reason, "approval_required");
});

test("requires approval before sending restricted data to an external agent", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentStressProfile({
      dataClassificationAllowed: ["public", "internal", "restricted"]
    }),
    request: externalAgentRequest({ dataClassification: "restricted" }),
    env: "dev"
  });
  assert.equal(result.decision, "require_approval");
  assert.equal(result.reason, "data_classification_approval_required");
});

test("requires sanitized input references after restricted external agent approval", () => {
  const profile = externalAgentStressProfile({
    dataClassificationAllowed: ["public", "internal", "restricted"]
  });

  const missingEvidence = evaluateExternalAgentRun({
    connectorProfile: profile,
    request: externalAgentRequest({ dataClassification: "restricted" }),
    env: "dev",
    hasApproval: true
  });
  assert.equal(missingEvidence.decision, "deny");
  assert.equal(missingEvidence.reason, "sanitized_input_refs_required");

  const redacted = evaluateExternalAgentRun({
    connectorProfile: profile,
    request: externalAgentRequest({
      dataClassification: "restricted",
      inputRefs: [
        {
          refId: "input-redacted-001",
          kind: "redacted_summary",
          path: "dist/redacted/external-agent-input-001.json",
          redactionStatus: "redacted",
          rawSensitiveDataIncluded: false
        }
      ]
    }),
    env: "dev",
    hasApproval: true
  });
  assert.equal(redacted.decision, "allow");
});

test("requires approval before sending sensitive data to an external agent", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentStressProfile({
      dataClassificationAllowed: ["public", "internal", "restricted", "sensitive"]
    }),
    request: externalAgentRequest({ dataClassification: "sensitive" }),
    env: "dev"
  });
  assert.equal(result.decision, "require_approval");
  assert.equal(result.reason, "data_classification_approval_required");
});

test("rejects external agent data classifications outside the connector profile", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentProfile,
    request: externalAgentRequest({ dataClassification: "restricted" }),
    env: "dev"
  });
  assert.equal(result.decision, "deny");
  assert.equal(result.reason, "data_classification_not_allowed");
});

test("rejects external agent environments outside the connector profile", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentProfile,
    request: externalAgentRequest({ env: "prod" }),
    env: "prod"
  });
  assert.equal(result.decision, "deny");
  assert.equal(result.reason, "environment_not_allowed");
});

test("rejects external agent directions outside the connector profile", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentStressProfile({
      supportedDirections: ["ai_hrms_to_external_agent"]
    }),
    request: externalAgentRequest({ direction: "external_agent_to_ai_hrms" }),
    env: "dev"
  });
  assert.equal(result.decision, "deny");
  assert.equal(result.reason, "direction_not_allowed");
});

test("requires approval when a connector profile opts into default approval", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentStressProfile({ approvalRequiredByDefault: true }),
    request: externalAgentRequest(),
    env: "dev"
  });
  assert.equal(result.decision, "require_approval");
  assert.equal(result.reason, "connector_requires_approval_by_default");
  assert.equal(result.auditTags.includes("ApprovalGate"), true);
});

test("rejects real external agent execution unless explicitly enabled", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: {
      ...externalAgentProfile,
      mode: "local_cli"
    },
    request: externalAgentRequest(),
    env: "dev"
  });
  assert.equal(result.decision, "deny");
  assert.equal(result.reason, "real_external_agent_execution_disabled");
});

test("rejects high-risk production external agent auto-execution", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentStressProfile({
      allowedEnvironments: ["dev", "ci", "prod"],
      riskLevelAllowed: ["low", "medium", "high"]
    }),
    request: externalAgentRequest({ env: "prod", riskLevel: "high" }),
    env: "prod",
    hasApproval: true,
    autoExecute: true
  });
  assert.equal(result.decision, "deny");
  assert.equal(result.reason, "prod_high_risk_external_agent_auto_execute_forbidden");
});
