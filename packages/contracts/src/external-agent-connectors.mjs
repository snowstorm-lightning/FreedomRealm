import {
  ACTOR_TYPES,
  DATA_CLASSIFICATIONS,
  ENVIRONMENTS,
  EXTERNAL_AGENT_CONNECTOR_MODES,
  EXTERNAL_AGENT_CONNECTOR_PROFILE_REQUIRED_FIELDS,
  EXTERNAL_AGENT_CONNECTOR_PROFILE_SCHEMA_VERSION,
  EXTERNAL_AGENT_DIRECTIONS,
  EXTERNAL_AGENT_PROVIDERS,
  EXTERNAL_AGENT_RUN_REQUEST_REQUIRED_FIELDS,
  EXTERNAL_AGENT_RUN_REQUEST_SCHEMA_VERSION,
  EXTERNAL_AGENT_RUN_RESULT_REQUIRED_FIELDS,
  EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION,
  RISK_LEVELS
} from "./index.mjs";

const namespacedKeyPattern = /^[A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9][A-Za-z0-9-]*)+$/u;
const sensitiveKeyPattern = /(secret|token|password|credential|api[_-]?key|apikey)/iu;

function issue(code, message, path = "$") {
  return { code, message, path };
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateStringField(errors, object, field) {
  if (field in object && !hasText(object[field])) {
    errors.push(issue("validation_failed", `${field} must be a non-empty string.`, field));
  }
}

function validateObjectField(errors, object, field) {
  if (!isPlainObject(object[field])) {
    errors.push(issue("validation_failed", `${field} must be an object.`, field));
  }
}

function validateStringArray(errors, object, field, allowedValues = null) {
  if (!Array.isArray(object[field]) || object[field].length === 0) {
    errors.push(issue("validation_failed", `${field} must be a non-empty array.`, field));
    return;
  }

  object[field].forEach((value, index) => {
    const path = `${field}.${index}`;
    if (!hasText(value)) {
      errors.push(issue("validation_failed", `${field} values must be non-empty strings.`, path));
      return;
    }
    if (allowedValues && !allowedValues.includes(value)) {
      errors.push(issue("validation_failed", `${field} contains an unsupported value.`, path));
    }
  });
}

function validateActor(errors, actor) {
  if (!isPlainObject(actor)) {
    errors.push(issue("validation_failed", "actor must be an object.", "actor"));
    return;
  }
  if (!ACTOR_TYPES.includes(actor.actorType)) {
    errors.push(issue("invalid_actor_type", "actor.actorType is invalid.", "actor.actorType"));
  }
  if (!hasText(actor.actorId)) {
    errors.push(issue("validation_failed", "actor.actorId must be a non-empty string.", "actor.actorId"));
  }
}

function validateNamespacedExtensions(errors, extensions) {
  if (!isPlainObject(extensions)) {
    return;
  }

  for (const key of Object.keys(extensions)) {
    if (!namespacedKeyPattern.test(key)) {
      errors.push(
        issue(
          "invalid_extension_namespace",
          "extensions keys must be namespaced and must not override standard fields.",
          `extensions.${key}`
        )
      );
    }
  }
}

function validateNoPlaintextSecrets(errors, value, path = "$") {
  if (!isPlainObject(value) && !Array.isArray(value)) {
    return;
  }

  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry])
    : Object.entries(value);

  for (const [key, child] of entries) {
    const childPath = `${path}.${key}`;
    if (
      sensitiveKeyPattern.test(key) &&
      hasText(child) &&
      !key.endsWith("Ref") &&
      !key.endsWith("Path")
    ) {
      errors.push(
        issue(
          "secret_material_in_connector_profile",
          "Connector profiles may reference secret refs or paths, but must not contain secret material.",
          childPath
        )
      );
    }
    validateNoPlaintextSecrets(errors, child, childPath);
  }
}

function validateRequiredFields(errors, object, requiredFields, label) {
  for (const field of requiredFields) {
    if (!(field in object)) {
      errors.push(issue("missing_required_field", `${label}.${field} is required.`, field));
    }
  }
}

export function validateExternalAgentConnectorProfile(profile) {
  const errors = [];

  if (!isPlainObject(profile)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "ExternalAgentConnectorProfile must be an object.")]
    };
  }

  validateRequiredFields(
    errors,
    profile,
    EXTERNAL_AGENT_CONNECTOR_PROFILE_REQUIRED_FIELDS,
    "ExternalAgentConnectorProfile"
  );

  for (const field of ["connectorId", "schemaVersion", "provider", "mode"]) {
    validateStringField(errors, profile, field);
  }

  if (profile.schemaVersion !== EXTERNAL_AGENT_CONNECTOR_PROFILE_SCHEMA_VERSION) {
    errors.push(
      issue(
        "unsupported_schema_version",
        `schemaVersion must be ${EXTERNAL_AGENT_CONNECTOR_PROFILE_SCHEMA_VERSION}.`,
        "schemaVersion"
      )
    );
  }

  if ("provider" in profile && !EXTERNAL_AGENT_PROVIDERS.includes(profile.provider)) {
    errors.push(issue("invalid_external_agent_provider", "provider is invalid.", "provider"));
  }

  if ("mode" in profile && !EXTERNAL_AGENT_CONNECTOR_MODES.includes(profile.mode)) {
    errors.push(issue("invalid_external_agent_mode", "mode is invalid.", "mode"));
  }

  validateStringArray(errors, profile, "supportedDirections", EXTERNAL_AGENT_DIRECTIONS);
  validateStringArray(errors, profile, "allowedEnvironments", ENVIRONMENTS);
  validateStringArray(errors, profile, "dataClassificationAllowed", DATA_CLASSIFICATIONS);
  validateStringArray(errors, profile, "riskLevelAllowed", RISK_LEVELS);

  if (!Array.isArray(profile.toolContractRefs)) {
    errors.push(issue("validation_failed", "toolContractRefs must be an array.", "toolContractRefs"));
  }

  if (typeof profile.approvalRequiredByDefault !== "boolean") {
    errors.push(
      issue(
        "validation_failed",
        "approvalRequiredByDefault must be a boolean.",
        "approvalRequiredByDefault"
      )
    );
  }

  validateObjectField(errors, profile, "secretRefPolicy");
  validateStringArray(errors, profile, "auditTags");
  validateObjectField(errors, profile, "extensions");
  validateNamespacedExtensions(errors, profile.extensions);
  validateNoPlaintextSecrets(errors, profile.secretRefPolicy, "secretRefPolicy");

  return { ok: errors.length === 0, errors };
}

export function validateExternalAgentRunRequest(request) {
  const errors = [];

  if (!isPlainObject(request)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "ExternalAgentRunRequest must be an object.")]
    };
  }

  validateRequiredFields(errors, request, EXTERNAL_AGENT_RUN_REQUEST_REQUIRED_FIELDS, "ExternalAgentRunRequest");

  for (const field of [
    "requestId",
    "schemaVersion",
    "connectorId",
    "direction",
    "env",
    "projectInstanceId",
    "workItemId",
    "agentRunId",
    "riskLevel",
    "dataClassification",
    "taskGoal"
  ]) {
    validateStringField(errors, request, field);
  }

  if (request.schemaVersion !== EXTERNAL_AGENT_RUN_REQUEST_SCHEMA_VERSION) {
    errors.push(
      issue(
        "unsupported_schema_version",
        `schemaVersion must be ${EXTERNAL_AGENT_RUN_REQUEST_SCHEMA_VERSION}.`,
        "schemaVersion"
      )
    );
  }

  if ("direction" in request && !EXTERNAL_AGENT_DIRECTIONS.includes(request.direction)) {
    errors.push(issue("invalid_external_agent_direction", "direction is invalid.", "direction"));
  }
  if ("env" in request && !ENVIRONMENTS.includes(request.env)) {
    errors.push(issue("invalid_environment", "env is invalid.", "env"));
  }
  if ("riskLevel" in request && !RISK_LEVELS.includes(request.riskLevel)) {
    errors.push(issue("invalid_risk_level", "riskLevel is invalid.", "riskLevel"));
  }
  if ("dataClassification" in request && !DATA_CLASSIFICATIONS.includes(request.dataClassification)) {
    errors.push(
      issue(
        "invalid_data_classification",
        "dataClassification is invalid.",
        "dataClassification"
      )
    );
  }

  validateActor(errors, request.actor);

  if (!Array.isArray(request.inputRefs)) {
    errors.push(issue("validation_failed", "inputRefs must be an array.", "inputRefs"));
  }
  if (!Array.isArray(request.requestedCapabilities)) {
    errors.push(
      issue(
        "validation_failed",
        "requestedCapabilities must be an array.",
        "requestedCapabilities"
      )
    );
  }
  if (request.approvalRef !== null && request.approvalRef !== undefined && !hasText(request.approvalRef)) {
    errors.push(issue("validation_failed", "approvalRef must be null or a string.", "approvalRef"));
  }
  validateObjectField(errors, request, "extensions");
  validateNamespacedExtensions(errors, request.extensions);

  return { ok: errors.length === 0, errors };
}

export function validateExternalAgentRunResult(result) {
  const errors = [];

  if (!isPlainObject(result)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "ExternalAgentRunResult must be an object.")]
    };
  }

  validateRequiredFields(errors, result, EXTERNAL_AGENT_RUN_RESULT_REQUIRED_FIELDS, "ExternalAgentRunResult");

  for (const field of [
    "resultId",
    "schemaVersion",
    "connectorId",
    "direction",
    "env",
    "agentRunId",
    "status",
    "summary",
    "dataClassification",
    "redactionStatus"
  ]) {
    validateStringField(errors, result, field);
  }

  if (result.schemaVersion !== EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION) {
    errors.push(
      issue(
        "unsupported_schema_version",
        `schemaVersion must be ${EXTERNAL_AGENT_RUN_RESULT_SCHEMA_VERSION}.`,
        "schemaVersion"
      )
    );
  }

  if ("direction" in result && !EXTERNAL_AGENT_DIRECTIONS.includes(result.direction)) {
    errors.push(issue("invalid_external_agent_direction", "direction is invalid.", "direction"));
  }
  if ("env" in result && !ENVIRONMENTS.includes(result.env)) {
    errors.push(issue("invalid_environment", "env is invalid.", "env"));
  }
  if ("dataClassification" in result && !DATA_CLASSIFICATIONS.includes(result.dataClassification)) {
    errors.push(
      issue(
        "invalid_data_classification",
        "dataClassification is invalid.",
        "dataClassification"
      )
    );
  }

  for (const field of ["outputRefs", "findings", "recommendations", "auditRefs"]) {
    if (!Array.isArray(result[field])) {
      errors.push(issue("validation_failed", `${field} must be an array.`, field));
    }
  }

  validateObjectField(errors, result, "extensions");
  validateNamespacedExtensions(errors, result.extensions);

  return { ok: errors.length === 0, errors };
}
