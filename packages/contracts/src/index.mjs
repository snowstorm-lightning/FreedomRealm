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

export const POLICY_DECISIONS = Object.freeze([
  "allow",
  "deny",
  "require_approval",
  "escalate"
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
