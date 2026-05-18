import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXTERNAL_AGENT_CONNECTOR_PROFILE_SCHEMA_VERSION,
  EXTERNAL_AGENT_RUN_REQUEST_SCHEMA_VERSION,
  EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION,
  validateExternalAgentConnectorProfile,
  validateExternalAgentRunRequest,
  validateExternalAgentRunResult
} from "../src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function validProfile() {
  return {
    connectorId: "external-agent.openclaw.mock",
    schemaVersion: EXTERNAL_AGENT_CONNECTOR_PROFILE_SCHEMA_VERSION,
    provider: "openclaw",
    mode: "mock",
    supportedDirections: ["ai_hrms_to_external_agent", "external_agent_to_ai_hrms"],
    allowedEnvironments: ["dev", "ci"],
    dataClassificationAllowed: ["public", "internal"],
    riskLevelAllowed: ["low", "medium"],
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
        upstreamDocs: "https://docs.openclaw.ai/"
      }
    }
  };
}

function validRunRequest() {
  return {
    requestId: "external-agent-request-001",
    schemaVersion: EXTERNAL_AGENT_RUN_REQUEST_SCHEMA_VERSION,
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
    }
  };
}

test("validates an ExternalAgentConnectorProfile v1", () => {
  const result = validateExternalAgentConnectorProfile(validProfile());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("validates checked-in OpenClaw and Hermes Agent mock connector profiles", async () => {
  const profilePaths = [
    "config/connectors/openclaw.mock.json",
    "config/connectors/hermes-agent.mock.json"
  ];

  for (const profilePath of profilePaths) {
    const profile = JSON.parse(await readFile(path.join(repoRoot, profilePath), "utf8"));
    const result = validateExternalAgentConnectorProfile(profile);
    assert.equal(result.ok, true, `${profilePath}: ${JSON.stringify(result.errors, null, 2)}`);
  }
});

test("rejects connector profiles without schemaVersion", () => {
  const profile = validProfile();
  delete profile.schemaVersion;
  const result = validateExternalAgentConnectorProfile(profile);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.path === "schemaVersion"), true);
});

test("rejects connector profiles with plaintext secret material", () => {
  const profile = validProfile();
  profile.secretRefPolicy.apiKey = "sk-local-test";
  const result = validateExternalAgentConnectorProfile(profile);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some((error) => error.code === "secret_material_in_connector_profile"),
    true
  );
});

test("rejects connector profiles with invalid environments", () => {
  const profile = validProfile();
  profile.allowedEnvironments = ["dev", "personal-laptop"];
  const result = validateExternalAgentConnectorProfile(profile);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.path === "allowedEnvironments.1"), true);
});

test("rejects non-namespaced connector profile extensions", () => {
  const profile = validProfile();
  profile.extensions.openclaw = {};
  const result = validateExternalAgentConnectorProfile(profile);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "invalid_extension_namespace"), true);
});

test("validates ExternalAgentRunRequest and ExternalAgentRunResult v1", () => {
  const requestResult = validateExternalAgentRunRequest(validRunRequest());
  assert.equal(requestResult.ok, true);

  const runResult = validateExternalAgentRunResult({
    resultId: "external-agent-result-001",
    schemaVersion: EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION,
    connectorId: "external-agent.openclaw.mock",
    direction: "external_agent_to_ai_hrms",
    env: "dev",
    agentRunId: "run-demo-001",
    status: "needs_review",
    outputRefs: [],
    summary: "Mock external agent output was captured as a candidate.",
    findings: [],
    recommendations: [],
    auditRefs: [],
    dataClassification: "internal",
    redactionStatus: "redacted",
    extensions: {
      "ai-hrms.external-agent": {
        mock: true
      }
    }
  });
  assert.equal(runResult.ok, true);
});

test("rejects external agent results that claim non-reviewable status", () => {
  const runResult = validateExternalAgentRunResult({
    resultId: "external-agent-result-001",
    schemaVersion: EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION,
    connectorId: "external-agent.openclaw.mock",
    direction: "external_agent_to_ai_hrms",
    env: "dev",
    agentRunId: "run-demo-001",
    status: "published",
    outputRefs: [],
    summary: "Mock external agent output tried to bypass review.",
    findings: [],
    recommendations: [],
    auditRefs: [],
    dataClassification: "internal",
    redactionStatus: "redacted",
    extensions: {
      "ai-hrms.external-agent": {
        mock: true
      }
    }
  });

  assert.equal(runResult.ok, false);
  assert.equal(
    runResult.errors.some((error) => error.code === "invalid_external_agent_result_status"),
    true
  );
});
