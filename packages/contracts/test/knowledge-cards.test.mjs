import test from "node:test";
import assert from "node:assert/strict";
import {
  ANSWER_CARD_SCHEMA_VERSION,
  DOC_CHALLENGE_DRAFT_SCHEMA_VERSION,
  validateAnswerCard,
  validateDocChallengeDraft
} from "../src/index.mjs";

function sourceRef() {
  return {
    sourceRefId: "source-1",
    path: "docs/zh-CN/roadmap.md",
    heading: "Phase 0.6",
    lineStart: 1,
    lineEnd: 3,
    preview: "Demo source preview.",
    digest: "sha256:demo"
  };
}

test("validates AnswerCard v1", () => {
  const card = {
    answerCardId: "answer-demo",
    schemaVersion: ANSWER_CARD_SCHEMA_VERSION,
    question: "What next?",
    answer: "Use sourced docs.",
    sourceRefs: [sourceRef(), { ...sourceRef(), sourceRefId: "source-2" }],
    confidence: "medium",
    limitations: ["mock"],
    nextActions: [{ action: "review", status: "pending" }],
    dataClassification: "internal",
    redactionStatus: "redacted",
    sharePermission: "private",
    extensions: {
      "ai-hrms.knowledge": {
        searchMode: "local-mock-semantic"
      }
    }
  };

  const result = validateAnswerCard(card);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
});

test("rejects AnswerCard without schemaVersion", () => {
  const card = {
    answerCardId: "answer-demo",
    question: "What next?",
    answer: "Use sourced docs.",
    sourceRefs: [sourceRef()],
    confidence: "medium",
    limitations: [],
    nextActions: [],
    dataClassification: "internal",
    redactionStatus: "redacted",
    sharePermission: "private",
    extensions: {}
  };

  const result = validateAnswerCard(card);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.path === "schemaVersion"), true);
});

test("rejects AnswerCard with invalid confidence or data classification", () => {
  const card = {
    answerCardId: "answer-demo",
    schemaVersion: ANSWER_CARD_SCHEMA_VERSION,
    question: "What next?",
    answer: "Use sourced docs.",
    sourceRefs: [sourceRef()],
    confidence: "certain",
    limitations: [],
    nextActions: [],
    dataClassification: "secret",
    redactionStatus: "redacted",
    sharePermission: "private",
    extensions: {}
  };

  const result = validateAnswerCard(card);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "invalid_answer_confidence"), true);
  assert.equal(result.errors.some((error) => error.code === "invalid_data_classification"), true);
});

test("validates draft DocChallengeDraft v1", () => {
  const draft = {
    challengeId: "challenge-demo",
    schemaVersion: DOC_CHALLENGE_DRAFT_SCHEMA_VERSION,
    sourceRef: sourceRef(),
    objection: "Please review this point.",
    evidenceRefs: [sourceRef()],
    proposedReviewAction: "create_follow_up_doc_review_work_item",
    status: "draft",
    humanOwnerId: "human-demo-owner",
    approvalStatus: "requires_human_review"
  };

  const result = validateDocChallengeDraft(draft);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
});

test("rejects submitted challenge with invalid approval status", () => {
  const draft = {
    challengeId: "challenge-demo",
    schemaVersion: DOC_CHALLENGE_DRAFT_SCHEMA_VERSION,
    sourceRef: sourceRef(),
    objection: "Please review this point.",
    evidenceRefs: [sourceRef()],
    proposedReviewAction: "create_follow_up_doc_review_work_item",
    status: "draft",
    humanOwnerId: "human-demo-owner",
    approvalStatus: "auto_approved"
  };

  const result = validateDocChallengeDraft(draft);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "invalid_approval_status"), true);
});
