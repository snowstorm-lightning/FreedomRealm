import {
  ACTOR_TYPES,
  PROJECT_OPERATING_ENTRY_REQUIRED_FIELDS,
  PROJECT_OPERATING_ENTRY_SCHEMA_VERSION,
  RISK_LEVELS
} from "./index.mjs";

const namespacedKeyPattern = /^[A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9][A-Za-z0-9-]*)+$/u;
const priorities = Object.freeze(["P0", "P1", "P2"]);
const taskStatuses = Object.freeze([
  "active",
  "implemented-in-repo",
  "needs-human-owner-review",
  "blocked-needs-human-owner"
]);

function issue(code, message, path = "$") {
  return { code, message, path };
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateRequiredFields(errors, object, requiredFields, label) {
  for (const field of requiredFields) {
    if (!(field in object)) {
      errors.push(issue("missing_required_field", `${label}.${field} is required.`, field));
    }
  }
}

function validateStringField(errors, object, field, path = field) {
  if (!hasText(object[field])) {
    errors.push(issue("validation_failed", `${path} must be a non-empty string.`, path));
  }
}

function validateStringArray(errors, object, field, path = field) {
  if (!Array.isArray(object[field]) || object[field].length === 0) {
    errors.push(issue("validation_failed", `${path} must be a non-empty array.`, path));
    return;
  }

  object[field].forEach((value, index) => {
    if (!hasText(value)) {
      errors.push(issue("validation_failed", `${path} values must be non-empty strings.`, `${path}.${index}`));
    }
  });
}

function validateOptionalStringArray(errors, object, field, path = field, options = {}) {
  if (!(field in object)) {
    return;
  }

  if (!Array.isArray(object[field]) || (!options.allowEmpty && object[field].length === 0)) {
    errors.push(issue("validation_failed", `${path} must be an array of strings.`, path));
    return;
  }

  object[field].forEach((value, index) => {
    if (!hasText(value)) {
      errors.push(issue("validation_failed", `${path} values must be non-empty strings.`, `${path}.${index}`));
    }
  });
}

function validateNamespacedExtensions(errors, extensions) {
  if (!isPlainObject(extensions)) {
    errors.push(issue("validation_failed", "extensions must be an object.", "extensions"));
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

function validateCommandList(errors, object, field, path) {
  if (!Array.isArray(object[field]) || object[field].length === 0) {
    errors.push(issue("validation_failed", `${path} must be a non-empty array.`, path));
    return;
  }

  object[field].forEach((command, index) => {
    if (!hasText(command)) {
      errors.push(issue("validation_failed", `${path} values must be non-empty strings.`, `${path}.${index}`));
      return;
    }
    if (!command.trim().startsWith("pnpm ")) {
      errors.push(issue("invalid_command", `${path} commands must use pnpm scripts.`, `${path}.${index}`));
    }
  });
}

function validateCurrentTask(errors, task, index) {
  const path = `currentTasks.${index}`;
  if (!isPlainObject(task)) {
    errors.push(issue("validation_failed", "currentTasks values must be objects.", path));
    return;
  }

  for (const field of [
    "taskId",
    "priority",
    "status",
    "title",
    "ownerActorTypes",
    "outputs",
    "acceptanceCriteria",
    "verificationCommands",
    "riskLevel",
    "suggestedWriteSet"
  ]) {
    if (!(field in task)) {
      errors.push(issue("missing_required_field", `${path}.${field} is required.`, `${path}.${field}`));
    }
  }

  validateStringField(errors, task, "taskId", `${path}.taskId`);
  validateStringField(errors, task, "title", `${path}.title`);

  if (!priorities.includes(task.priority)) {
    errors.push(issue("invalid_priority", `${path}.priority must be P0, P1, or P2.`, `${path}.priority`));
  }

  if (!taskStatuses.includes(task.status)) {
    errors.push(issue("invalid_task_status", `${path}.status is invalid.`, `${path}.status`));
  }

  if (!RISK_LEVELS.includes(task.riskLevel)) {
    errors.push(issue("invalid_risk_level", `${path}.riskLevel is invalid.`, `${path}.riskLevel`));
  }

  validateStringArray(errors, task, "outputs", `${path}.outputs`);
  validateStringArray(errors, task, "acceptanceCriteria", `${path}.acceptanceCriteria`);
  validateCommandList(errors, task, "verificationCommands", `${path}.verificationCommands`);
  validateStringArray(errors, task, "suggestedWriteSet", `${path}.suggestedWriteSet`);
  validateStringArray(errors, task, "ownerActorTypes", `${path}.ownerActorTypes`);

  if (Array.isArray(task.ownerActorTypes)) {
    task.ownerActorTypes.forEach((actorType, actorIndex) => {
      if (!ACTOR_TYPES.includes(actorType)) {
        errors.push(
          issue("invalid_actor_type", `${path}.ownerActorTypes contains an invalid actor type.`, `${path}.ownerActorTypes.${actorIndex}`)
        );
      }
    });
  }

  if (task.status === "implemented-in-repo") {
    validateStringArray(errors, task, "implementationRefs", `${path}.implementationRefs`);
  } else {
    validateOptionalStringArray(errors, task, "implementationRefs", `${path}.implementationRefs`, { allowEmpty: true });
  }

  if ("sourceRefs" in task) {
    validateStringArray(errors, task, "sourceRefs", `${path}.sourceRefs`);
  }
}

function hasRequiredStopCondition(rules, token) {
  return Array.isArray(rules.allowStopWhen) && rules.allowStopWhen.some((rule) => hasText(rule) && rule.includes(token));
}

function validateBacklogItem(errors, item, index, currentTasksById) {
  const path = `extensions.ai-hrms.decayPreventionBacklog.items.${index}`;
  if (!isPlainObject(item)) {
    errors.push(issue("validation_failed", "decayPreventionBacklog.items values must be objects.", path));
    return;
  }

  for (const field of [
    "candidateWorkItemId",
    "formalTaskId",
    "status",
    "priority",
    "riskLevel",
    "ownerActorTypes",
    "sourceFindingIds",
    "sourceRecommendationIds",
    "readSet",
    "writeSet",
    "verificationCommands",
    "implementationRefs"
  ]) {
    if (!(field in item)) {
      errors.push(issue("missing_required_field", `${path}.${field} is required.`, `${path}.${field}`));
    }
  }

  validateStringField(errors, item, "candidateWorkItemId", `${path}.candidateWorkItemId`);
  validateStringField(errors, item, "formalTaskId", `${path}.formalTaskId`);

  if (!taskStatuses.includes(item.status)) {
    errors.push(issue("invalid_task_status", `${path}.status is invalid.`, `${path}.status`));
  }
  if (!priorities.includes(item.priority)) {
    errors.push(issue("invalid_priority", `${path}.priority must be P0, P1, or P2.`, `${path}.priority`));
  }
  if (!RISK_LEVELS.includes(item.riskLevel)) {
    errors.push(issue("invalid_risk_level", `${path}.riskLevel is invalid.`, `${path}.riskLevel`));
  }

  validateStringArray(errors, item, "ownerActorTypes", `${path}.ownerActorTypes`);
  if (Array.isArray(item.ownerActorTypes)) {
    item.ownerActorTypes.forEach((actorType, actorIndex) => {
      if (!ACTOR_TYPES.includes(actorType)) {
        errors.push(
          issue("invalid_actor_type", `${path}.ownerActorTypes contains an invalid actor type.`, `${path}.ownerActorTypes.${actorIndex}`)
        );
      }
    });
  }
  validateStringArray(errors, item, "sourceFindingIds", `${path}.sourceFindingIds`);
  validateStringArray(errors, item, "sourceRecommendationIds", `${path}.sourceRecommendationIds`);
  validateStringArray(errors, item, "readSet", `${path}.readSet`);
  validateStringArray(errors, item, "writeSet", `${path}.writeSet`);
  validateCommandList(errors, item, "verificationCommands", `${path}.verificationCommands`);
  validateOptionalStringArray(errors, item, "implementationRefs", `${path}.implementationRefs`, { allowEmpty: true });

  if (item.status === "implemented-in-repo" && (!Array.isArray(item.implementationRefs) || item.implementationRefs.length === 0)) {
    errors.push(
      issue("missing_implementation_refs", `${path}.implementationRefs must be non-empty when status is implemented-in-repo.`, `${path}.implementationRefs`)
    );
  }

  const formalTask = currentTasksById.get(item.formalTaskId);
  if (
    formalTask?.status === "implemented-in-repo" &&
    item.status === "implemented-in-repo" &&
    Array.isArray(formalTask.implementationRefs) &&
    Array.isArray(item.implementationRefs)
  ) {
    const formalRefs = [...formalTask.implementationRefs].sort();
    const backlogRefs = [...item.implementationRefs].sort();
    if (formalRefs.join("\n") !== backlogRefs.join("\n")) {
      errors.push(
        issue(
          "implementation_refs_drift",
          `${path}.implementationRefs must match currentTasks implementationRefs for ${item.formalTaskId}.`,
          `${path}.implementationRefs`
        )
      );
    }
  }
}

function validateDecayPreventionBacklog(errors, entry) {
  const backlog = entry.extensions?.["ai-hrms.decayPreventionBacklog"];
  if (backlog === undefined) {
    return;
  }

  const path = "extensions.ai-hrms.decayPreventionBacklog";
  if (!isPlainObject(backlog)) {
    errors.push(issue("validation_failed", "ai-hrms.decayPreventionBacklog must be an object.", path));
    return;
  }

  validateStringField(errors, backlog, "sourceReportPath", `${path}.sourceReportPath`);
  validateStringField(errors, backlog, "humanApprovalRef", `${path}.humanApprovalRef`);
  validateStringField(errors, backlog, "promotionPolicy", `${path}.promotionPolicy`);

  if (backlog.autoCreateExternalIssues !== false) {
    errors.push(issue("invalid_backlog_policy", `${path}.autoCreateExternalIssues must be false.`, `${path}.autoCreateExternalIssues`));
  }

  if (!Array.isArray(backlog.items) || backlog.items.length === 0) {
    errors.push(issue("validation_failed", `${path}.items must be a non-empty array.`, `${path}.items`));
    return;
  }

  const currentTasksById = new Map((entry.currentTasks ?? []).map((task) => [task?.taskId, task]));
  backlog.items.forEach((item, index) => validateBacklogItem(errors, item, index, currentTasksById));
}

export function validateProjectOperatingEntry(entry) {
  const errors = [];

  if (!isPlainObject(entry)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "ProjectOperatingEntry must be an object.")]
    };
  }

  validateRequiredFields(errors, entry, PROJECT_OPERATING_ENTRY_REQUIRED_FIELDS, "ProjectOperatingEntry");

  if (entry.schemaVersion !== PROJECT_OPERATING_ENTRY_SCHEMA_VERSION) {
    errors.push(
      issue(
        "unsupported_schema_version",
        `schemaVersion must be ${PROJECT_OPERATING_ENTRY_SCHEMA_VERSION}.`,
        "schemaVersion"
      )
    );
  }

  validateStringField(errors, entry, "sourceDocPath");
  validateStringArray(errors, entry, "recommendedReadOrder");
  validateCommandList(errors, entry, "startupCommands", "startupCommands");

  if (!Array.isArray(entry.currentTasks) || entry.currentTasks.length === 0) {
    errors.push(issue("validation_failed", "currentTasks must be a non-empty array.", "currentTasks"));
  } else {
    entry.currentTasks.forEach((task, index) => validateCurrentTask(errors, task, index));
    if (!entry.currentTasks.some((task) => task?.priority === "P0")) {
      errors.push(issue("missing_p0_task", "currentTasks must include at least one P0 task.", "currentTasks"));
    }
  }

  if (!isPlainObject(entry.assignmentRules)) {
    errors.push(issue("validation_failed", "assignmentRules must be an object.", "assignmentRules"));
  } else {
    validateStringArray(errors, entry.assignmentRules, "splitWhen", "assignmentRules.splitWhen");
    validateStringArray(errors, entry.assignmentRules, "defaultRules", "assignmentRules.defaultRules");
  }

  if (!isPlainObject(entry.leaseTemplate)) {
    errors.push(issue("validation_failed", "leaseTemplate must be an object.", "leaseTemplate"));
  } else {
    validateStringArray(errors, entry.leaseTemplate, "requiredFields", "leaseTemplate.requiredFields");
    for (const required of ["readSet", "writeSet", "verificationCommands", "rollbackPlan"]) {
      if (!entry.leaseTemplate.requiredFields?.includes(required)) {
        errors.push(issue("missing_lease_field", `leaseTemplate.requiredFields must include ${required}.`, "leaseTemplate.requiredFields"));
      }
    }
  }

  if (!isPlainObject(entry.conflictRules)) {
    errors.push(issue("validation_failed", "conflictRules must be an object.", "conflictRules"));
  } else {
    if (entry.conflictRules.defaultWriteSetPolicy !== "non-overlapping") {
      errors.push(
        issue(
          "invalid_write_set_policy",
          "conflictRules.defaultWriteSetPolicy must be non-overlapping.",
          "conflictRules.defaultWriteSetPolicy"
        )
      );
    }
    validateStringArray(errors, entry.conflictRules, "rules", "conflictRules.rules");
  }

  if (!isPlainObject(entry.continuationRules)) {
    errors.push(issue("validation_failed", "continuationRules must be an object.", "continuationRules"));
  } else {
    validateStringArray(errors, entry.continuationRules, "allowStopWhen", "continuationRules.allowStopWhen");
    validateStringArray(errors, entry.continuationRules, "mustContinueWhen", "continuationRules.mustContinueWhen");
    validateStringArray(errors, entry.continuationRules, "checkpointDeliverables", "continuationRules.checkpointDeliverables");
    if (!hasRequiredStopCondition(entry.continuationRules, "ApprovalGate")) {
      errors.push(issue("missing_approval_stop_condition", "continuationRules.allowStopWhen must mention ApprovalGate.", "continuationRules.allowStopWhen"));
    }
    if (!hasRequiredStopCondition(entry.continuationRules, "dataClassification")) {
      errors.push(issue("missing_data_classification_stop_condition", "continuationRules.allowStopWhen must mention dataClassification.", "continuationRules.allowStopWhen"));
    }
  }

  validateStringArray(errors, entry, "harnessPrinciples");
  validateNamespacedExtensions(errors, entry.extensions);
  if (isPlainObject(entry.extensions)) {
    validateDecayPreventionBacklog(errors, entry);
  }

  return { ok: errors.length === 0, errors };
}
