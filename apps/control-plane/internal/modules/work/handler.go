package work

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	contractsv1 "freedomrealm/apps/control-plane/internal/contracts/v1"
	"freedomrealm/apps/control-plane/internal/platform"
	"freedomrealm/apps/control-plane/internal/policy"
)

const apiVersion = "v1"

type Handler struct {
	kernel policy.Kernel
	env    string
}

func NewHandler(kernel policy.Kernel, env string) Handler {
	return Handler{kernel: kernel, env: env}
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	var request createRequest
	if !decode(w, r, &request) {
		return
	}

	violations := contractsv1.ValidateRequestMeta(request.Meta, contractsv1.MetaValidation{ExpectedEnv: h.env})
	violations = append(violations, validateCreateData(request.Data)...)
	violations = append(violations, contractsv1.ValidateRiskReason(request.Meta, request.Data.RiskLevel)...)
	if len(violations) > 0 {
		writeValidation(w, violations)
		return
	}

	decision := h.evaluate(r.Context(), "work_item.create", request.Data.RiskLevel, contractsv1.DataClassificationOrDefault(request.Data.DataClassification))
	audit := h.auditRefs(request.Meta.RequestID, "work_item.create")
	if !decision.Allowed {
		writeDecisionProblem(w, decision, audit)
		return
	}

	item := WorkItem{
		WorkItemID:         mockID(request.Meta.ProjectInstanceID, request.Meta.IdempotencyKey, request.Data.Title),
		Title:              request.Data.Title,
		RequestedBy:        request.Data.RequestedBy,
		AssignedActor:      request.Data.AssignedActor,
		RiskLevel:          request.Data.RiskLevel,
		DataClassification: contractsv1.DataClassificationOrDefault(request.Data.DataClassification),
		Status:             "open",
		SLA:                request.Data.SLA,
		ApprovalPolicyID:   request.Data.ApprovalPolicyID,
		MockOnly:           true,
		EventsPreview:      []EventPreview{{EventType: "task.created", EventVersion: 1, MockOnly: true}},
	}
	platform.WriteEnvelope(w, http.StatusCreated, item, h.responseMeta(request.Meta.RequestID), audit)
}

func (h Handler) Get(w http.ResponseWriter, r *http.Request) {
	workItemID := r.PathValue("workItemId")
	if strings.TrimSpace(workItemID) == "" {
		writeValidation(w, []contractsv1.Violation{{Field: "workItemId", Message: "workItemId is required"}})
		return
	}

	item := WorkItem{
		WorkItemID:         workItemID,
		Title:              "Mock WorkItem " + workItemID,
		RequestedBy:        contractsv1.ActorRef{ActorType: contractsv1.ActorHuman, ActorID: "mock-human-owner"},
		RiskLevel:          "low",
		DataClassification: "internal",
		Status:             "open",
		MockOnly:           true,
	}
	platform.WriteEnvelope(w, http.StatusOK, item, h.responseMeta(requestIDFromHeader(r)), h.auditRefs(requestIDFromHeader(r), "work_item.read"))
}

func (h Handler) Transition(w http.ResponseWriter, r *http.Request) {
	workItemID := r.PathValue("workItemId")
	var request transitionRequest
	if !decode(w, r, &request) {
		return
	}

	violations := contractsv1.ValidateRequestMeta(request.Meta, contractsv1.MetaValidation{
		ExpectedEnv:      h.env,
		PathWorkItemID:   workItemID,
		RequirePathMatch: true,
	})
	violations = append(violations, validateTransitionData(request.Data)...)
	violations = append(violations, contractsv1.ValidateRiskReason(request.Meta, request.Data.RiskLevel)...)
	if len(violations) > 0 {
		writeValidation(w, violations)
		return
	}

	riskLevel := contractsv1.RiskLevelOrDefault(request.Data.RiskLevel)
	dataClassification := contractsv1.DataClassificationOrDefault(request.Data.DataClassification)
	decision := h.evaluate(r.Context(), "work_item.transition", riskLevel, dataClassification)
	audit := h.auditRefs(request.Meta.RequestID, "work_item.transition")
	if !decision.Allowed {
		writeDecisionProblem(w, decision, audit)
		return
	}

	item := WorkItem{
		WorkItemID:         workItemID,
		Title:              "Mock WorkItem " + workItemID,
		RequestedBy:        contractsv1.ActorRef{ActorType: request.Meta.ActorType, ActorID: request.Meta.ActorID},
		RiskLevel:          riskLevel,
		DataClassification: dataClassification,
		Status:             statusForTransition(request.Data.Transition),
		MockOnly:           true,
	}
	platform.WriteEnvelope(w, http.StatusOK, item, h.responseMeta(request.Meta.RequestID), audit)
}

func (h Handler) evaluate(ctx context.Context, action string, riskLevel string, dataClassification string) policy.Decision {
	return h.kernel.Evaluate(ctx, policy.DecisionRequest{
		Action:             action,
		RiskLevel:          riskLevel,
		DataClassification: dataClassification,
		Environment:        h.env,
	})
}

func (h Handler) responseMeta(requestID string) platform.ResponseMeta {
	return platform.ResponseMeta{RequestID: requestID, Env: h.env, Version: apiVersion, MockOnly: true}
}

func (h Handler) auditRefs(requestID string, action string) platform.AuditRefs {
	return platform.AuditRefs{
		AuditEventID:       platform.DeterministicRef("mock-audit", requestID, action),
		PolicyEvaluationID: platform.DeterministicRef("mock-policy", action, requestID),
	}
}

type createRequest struct {
	Meta contractsv1.RequestMeta `json:"meta"`
	Data createData              `json:"data"`
}

type transitionRequest struct {
	Meta contractsv1.RequestMeta `json:"meta"`
	Data transitionData          `json:"data"`
}

type createData struct {
	Title              string                `json:"title"`
	RequestedBy        contractsv1.ActorRef  `json:"requestedBy"`
	AssignedActor      *contractsv1.ActorRef `json:"assignedActor,omitempty"`
	RiskLevel          string                `json:"riskLevel"`
	DataClassification string                `json:"dataClassification,omitempty"`
	SLA                string                `json:"sla,omitempty"`
	ApprovalPolicyID   string                `json:"approvalPolicyId,omitempty"`
}

type transitionData struct {
	Transition         string `json:"transition"`
	Reason             string `json:"reason,omitempty"`
	RiskLevel          string `json:"riskLevel,omitempty"`
	DataClassification string `json:"dataClassification,omitempty"`
}

type WorkItem struct {
	WorkItemID         string                `json:"workItemId"`
	Title              string                `json:"title"`
	RequestedBy        contractsv1.ActorRef  `json:"requestedBy"`
	AssignedActor      *contractsv1.ActorRef `json:"assignedActor,omitempty"`
	RiskLevel          string                `json:"riskLevel"`
	DataClassification string                `json:"dataClassification"`
	Status             string                `json:"status"`
	SLA                string                `json:"sla,omitempty"`
	ApprovalPolicyID   string                `json:"approvalPolicyId,omitempty"`
	MockOnly           bool                  `json:"mockOnly"`
	EventsPreview      []EventPreview        `json:"eventsPreview,omitempty"`
}

type EventPreview struct {
	EventType    string `json:"eventType"`
	EventVersion int    `json:"eventVersion"`
	MockOnly     bool   `json:"mockOnly"`
}

func decode(w http.ResponseWriter, r *http.Request, target any) bool {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeValidation(w, []contractsv1.Violation{{Field: "body", Message: "request body must match the WorkItem contract"}})
		return false
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeValidation(w, []contractsv1.Violation{{Field: "body", Message: "request body must contain one JSON document"}})
		return false
	}
	return true
}

func validateCreateData(data createData) []contractsv1.Violation {
	var violations []contractsv1.Violation
	if strings.TrimSpace(data.Title) == "" {
		violations = append(violations, contractsv1.Violation{Field: "data.title", Message: "field is required"})
	}
	violations = append(violations, contractsv1.ValidateActor("data.requestedBy", data.RequestedBy)...)
	if data.AssignedActor != nil {
		violations = append(violations, contractsv1.ValidateActor("data.assignedActor", *data.AssignedActor)...)
	}
	if !contractsv1.ValidRiskLevel(data.RiskLevel) {
		violations = append(violations, contractsv1.Violation{Field: "data.riskLevel", Message: "riskLevel must be low, medium, high, or critical"})
	}
	if data.DataClassification != "" && !contractsv1.ValidDataClassification(data.DataClassification) {
		violations = append(violations, contractsv1.Violation{Field: "data.dataClassification", Message: "dataClassification must be public, internal, restricted, or sensitive"})
	}
	return violations
}

func validateTransitionData(data transitionData) []contractsv1.Violation {
	var violations []contractsv1.Violation
	switch data.Transition {
	case "start", "block", "complete":
	default:
		violations = append(violations, contractsv1.Violation{Field: "data.transition", Message: "transition must be start, block, or complete"})
	}
	if data.Transition == "block" && strings.TrimSpace(data.Reason) == "" {
		violations = append(violations, contractsv1.Violation{Field: "data.reason", Message: "reason is required when blocking work"})
	}
	if data.RiskLevel != "" && !contractsv1.ValidRiskLevel(data.RiskLevel) {
		violations = append(violations, contractsv1.Violation{Field: "data.riskLevel", Message: "riskLevel must be low, medium, high, or critical"})
	}
	if data.DataClassification != "" && !contractsv1.ValidDataClassification(data.DataClassification) {
		violations = append(violations, contractsv1.Violation{Field: "data.dataClassification", Message: "dataClassification must be public, internal, restricted, or sensitive"})
	}
	return violations
}

func writeValidation(w http.ResponseWriter, violations []contractsv1.Violation) {
	details := make([]platform.FieldViolation, 0, len(violations))
	for _, violation := range violations {
		details = append(details, platform.FieldViolation{Field: violation.Field, Message: violation.Message})
	}
	platform.WriteProblemDetails(w, http.StatusBadRequest, "validation_failed", "request failed WorkItem contract validation", details)
}

func writeDecisionProblem(w http.ResponseWriter, decision policy.Decision, audit platform.AuditRefs) {
	if decision.Outcome == policy.DecisionPolicyViolation {
		platform.WriteProblemWithAudit(w, http.StatusForbidden, "policy_violation", "WorkItem request is blocked by policy.", map[string]any{"reason": decision.Reason}, &audit)
		return
	}
	details := map[string]any{
		"approvalGateRequired": true,
		"reason":               decision.Reason,
		"eventsPreview":        []EventPreview{{EventType: "approval.requested", EventVersion: 1, MockOnly: true}},
	}
	platform.WriteProblemWithAudit(w, http.StatusConflict, "approval_required", "ApprovalGate is required before creating or changing a production WorkItem fact.", details, &audit)
}

func statusForTransition(transition string) string {
	switch transition {
	case "start":
		return "in_progress"
	case "block":
		return "blocked"
	case "complete":
		return "completed"
	default:
		return "open"
	}
}

func requestIDFromHeader(r *http.Request) string {
	if requestID := r.Header.Get("X-Request-ID"); requestID != "" {
		return requestID
	}
	return "unassigned"
}

func mockID(parts ...string) string {
	return platform.DeterministicRef("mock-work-item", parts...)
}
