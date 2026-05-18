import {
  APPROVAL_STATUSES,
  DATA_CLASSIFICATIONS,
  EXECUTION_REPORT_CARD_REQUIRED_FIELDS,
  EXECUTION_REPORT_CARD_SCHEMA_VERSION,
  REPORT_CARD_STATUSES,
  RISK_LEVELS
} from "./index.mjs";

function issue(code, message, path = "$") {
  return { code, message, path };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateArray(errors, card, field) {
  if (!Array.isArray(card[field])) {
    errors.push(issue("validation_failed", `${field} must be an array.`, field));
  }
}

function validateObject(errors, card, field) {
  if (!isPlainObject(card[field])) {
    errors.push(issue("validation_failed", `${field} must be an object.`, field));
  }
}

function validateNamespacedExtensions(errors, extensions) {
  if (!isPlainObject(extensions)) {
    return;
  }

  const namespacedKeyPattern = /^[A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9][A-Za-z0-9-]*)+$/u;
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

export function validateExecutionReportCard(card) {
  const errors = [];

  if (!isPlainObject(card)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "ExecutionReportCard must be an object.")]
    };
  }

  for (const field of EXECUTION_REPORT_CARD_REQUIRED_FIELDS) {
    if (!(field in card)) {
      errors.push(issue("missing_report_card_field", `${field} is required.`, field));
    }
  }

  for (const field of [
    "reportCardId",
    "schemaVersion",
    "generatedAt",
    "projectInstanceId",
    "workItemId",
    "agentRunId",
    "templateId",
    "templateVersion",
    "taskGoal",
    "agentActorId",
    "humanOwnerId",
    "riskLevel",
    "approvalStatus",
    "dataClassification",
    "redactionStatus",
    "sharePermission",
    "status",
    "summary"
  ]) {
    if (field in card && !hasText(card[field])) {
      errors.push(issue("validation_failed", `${field} must be a non-empty string.`, field));
    }
  }

  if (card.schemaVersion !== EXECUTION_REPORT_CARD_SCHEMA_VERSION) {
    errors.push(
      issue(
        "unsupported_schema_version",
        `schemaVersion must be ${EXECUTION_REPORT_CARD_SCHEMA_VERSION}.`,
        "schemaVersion"
      )
    );
  }

  if ("generatedAt" in card && Number.isNaN(Date.parse(card.generatedAt))) {
    errors.push(issue("validation_failed", "generatedAt must be an ISO 8601 timestamp.", "generatedAt"));
  }

  if ("riskLevel" in card && !RISK_LEVELS.includes(card.riskLevel)) {
    errors.push(issue("invalid_risk_level", "riskLevel is invalid.", "riskLevel"));
  }

  if ("approvalStatus" in card && !APPROVAL_STATUSES.includes(card.approvalStatus)) {
    errors.push(issue("invalid_approval_status", "approvalStatus is invalid.", "approvalStatus"));
  }

  if ("dataClassification" in card && !DATA_CLASSIFICATIONS.includes(card.dataClassification)) {
    errors.push(
      issue(
        "invalid_data_classification",
        "dataClassification is invalid.",
        "dataClassification"
      )
    );
  }

  if ("status" in card && !REPORT_CARD_STATUSES.includes(card.status)) {
    errors.push(issue("invalid_report_status", "status is invalid.", "status"));
  }

  for (const field of [
    "inputRefs",
    "outputRefs",
    "skillRefs",
    "toolContractRefs",
    "auditRefs",
    "findings",
    "recommendations",
    "nextActions"
  ]) {
    validateArray(errors, card, field);
  }

  validateObject(errors, card, "metrics");

  if ("failure" in card && card.failure !== null && !isPlainObject(card.failure)) {
    errors.push(issue("validation_failed", "failure must be null or an object.", "failure"));
  }

  validateObject(errors, card, "extensions");
  validateNamespacedExtensions(errors, card.extensions);

  return { ok: errors.length === 0, errors };
}

function renderList(items, fallback = "None") {
  if (!Array.isArray(items) || items.length === 0) {
    return `- ${fallback}`;
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return `- ${item}`;
      }
      const title = item.title ?? item.id ?? item.action ?? item.path ?? "Item";
      const detail = item.detail ?? item.description ?? item.reason ?? item.status ?? "";
      return detail ? `- ${title}: ${detail}` : `- ${title}`;
    })
    .join("\n");
}

function renderFailureSampleMarkdown(failureSample) {
  if (!failureSample) {
    return "- None";
  }

  const lines = [
    `- Type: ${failureSample.failureType}`,
    `- Simulated: ${failureSample.simulated === true ? "yes" : "no"}`
  ];

  if (failureSample.statusIfTriggered) {
    lines.push(`- Status if triggered: ${failureSample.statusIfTriggered}`);
  }
  if (failureSample.expectedBlockingPoint) {
    lines.push(`- Expected blocking point: ${failureSample.expectedBlockingPoint}`);
  }
  if (failureSample.humanReviewStatus) {
    lines.push(`- Human review: ${failureSample.humanReviewStatus}`);
  }
  if (Array.isArray(failureSample.reproducibleInputRefs) && failureSample.reproducibleInputRefs.length > 0) {
    lines.push(`- Reproducible input refs: ${failureSample.reproducibleInputRefs.join(", ")}`);
  }
  if (failureSample.recovery) {
    lines.push(`- Recovery: ${failureSample.recovery}`);
  }

  return lines.join("\n");
}

export function renderExecutionReportCardMarkdown(card) {
  const validation = validateExecutionReportCard(card);
  if (!validation.ok) {
    const details = validation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
    throw new Error(`Cannot render invalid ExecutionReportCard: ${details}`);
  }

  const demo = card.extensions["ai-hrms.demo"] ?? {};
  const modelRoute = demo.modelRoute ?? {};
  const failureSample = card.failure?.sample;
  const learningArtifact = demo.learningArtifact;
  const evalSample = demo.evalSample;
  const selfReview = card.extensions["ai-hrms.selfReview"];

  return `# ExecutionReportCard

- Report: ${card.reportCardId}
- Schema: ${card.schemaVersion}
- Generated: ${card.generatedAt}
- Template: ${card.templateId}@${card.templateVersion}
- Status: ${card.status}
- Risk: ${card.riskLevel}
- Approval: ${card.approvalStatus}
- Data: ${card.dataClassification}, ${card.redactionStatus}, ${card.sharePermission}
- Model route: ${modelRoute.actual ?? "unknown"}${modelRoute.mock === true ? " (mock)" : ""}

## Task

${card.taskGoal}

## Summary

${card.summary}

## Findings

${renderList(card.findings)}

## Recommendations

${renderList(card.recommendations)}

## Next Actions

${renderList(card.nextActions)}

## Failure Path Sample

${renderFailureSampleMarkdown(failureSample)}

## Reusable Assets

${learningArtifact ? `- LearningArtifact: ${learningArtifact.learningArtifactId} (${learningArtifact.status})
- Eval sample: ${evalSample?.evalSampleId ?? "none"} (${evalSample?.status ?? "none"})` : "- None"}

## Candidate WorkItems

${selfReview?.candidateWorkItems ? renderList(selfReview.candidateWorkItems, "None") : "- None"}

## Output Refs

${renderList(card.outputRefs)}
`;
}
