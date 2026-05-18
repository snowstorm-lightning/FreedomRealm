import {
  ANSWER_CARD_CONFIDENCES,
  ANSWER_CARD_SCHEMA_VERSION,
  APPROVAL_STATUSES,
  DATA_CLASSIFICATIONS,
  DOC_CHALLENGE_DRAFT_SCHEMA_VERSION,
  DOC_CHALLENGE_STATUSES
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

function validateRequired(errors, value, fields, rootPath = "$") {
  for (const field of fields) {
    if (!(field in value)) {
      errors.push(issue("missing_field", `${field} is required.`, rootPath === "$" ? field : `${rootPath}.${field}`));
    }
  }
}

function validateArray(errors, value, field) {
  if (!Array.isArray(value[field])) {
    errors.push(issue("validation_failed", `${field} must be an array.`, field));
  }
}

function validateObject(errors, value, field) {
  if (!isPlainObject(value[field])) {
    errors.push(issue("validation_failed", `${field} must be an object.`, field));
  }
}

function validateNamespacedExtensions(errors, extensions, path = "extensions") {
  if (!isPlainObject(extensions)) {
    return;
  }

  const namespacedKeyPattern = /^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+$/u;
  for (const key of Object.keys(extensions)) {
    if (!namespacedKeyPattern.test(key)) {
      errors.push(
        issue(
          "invalid_extension_namespace",
          "extensions keys must be namespaced and must not override standard fields.",
          `${path}.${key}`
        )
      );
    }
  }
}

function validateSourceRefs(errors, sourceRefs, path = "sourceRefs") {
  if (!Array.isArray(sourceRefs)) {
    return;
  }

  sourceRefs.forEach((sourceRef, index) => {
    const sourcePath = `${path}[${index}]`;
    if (!isPlainObject(sourceRef)) {
      errors.push(issue("validation_failed", "sourceRef must be an object.", sourcePath));
      return;
    }
    validateRequired(errors, sourceRef, ["sourceRefId", "path", "preview", "digest"], sourcePath);
    for (const field of ["sourceRefId", "path", "preview", "digest"]) {
      if (field in sourceRef && !hasText(sourceRef[field])) {
        errors.push(issue("validation_failed", `${field} must be a non-empty string.`, `${sourcePath}.${field}`));
      }
    }
    if ("lineStart" in sourceRef && !Number.isInteger(sourceRef.lineStart)) {
      errors.push(issue("validation_failed", "lineStart must be an integer.", `${sourcePath}.lineStart`));
    }
    if ("lineEnd" in sourceRef && !Number.isInteger(sourceRef.lineEnd)) {
      errors.push(issue("validation_failed", "lineEnd must be an integer.", `${sourcePath}.lineEnd`));
    }
  });
}

export function validateAnswerCard(card) {
  const errors = [];
  if (!isPlainObject(card)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "AnswerCard must be an object.")]
    };
  }

  validateRequired(errors, card, [
    "answerCardId",
    "schemaVersion",
    "question",
    "answer",
    "sourceRefs",
    "confidence",
    "limitations",
    "nextActions",
    "dataClassification",
    "redactionStatus",
    "sharePermission",
    "extensions"
  ]);

  for (const field of [
    "answerCardId",
    "schemaVersion",
    "question",
    "answer",
    "confidence",
    "dataClassification",
    "redactionStatus",
    "sharePermission"
  ]) {
    if (field in card && !hasText(card[field])) {
      errors.push(issue("validation_failed", `${field} must be a non-empty string.`, field));
    }
  }

  if (card.schemaVersion !== ANSWER_CARD_SCHEMA_VERSION) {
    errors.push(
      issue(
        "unsupported_schema_version",
        `schemaVersion must be ${ANSWER_CARD_SCHEMA_VERSION}.`,
        "schemaVersion"
      )
    );
  }
  if ("confidence" in card && !ANSWER_CARD_CONFIDENCES.includes(card.confidence)) {
    errors.push(issue("invalid_answer_confidence", "confidence is invalid.", "confidence"));
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

  validateArray(errors, card, "sourceRefs");
  validateArray(errors, card, "limitations");
  validateArray(errors, card, "nextActions");
  validateObject(errors, card, "extensions");
  validateNamespacedExtensions(errors, card.extensions);
  validateSourceRefs(errors, card.sourceRefs);

  return { ok: errors.length === 0, errors };
}

export function validateDocChallengeDraft(draft) {
  const errors = [];
  if (!isPlainObject(draft)) {
    return {
      ok: false,
      errors: [issue("validation_failed", "DocChallengeDraft must be an object.")]
    };
  }

  validateRequired(errors, draft, [
    "challengeId",
    "schemaVersion",
    "sourceRef",
    "objection",
    "evidenceRefs",
    "proposedReviewAction",
    "status",
    "humanOwnerId",
    "approvalStatus"
  ]);

  for (const field of [
    "challengeId",
    "schemaVersion",
    "objection",
    "proposedReviewAction",
    "status",
    "humanOwnerId",
    "approvalStatus"
  ]) {
    if (field in draft && !hasText(draft[field])) {
      errors.push(issue("validation_failed", `${field} must be a non-empty string.`, field));
    }
  }

  if (draft.schemaVersion !== DOC_CHALLENGE_DRAFT_SCHEMA_VERSION) {
    errors.push(
      issue(
        "unsupported_schema_version",
        `schemaVersion must be ${DOC_CHALLENGE_DRAFT_SCHEMA_VERSION}.`,
        "schemaVersion"
      )
    );
  }

  if ("status" in draft && !DOC_CHALLENGE_STATUSES.includes(draft.status)) {
    errors.push(issue("invalid_doc_challenge_status", "status is invalid.", "status"));
  }

  if ("approvalStatus" in draft && !APPROVAL_STATUSES.includes(draft.approvalStatus)) {
    errors.push(issue("invalid_approval_status", "approvalStatus is invalid.", "approvalStatus"));
  }

  if ("sourceRef" in draft && !isPlainObject(draft.sourceRef)) {
    errors.push(issue("validation_failed", "sourceRef must be an object.", "sourceRef"));
  } else if ("sourceRef" in draft) {
    validateSourceRefs(errors, [draft.sourceRef], "sourceRef");
  }

  validateArray(errors, draft, "evidenceRefs");
  validateSourceRefs(errors, draft.evidenceRefs, "evidenceRefs");

  return { ok: errors.length === 0, errors };
}
