package approvals

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	contractsv1 "freedomrealm/apps/control-plane/internal/contracts/v1"
	"freedomrealm/apps/control-plane/internal/platform"
)

const apiVersion = "v1"

type Handler struct {
	env string
}

func NewHandler(env string) Handler {
	return Handler{env: env}
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	var request createRequest
	if !decode(w, r, &request) {
		return
	}

	violations := contractsv1.ValidateRequestMeta(request.Meta, contractsv1.MetaValidation{ExpectedEnv: h.env})
	violations = append(violations, validateCreateData(request.Meta, request.Data)...)
	if len(violations) > 0 {
		writeValidation(w, violations)
		return
	}

	approval := Approval{
		ApprovalID:         approvalID(request.Meta.ProjectInstanceID, request.Meta.WorkItemID, request.Meta.IdempotencyKey),
		WorkItemID:         request.Meta.WorkItemID,
		RiskLevel:          request.Data.RiskLevel,
		RequestedAction:    request.Data.RequestedAction,
		RequestPayloadRef:  request.Data.RequestPayloadRef,
		PolicyEvaluationID: request.Data.PolicyEvaluationID,
		RollbackRef:        request.Data.RollbackRef,
		Status:             "requested",
		MockOnly:           true,
		EventsPreview:      []EventPreview{{EventType: "approval.requested", EventVersion: 1, MockOnly: true}},
	}
	platform.WriteEnvelope(w, http.StatusCreated, approval, h.responseMeta(request.Meta.RequestID), h.auditRefs(request.Meta.RequestID, "approval.requested"))
}

func (h Handler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("approvalId")
	if strings.TrimSpace(id) == "" {
		writeValidation(w, []contractsv1.Violation{{Field: "approvalId", Message: "approvalId is required"}})
		return
	}

	approval := Approval{
		ApprovalID:         id,
		WorkItemID:         "mock-work-item",
		RiskLevel:          contractsv1.RiskHigh,
		RequestedAction:    "work_item.create",
		RequestPayloadRef:  "mock-payload-ref",
		PolicyEvaluationID: "mock-policy-ref",
		RollbackRef:        "mock-rollback-ref",
		Status:             "requested",
		MockOnly:           true,
	}
	platform.WriteEnvelope(w, http.StatusOK, approval, h.responseMeta(requestIDFromHeader(r)), h.auditRefs(requestIDFromHeader(r), "approval.read"))
}

func (h Handler) Decide(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("approvalId")
	var request decideRequest
	if !decode(w, r, &request) {
		return
	}

	violations := contractsv1.ValidateRequestMeta(request.Meta, contractsv1.MetaValidation{ExpectedEnv: h.env})
	if strings.TrimSpace(id) == "" {
		violations = append(violations, contractsv1.Violation{Field: "approvalId", Message: "approvalId is required"})
	}
	violations = append(violations, validateDecisionData(request.Data)...)
	if len(violations) > 0 {
		writeValidation(w, violations)
		return
	}

	approval := Approval{
		ApprovalID:         id,
		WorkItemID:         request.Meta.WorkItemID,
		RiskLevel:          contractsv1.RiskHigh,
		RequestedAction:    "mock.approval.decide",
		RequestPayloadRef:  "mock-payload-ref",
		PolicyEvaluationID: "mock-policy-ref",
		Status:             statusForDecision(request.Data.Decision),
		ApproverActor:      &contractsv1.ActorRef{ActorType: request.Meta.ActorType, ActorID: request.Meta.ActorID},
		Decision:           request.Data.Decision,
		DecisionReason:     request.Data.DecisionReason,
		EditedPayloadRef:   request.Data.EditedPayloadRef,
		MockOnly:           true,
		EventsPreview:      []EventPreview{{EventType: "approval.decided", EventVersion: 1, MockOnly: true}},
	}
	platform.WriteEnvelope(w, http.StatusOK, approval, h.responseMeta(request.Meta.RequestID), h.auditRefs(request.Meta.RequestID, "approval.decided"))
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

type decideRequest struct {
	Meta contractsv1.RequestMeta `json:"meta"`
	Data decisionData            `json:"data"`
}

type createData struct {
	RiskLevel          string `json:"riskLevel"`
	RequestedAction    string `json:"requestedAction"`
	RequestPayloadRef  string `json:"requestPayloadRef"`
	PolicyEvaluationID string `json:"policyEvaluationId"`
	RollbackRef        string `json:"rollbackRef"`
}

type decisionData struct {
	Decision         string `json:"decision"`
	DecisionReason   string `json:"decisionReason"`
	EditedPayloadRef string `json:"editedPayloadRef,omitempty"`
}

type Approval struct {
	ApprovalID         string                `json:"approvalId"`
	WorkItemID         string                `json:"workItemId"`
	RiskLevel          string                `json:"riskLevel"`
	RequestedAction    string                `json:"requestedAction"`
	RequestPayloadRef  string                `json:"requestPayloadRef"`
	PolicyEvaluationID string                `json:"policyEvaluationId"`
	RollbackRef        string                `json:"rollbackRef,omitempty"`
	Status             string                `json:"status"`
	ApproverActor      *contractsv1.ActorRef `json:"approverActor,omitempty"`
	Decision           string                `json:"decision,omitempty"`
	DecisionReason     string                `json:"decisionReason,omitempty"`
	EditedPayloadRef   string                `json:"editedPayloadRef,omitempty"`
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
		writeValidation(w, []contractsv1.Violation{{Field: "body", Message: "request body must match the ApprovalGate contract"}})
		return false
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeValidation(w, []contractsv1.Violation{{Field: "body", Message: "request body must contain one JSON document"}})
		return false
	}
	return true
}

func validateCreateData(meta contractsv1.RequestMeta, data createData) []contractsv1.Violation {
	var violations []contractsv1.Violation
	if strings.TrimSpace(meta.WorkItemID) == "" {
		violations = append(violations, contractsv1.Violation{Field: "meta.workItemId", Message: "field is required"})
	}
	if !contractsv1.ValidRiskLevel(data.RiskLevel) {
		violations = append(violations, contractsv1.Violation{Field: "data.riskLevel", Message: "riskLevel must be low, medium, high, or critical"})
	}
	required := map[string]string{
		"data.requestedAction":    data.RequestedAction,
		"data.requestPayloadRef":  data.RequestPayloadRef,
		"data.policyEvaluationId": data.PolicyEvaluationID,
		"data.rollbackRef":        data.RollbackRef,
	}
	for field, value := range required {
		if strings.TrimSpace(value) == "" {
			violations = append(violations, contractsv1.Violation{Field: field, Message: "field is required"})
		}
	}
	return violations
}

func validateDecisionData(data decisionData) []contractsv1.Violation {
	var violations []contractsv1.Violation
	switch data.Decision {
	case "approve", "reject", "edit_and_approve", "escalate":
	default:
		violations = append(violations, contractsv1.Violation{Field: "data.decision", Message: "decision must be approve, reject, edit_and_approve, or escalate"})
	}
	if strings.TrimSpace(data.DecisionReason) == "" {
		violations = append(violations, contractsv1.Violation{Field: "data.decisionReason", Message: "field is required"})
	}
	if data.Decision == "edit_and_approve" && strings.TrimSpace(data.EditedPayloadRef) == "" {
		violations = append(violations, contractsv1.Violation{Field: "data.editedPayloadRef", Message: "field is required for edit_and_approve"})
	}
	return violations
}

func writeValidation(w http.ResponseWriter, violations []contractsv1.Violation) {
	details := make([]platform.FieldViolation, 0, len(violations))
	for _, violation := range violations {
		details = append(details, platform.FieldViolation{Field: violation.Field, Message: violation.Message})
	}
	platform.WriteProblemDetails(w, http.StatusBadRequest, "validation_failed", "request failed ApprovalGate contract validation", details)
}

func statusForDecision(decision string) string {
	switch decision {
	case "approve", "edit_and_approve":
		return "approved"
	case "reject":
		return "rejected"
	case "escalate":
		return "escalated"
	default:
		return "requested"
	}
}

func approvalID(parts ...string) string {
	return platform.DeterministicRef("mock-approval", parts...)
}

func requestIDFromHeader(r *http.Request) string {
	if requestID := r.Header.Get("X-Request-ID"); requestID != "" {
		return requestID
	}
	return "unassigned"
}
