export const ENVIRONMENTS = Object.freeze(["dev", "ci", "staging", "prod"]);

export const PROMOTION_ORDER = Object.freeze(["dev", "ci", "staging", "prod"]);

export const ACTOR_TYPES = Object.freeze([
  "HumanActor",
  "AgentActor",
  "ServiceAccount",
  "ExternalConnector"
]);

export const RISK_LEVELS = Object.freeze(["low", "medium", "high", "critical"]);

export const HIGH_RISK_LEVELS = Object.freeze(["high", "critical"]);

export const DATA_CLASSIFICATIONS = Object.freeze([
  "public",
  "internal",
  "restricted",
  "sensitive"
]);

export const POLICY_DECISIONS = Object.freeze([
  "allow",
  "deny",
  "require_approval",
  "escalate"
]);

export const EXECUTION_REPORT_CARD_SCHEMA_VERSION = "execution-report-card.v1";

export const ANSWER_CARD_SCHEMA_VERSION = "answer-card.v1";

export const DOC_CHALLENGE_DRAFT_SCHEMA_VERSION = "doc-challenge-draft.v1";

export const EXTERNAL_AGENT_CONNECTOR_PROFILE_SCHEMA_VERSION = "external-agent-connector-profile.v1";

export const EXTERNAL_AGENT_RUN_REQUEST_SCHEMA_VERSION = "external-agent-run-request.v1";

export const EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION = "external-agent-run-result.v1";

export const PROJECT_OPERATING_ENTRY_SCHEMA_VERSION = "project-operating-entry.v1";

export const EXTERNAL_AGENT_PROVIDERS = Object.freeze([
  "openclaw",
  "hermes-agent",
  "custom"
]);

export const EXTERNAL_AGENT_CONNECTOR_MODES = Object.freeze([
  "mock",
  "local_cli",
  "remote_gateway"
]);

export const EXTERNAL_AGENT_DIRECTIONS = Object.freeze([
  "ai_hrms_to_external_agent",
  "external_agent_to_ai_hrms"
]);

export const EXTERNAL_AGENT_CONNECTOR_PROFILE_REQUIRED_FIELDS = Object.freeze([
  "connectorId",
  "schemaVersion",
  "provider",
  "mode",
  "supportedDirections",
  "allowedEnvironments",
  "dataClassificationAllowed",
  "riskLevelAllowed",
  "toolContractRefs",
  "approvalRequiredByDefault",
  "secretRefPolicy",
  "auditTags",
  "extensions"
]);

export const EXTERNAL_AGENT_RUN_REQUEST_REQUIRED_FIELDS = Object.freeze([
  "requestId",
  "schemaVersion",
  "connectorId",
  "direction",
  "env",
  "actor",
  "projectInstanceId",
  "workItemId",
  "agentRunId",
  "riskLevel",
  "dataClassification",
  "taskGoal",
  "inputRefs",
  "requestedCapabilities",
  "approvalRef",
  "extensions"
]);

export const EXTERNAL_AGENT_RUN_RESULT_REQUIRED_FIELDS = Object.freeze([
  "resultId",
  "schemaVersion",
  "connectorId",
  "direction",
  "env",
  "agentRunId",
  "status",
  "outputRefs",
  "summary",
  "findings",
  "recommendations",
  "auditRefs",
  "dataClassification",
  "redactionStatus",
  "extensions"
]);

export const PROJECT_OPERATING_ENTRY_REQUIRED_FIELDS = Object.freeze([
  "schemaVersion",
  "sourceDocPath",
  "recommendedReadOrder",
  "startupCommands",
  "currentTasks",
  "assignmentRules",
  "leaseTemplate",
  "conflictRules",
  "continuationRules",
  "harnessPrinciples",
  "extensions"
]);

export const EXECUTION_REPORT_CARD_REQUIRED_FIELDS = Object.freeze([
  "reportCardId",
  "schemaVersion",
  "generatedAt",
  "projectInstanceId",
  "workItemId",
  "agentRunId",
  "templateId",
  "templateVersion",
  "taskGoal",
  "inputRefs",
  "outputRefs",
  "agentActorId",
  "humanOwnerId",
  "skillRefs",
  "toolContractRefs",
  "riskLevel",
  "approvalStatus",
  "auditRefs",
  "dataClassification",
  "redactionStatus",
  "sharePermission",
  "status",
  "summary",
  "findings",
  "recommendations",
  "nextActions",
  "metrics",
  "failure",
  "extensions"
]);

export const REPORT_CARD_STATUSES = Object.freeze([
  "completed",
  "needs_review",
  "blocked",
  "failed"
]);

export const APPROVAL_STATUSES = Object.freeze([
  "not_required",
  "requires_human_review",
  "approved",
  "rejected",
  "escalated"
]);

export const DOC_CHALLENGE_STATUSES = Object.freeze([
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "closed"
]);

export const REQUIRED_TELEMETRY_LABELS = Object.freeze([
  "env",
  "service",
  "version",
  "workflow_id",
  "agent_run_id",
  "actor_type",
  "actor_id",
  "policy_version",
  "approval_refs"
]);

export const REQUIRED_TOOL_CONTRACT_FIELDS = Object.freeze([
  "toolName",
  "description",
  "inputSchemaRef",
  "outputSchemaRef",
  "requiredPermissions",
  "riskLevel",
  "allowedActorTypes",
  "allowedEnvironments",
  "autoExecute",
  "budgetLimit",
  "auditTags"
]);

export function isEnvironment(value) {
  return ENVIRONMENTS.includes(value);
}

export function isRiskLevel(value) {
  return RISK_LEVELS.includes(value);
}

export function isHighRisk(value) {
  return HIGH_RISK_LEVELS.includes(value);
}

export function isDataClassification(value) {
  return DATA_CLASSIFICATIONS.includes(value);
}

export {
  renderExecutionReportCardMarkdown,
  validateExecutionReportCard
} from "./execution-report-card.mjs";

export {
  validateAnswerCard,
  validateDocChallengeDraft
} from "./knowledge-cards.mjs";

export {
  validateExternalAgentConnectorProfile,
  validateExternalAgentRunRequest,
  validateExternalAgentRunResult
} from "./external-agent-connectors.mjs";

export {
  validateProjectOperatingEntry
} from "./project-operating-entry.mjs";
