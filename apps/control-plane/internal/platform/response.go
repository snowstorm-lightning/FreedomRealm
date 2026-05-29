package platform

import (
	"encoding/json"
	"net/http"
)

type ResponseMeta struct {
	RequestID string `json:"requestId"`
	Env       string `json:"env"`
	Version   string `json:"version"`
	MockOnly  bool   `json:"mockOnly"`
}

type AuditRefs struct {
	AuditEventID       string `json:"auditEventId"`
	PolicyEvaluationID string `json:"policyEvaluationId"`
	ApprovalID         string `json:"approvalId,omitempty"`
}

type ResponseEnvelope struct {
	Data  any          `json:"data"`
	Meta  ResponseMeta `json:"meta"`
	Audit AuditRefs    `json:"audit"`
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func WriteEnvelope(w http.ResponseWriter, status int, data any, meta ResponseMeta, audit AuditRefs) {
	WriteJSON(w, status, ResponseEnvelope{Data: data, Meta: meta, Audit: audit})
}

func WriteProblem(w http.ResponseWriter, status int, code string, message string) {
	WriteProblemDetails(w, status, code, message, nil)
}

func WriteProblemDetails(w http.ResponseWriter, status int, code string, message string, details any) {
	WriteProblemWithAudit(w, status, code, message, details, nil)
}

func WriteProblemWithAudit(w http.ResponseWriter, status int, code string, message string, details any, audit *AuditRefs) {
	WriteJSON(w, status, ErrorResponse{
		Error: Problem{Code: code, Message: message, Details: details},
		Audit: audit,
	})
}
