package approvals

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCreateApproval(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/approvals", strings.NewReader(`{
		"meta": {
			"requestId": "req-approval",
			"idempotencyKey": "idem-approval",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1",
			"workItemId": "work-1"
		},
		"data": {
			"riskLevel": "high",
			"requestedAction": "work_item.create",
			"requestPayloadRef": "payload-ref",
			"policyEvaluationId": "policy-ref",
			"rollbackRef": "rollback-ref"
		}
	}`))

	NewHandler("local").Create(response, request)

	if response.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", response.Code, response.Body.String())
	}

	var body struct {
		Data struct {
			ApprovalID    string `json:"approvalId"`
			Status        string `json:"status"`
			MockOnly      bool   `json:"mockOnly"`
			EventsPreview []struct {
				EventType string `json:"eventType"`
			} `json:"eventsPreview"`
		} `json:"data"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Data.ApprovalID == "" || body.Data.Status != "requested" || !body.Data.MockOnly {
		t.Fatalf("unexpected data: %#v", body.Data)
	}
	if len(body.Data.EventsPreview) != 1 || body.Data.EventsPreview[0].EventType != "approval.requested" {
		t.Fatalf("unexpected events: %#v", body.Data.EventsPreview)
	}
}

func TestCreateApprovalValidation(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/approvals", strings.NewReader(`{
		"meta": {
			"requestId": "req-approval",
			"idempotencyKey": "idem-approval",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1"
		},
		"data": {
			"riskLevel": "unknown",
			"requestedAction": "",
			"requestPayloadRef": "payload-ref",
			"policyEvaluationId": "policy-ref",
			"rollbackRef": "rollback-ref"
		}
	}`))

	NewHandler("local").Create(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), "meta.workItemId") || !strings.Contains(response.Body.String(), "data.riskLevel") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestGetApproval(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/approvals/mock-approval", nil)
	request.SetPathValue("approvalId", "mock-approval")
	request.Header.Set("X-Request-ID", "read-approval")

	NewHandler("local").Get(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), `"approvalId":"mock-approval"`) || !strings.Contains(response.Body.String(), `"requestId":"read-approval"`) {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestDecideApproval(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/approvals/mock-approval/decide", strings.NewReader(`{
		"meta": {
			"requestId": "req-decide",
			"idempotencyKey": "idem-decide",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1",
			"workItemId": "work-1"
		},
		"data": {
			"decision": "edit_and_approve",
			"decisionReason": "approved after redaction",
			"editedPayloadRef": "edited-payload-ref"
		}
	}`))
	request.SetPathValue("approvalId", "mock-approval")

	NewHandler("local").Decide(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}
	if !strings.Contains(response.Body.String(), `"status":"approved"`) || !strings.Contains(response.Body.String(), "approval.decided") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestDecideApprovalValidation(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/approvals/mock-approval/decide", strings.NewReader(`{
		"meta": {
			"requestId": "req-decide",
			"idempotencyKey": "idem-decide",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1",
			"workItemId": "work-1"
		},
		"data": {
			"decision": "edit_and_approve",
			"decisionReason": "needs edit"
		}
	}`))
	request.SetPathValue("approvalId", "mock-approval")

	NewHandler("local").Decide(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), "data.editedPayloadRef") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}
