import {
  ACTOR_TYPES,
  ENVIRONMENTS,
  HIGH_RISK_LEVELS,
  PROMOTION_ORDER,
  REQUIRED_TELEMETRY_LABELS,
  REQUIRED_TOOL_CONTRACT_FIELDS,
  validateExternalAgentConnectorProfile,
  validateExternalAgentRunRequest,
  isEnvironment,
  isHighRisk,
  isRiskLevel
} from "../../contracts/src/index.mjs";

function issue(code, message, path = "$") {
  return { code, message, path };
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPath(root, path) {
  return path.split(".").reduce((value, key) => value?.[key], root);
}

function requireExact(errors, config, path, expected) {
  const actual = readPath(config, path);
  if (actual !== expected) {
    errors.push(
      issue(
        "environment_resource_mismatch",
        `Expected ${path} to be ${expected}.`,
        path
      )
    );
  }
}

function requirePrefix(errors, config, path, expectedPrefix) {
  const actual = readPath(config, path);
  if (!hasText(actual) || !actual.startsWith(expectedPrefix)) {
    errors.push(
      issue(
        "environment_resource_mismatch",
        `Expected ${path} to start with ${expectedPrefix}.`,
        path
      )
    );
  }
}

export function validatePromotionPath(from, to) {
  if (!isEnvironment(from) || !isEnvironment(to)) {
    return {
      ok: false,
      errors: [issue("invalid_environment", "Promotion endpoints must be valid environments.", "promotion")]
    };
  }

  const fromIndex = PROMOTION_ORDER.indexOf(from);
  const toIndex = PROMOTION_ORDER.indexOf(to);
  const expectedTo = PROMOTION_ORDER[fromIndex + 1];
  if (to !== expectedTo) {
    return {
      ok: false,
      errors: [
        issue(
          "invalid_promotion_path",
          `Promotion must advance one step at a time; ${from} can only promote to ${expectedTo ?? "no later environment"}.`,
          "promotion"
        )
      ]
    };
  }

  return { ok: true, errors: [] };
}

export function validateEnvironmentConfig(config) {
  const errors = [];
  const warnings = [];

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "Environment config must be an object.")],
      warnings
    };
  }

  const { env } = config;
  if (!isEnvironment(env)) {
    errors.push(
      issue(
        "invalid_environment",
        `env must be one of ${ENVIRONMENTS.join(", ")}.`,
        "env"
      )
    );
  }

  if (isEnvironment(env)) {
    requireExact(errors, config, "resources.database.name", `freedomrealm_${env}`);
    requireExact(errors, config, "resources.temporal.namespace", `freedomrealm-${env}`);
    requireExact(errors, config, "resources.keycloak.realm", `freedomrealm-${env}`);
    requireExact(errors, config, "resources.litellm.deployment", `litellm-${env}`);
    requireExact(errors, config, "resources.langfuse.project", `freedomrealm-${env}`);
    requirePrefix(errors, config, "resources.objectStorage.bucketOrPrefix", `freedomrealm-${env}/`);
    requireExact(errors, config, "resources.kubernetes.namespace", `freedomrealm-${env}`);
    requirePrefix(errors, config, "resources.secretPath", `freedomrealm/${env}/`);
  }

  const labels = config.telemetry?.labels ?? {};
  for (const label of REQUIRED_TELEMETRY_LABELS) {
    if (!hasText(labels[label])) {
      errors.push(
        issue(
          "missing_telemetry_label",
          `Telemetry label ${label} is required.`,
          `telemetry.labels.${label}`
        )
      );
    }
  }

  if (isEnvironment(env) && labels.env !== env) {
    errors.push(
      issue(
        "telemetry_environment_mismatch",
        `Telemetry env label must match runtime env ${env}.`,
        "telemetry.labels.env"
      )
    );
  }

  if (hasText(config.service) && hasText(labels.service) && labels.service !== config.service) {
    errors.push(
      issue(
        "telemetry_service_mismatch",
        "Telemetry service label must match service.",
        "telemetry.labels.service"
      )
    );
  }

  if (config.promotion) {
    const result = validatePromotionPath(config.promotion.from, config.promotion.to);
    errors.push(...result.errors);
    if (!hasText(config.promotion.rollbackVersion)) {
      errors.push(
        issue(
          "missing_rollback_version",
          "Promotion must declare rollbackVersion.",
          "promotion.rollbackVersion"
        )
      );
    }
    if (!hasText(config.promotion.observationWindow)) {
      errors.push(
        issue(
          "missing_observation_window",
          "Promotion must declare an observationWindow.",
          "promotion.observationWindow"
        )
      );
    }
  }

  const accesses = config.crossEnvironmentAccess ?? [];
  if (!Array.isArray(accesses)) {
    errors.push(issue("validation_failed", "crossEnvironmentAccess must be an array.", "crossEnvironmentAccess"));
  } else {
    accesses.forEach((access, index) => {
      const path = `crossEnvironmentAccess.${index}`;
      if (!isEnvironment(access.from) || !isEnvironment(access.to)) {
        errors.push(issue("invalid_environment", "Cross-environment access endpoints must be valid.", path));
      }
      if (access.from === access.to) {
        errors.push(issue("invalid_cross_environment_access", "Cross-environment access must not target the same environment.", path));
      }
      if (access.mode !== "read") {
        errors.push(issue("cross_environment_write_forbidden", "Cross-environment access must be read-only by default.", `${path}.mode`));
      }
      if (!hasText(access.approvalRef) || !hasText(access.auditRef)) {
        errors.push(issue("missing_approval_or_audit_ref", "Cross-environment access requires approvalRef and auditRef.", path));
      }
    });
  }

  const data = config.data ?? {};
  if (env !== "prod" && data.source === "prod") {
    if (data.desensitized !== true || data.sampled !== true || !hasText(data.approvalRef) || !hasText(data.retention)) {
      errors.push(
        issue(
          "prod_data_sink_requires_controls",
          "Production samples in non-prod require desensitization, sampling, approvalRef, and retention.",
          "data"
        )
      );
    }
  }

  if (config.secrets && typeof config.secrets === "object") {
    for (const [key, value] of Object.entries(config.secrets)) {
      if (hasText(value) && !key.endsWith("Ref") && !key.endsWith("Path")) {
        errors.push(
          issue(
            "secret_material_in_config",
            "Config may reference secret paths, but must not contain secret material.",
            `secrets.${key}`
          )
        );
      }
    }
  } else if (config.secrets !== undefined) {
    warnings.push(issue("validation_failed", "secrets should be an object of references.", "secrets"));
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateToolContract(toolContract) {
  const errors = [];

  if (!toolContract || typeof toolContract !== "object" || Array.isArray(toolContract)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "ToolContract must be an object.")]
    };
  }

  for (const field of REQUIRED_TOOL_CONTRACT_FIELDS) {
    if (!(field in toolContract)) {
      errors.push(issue("missing_tool_contract_field", `ToolContract.${field} is required.`, field));
    }
  }

  if (!isRiskLevel(toolContract.riskLevel)) {
    errors.push(issue("invalid_risk_level", "riskLevel is invalid.", "riskLevel"));
  }

  if (!Array.isArray(toolContract.allowedEnvironments) || toolContract.allowedEnvironments.some((env) => !isEnvironment(env))) {
    errors.push(issue("invalid_allowed_environments", "allowedEnvironments must contain only registered environments.", "allowedEnvironments"));
  }

  if (!Array.isArray(toolContract.allowedActorTypes) || toolContract.allowedActorTypes.some((type) => !ACTOR_TYPES.includes(type))) {
    errors.push(issue("invalid_actor_type", "allowedActorTypes must contain only registered actor types.", "allowedActorTypes"));
  }

  if (!Array.isArray(toolContract.requiredPermissions)) {
    errors.push(issue("validation_failed", "requiredPermissions must be an array.", "requiredPermissions"));
  }

  if (!Array.isArray(toolContract.auditTags) || toolContract.auditTags.length === 0) {
    errors.push(issue("missing_audit_tags", "auditTags must contain at least one audit tag.", "auditTags"));
  }

  const amount = toolContract.budgetLimit?.amount;
  if (typeof amount !== "number" || amount <= 0) {
    errors.push(issue("invalid_budget_limit", "budgetLimit.amount must be greater than zero.", "budgetLimit.amount"));
  }

  if (toolContract.allowedEnvironments?.includes("prod") && isHighRisk(toolContract.riskLevel) && toolContract.autoExecute === true) {
    errors.push(
      issue(
        "prod_high_risk_auto_execute_forbidden",
        "High-risk production tools must not auto-execute.",
        "autoExecute"
      )
    );
  }

  return { ok: errors.length === 0, errors };
}

export function evaluateToolExecution({ toolContract, env, actorType, hasApproval = false }) {
  const validation = validateToolContract(toolContract);
  if (!validation.ok) {
    return {
      decision: "deny",
      riskLevel: toolContract?.riskLevel,
      reason: "invalid_tool_contract",
      errors: validation.errors,
      auditTags: toolContract?.auditTags ?? []
    };
  }

  if (!toolContract.allowedEnvironments.includes(env)) {
    return {
      decision: "deny",
      riskLevel: toolContract.riskLevel,
      reason: "environment_not_allowed",
      errors: [issue("policy_violation", `Tool is not allowed in ${env}.`, "env")],
      auditTags: toolContract.auditTags
    };
  }

  if (!toolContract.allowedActorTypes.includes(actorType)) {
    return {
      decision: "deny",
      riskLevel: toolContract.riskLevel,
      reason: "actor_type_not_allowed",
      errors: [issue("forbidden", `Actor type ${actorType} is not allowed for this tool.`, "actorType")],
      auditTags: toolContract.auditTags
    };
  }

  if (HIGH_RISK_LEVELS.includes(toolContract.riskLevel) && !hasApproval) {
    return {
      decision: "require_approval",
      riskLevel: toolContract.riskLevel,
      reason: "approval_required",
      errors: [],
      auditTags: [...new Set([...toolContract.auditTags, "ApprovalGate"])]
    };
  }

  if (toolContract.autoExecute !== true && !hasApproval) {
    return {
      decision: "require_approval",
      riskLevel: toolContract.riskLevel,
      reason: "manual_execution_required",
      errors: [],
      auditTags: toolContract.auditTags
    };
  }

  return {
    decision: "allow",
    riskLevel: toolContract.riskLevel,
    reason: "policy_allowed",
    errors: [],
    auditTags: toolContract.auditTags
  };
}

export function evaluateExternalAgentRun({
  connectorProfile,
  request,
  env,
  hasApproval = false,
  realExecutionEnabled = false,
  autoExecute = false
}) {
  const profileValidation = validateExternalAgentConnectorProfile(connectorProfile);
  if (!profileValidation.ok) {
    return {
      decision: "deny",
      riskLevel: request?.riskLevel,
      reason: "invalid_connector_profile",
      errors: profileValidation.errors,
      auditTags: connectorProfile?.auditTags ?? []
    };
  }

  const requestValidation = validateExternalAgentRunRequest(request);
  if (!requestValidation.ok) {
    return {
      decision: "deny",
      riskLevel: request?.riskLevel,
      reason: "invalid_external_agent_run_request",
      errors: requestValidation.errors,
      auditTags: connectorProfile.auditTags
    };
  }

  if (request.connectorId !== connectorProfile.connectorId) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "connector_not_registered_for_request",
      errors: [
        issue(
          "policy_violation",
          "External agent request connectorId must match a registered connector profile.",
          "connectorId"
        )
      ],
      auditTags: connectorProfile.auditTags
    };
  }

  if (request.env !== env) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "environment_mismatch",
      errors: [issue("policy_violation", "Request env must match runtime env.", "env")],
      auditTags: connectorProfile.auditTags
    };
  }

  if (!connectorProfile.allowedEnvironments.includes(env)) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "environment_not_allowed",
      errors: [issue("policy_violation", `Connector is not allowed in ${env}.`, "env")],
      auditTags: connectorProfile.auditTags
    };
  }

  if (!connectorProfile.supportedDirections.includes(request.direction)) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "direction_not_allowed",
      errors: [
        issue(
          "policy_violation",
          `Connector does not support direction ${request.direction}.`,
          "direction"
        )
      ],
      auditTags: connectorProfile.auditTags
    };
  }

  if (!connectorProfile.dataClassificationAllowed.includes(request.dataClassification)) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "data_classification_not_allowed",
      errors: [
        issue(
          "policy_violation",
          `Connector is not allowed to handle ${request.dataClassification} data.`,
          "dataClassification"
        )
      ],
      auditTags: connectorProfile.auditTags
    };
  }

  if (!connectorProfile.riskLevelAllowed.includes(request.riskLevel)) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "risk_level_not_allowed",
      errors: [
        issue(
          "policy_violation",
          `Connector is not allowed to handle ${request.riskLevel} risk runs.`,
          "riskLevel"
        )
      ],
      auditTags: connectorProfile.auditTags
    };
  }

  if (connectorProfile.mode !== "mock" && realExecutionEnabled !== true) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "real_external_agent_execution_disabled",
      errors: [
        issue(
          "policy_violation",
          "Real external agent execution is disabled by default and requires explicit local configuration.",
          "mode"
        )
      ],
      auditTags: connectorProfile.auditTags
    };
  }

  if (env === "prod" && HIGH_RISK_LEVELS.includes(request.riskLevel) && autoExecute === true) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "prod_high_risk_external_agent_auto_execute_forbidden",
      errors: [
        issue(
          "policy_violation",
          "High-risk production external agent runs must not auto-execute.",
          "autoExecute"
        )
      ],
      auditTags: connectorProfile.auditTags
    };
  }

  const sensitiveOutbound =
    request.direction === "freedomrealm_to_external_agent" &&
    ["restricted", "sensitive"].includes(request.dataClassification);
  if (sensitiveOutbound && !hasApproval) {
    return {
      decision: "require_approval",
      riskLevel: request.riskLevel,
      reason: "data_classification_approval_required",
      errors: [],
      auditTags: [...new Set([...connectorProfile.auditTags, "ApprovalGate"])]
    };
  }

  if (sensitiveOutbound && !request.inputRefs.some(hasSanitizedOrAuditableInputRef)) {
    return {
      decision: "deny",
      riskLevel: request.riskLevel,
      reason: "sanitized_input_refs_required",
      errors: [
        issue(
          "policy_violation",
          "Restricted or sensitive external agent outbound requests must use redacted, summarized, or auditable inputRefs.",
          "inputRefs"
        )
      ],
      auditTags: connectorProfile.auditTags
    };
  }

  if (request.riskLevel !== "low" && !hasApproval) {
    return {
      decision: "require_approval",
      riskLevel: request.riskLevel,
      reason: "approval_required",
      errors: [],
      auditTags: [...new Set([...connectorProfile.auditTags, "ApprovalGate"])]
    };
  }

  if (connectorProfile.approvalRequiredByDefault === true && !hasApproval) {
    return {
      decision: "require_approval",
      riskLevel: request.riskLevel,
      reason: "connector_requires_approval_by_default",
      errors: [],
      auditTags: [...new Set([...connectorProfile.auditTags, "ApprovalGate"])]
    };
  }

  return {
    decision: "allow",
    riskLevel: request.riskLevel,
    reason: "policy_allowed",
    errors: [],
    auditTags: connectorProfile.auditTags
  };
}

const SANITIZED_INPUT_REF_STATUSES = ["redacted", "summarized", "reference_only", "auditable_reference"];

function hasSanitizedOrAuditableInputRef(inputRef) {
  if (!isPlainObject(inputRef)) {
    return false;
  }

  const statusCandidates = [
    inputRef.redactionStatus,
    inputRef.sanitizationStatus,
    inputRef.summaryStatus,
    inputRef.referenceStatus
  ].filter(hasText);

  if (statusCandidates.some((status) => SANITIZED_INPUT_REF_STATUSES.includes(status))) {
    return true;
  }

  return inputRef.auditable === true && inputRef.rawSensitiveDataIncluded !== true;
}
