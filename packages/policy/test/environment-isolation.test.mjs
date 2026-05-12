import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateExternalAgentRun,
  evaluateToolExecution,
  validateEnvironmentConfig,
  validatePromotionPath,
  validateToolContract
} from "../src/index.mjs";

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
  allowedEnvironments: ["dev", "ci", "prod"],
  dataClassificationAllowed: ["public", "internal", "restricted"],
  riskLevelAllowed: ["low", "medium", "high"],
  toolContractRefs: ["tool-contract://external-agent.openclaw.mock.request.v1"],
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

test("requires approval for medium and high risk external agent runs", () => {
  const medium = evaluateExternalAgentRun({
    connectorProfile: externalAgentProfile,
    request: externalAgentRequest({ riskLevel: "medium" }),
    env: "dev"
  });
  assert.equal(medium.decision, "require_approval");
  assert.equal(medium.reason, "approval_required");

  const high = evaluateExternalAgentRun({
    connectorProfile: externalAgentProfile,
    request: externalAgentRequest({ riskLevel: "high" }),
    env: "dev"
  });
  assert.equal(high.decision, "require_approval");
  assert.equal(high.reason, "approval_required");
});

test("requires approval before sending restricted data to an external agent", () => {
  const result = evaluateExternalAgentRun({
    connectorProfile: externalAgentProfile,
    request: externalAgentRequest({ dataClassification: "restricted" }),
    env: "dev"
  });
  assert.equal(result.decision, "require_approval");
  assert.equal(result.reason, "data_classification_approval_required");
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
    connectorProfile: externalAgentProfile,
    request: externalAgentRequest({ env: "prod", riskLevel: "high" }),
    env: "prod",
    hasApproval: true,
    autoExecute: true
  });
  assert.equal(result.decision, "deny");
  assert.equal(result.reason, "prod_high_risk_external_agent_auto_execute_forbidden");
});
