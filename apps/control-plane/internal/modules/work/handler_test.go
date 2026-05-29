package work

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"freedomrealm/apps/control-plane/internal/policy"
)

type fixedKernel struct {
	decision policy.Decision
}

func (kernel fixedKernel) Evaluate(context.Context, policy.DecisionRequest) policy.Decision {
	return kernel.decision
}

func TestCreateWorkItem(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/work-items", strings.NewReader(`{
		"meta": {
			"requestId": "req-1",
			"idempotencyKey": "idem-1",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1"
		},
		"data": {
			"title": "Draft interface contract",
			"requestedBy": {"actorType": "HumanActor", "actorId": "human-1"},
			"assignedActor": {"actorType": "AgentActor", "actorId": "agent-1"},
			"riskLevel": "low"
		}
	}`))

	NewHandler(policy.DeterministicKernel{}, "local").Create(response, request)

	if response.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", response.Code, response.Body.String())
	}

	var body struct {
		Data struct {
			WorkItemID    string `json:"workItemId"`
			Status        string `json:"status"`
			MockOnly      bool   `json:"mockOnly"`
			EventsPreview []struct {
				EventType string `json:"eventType"`
			} `json:"eventsPreview"`
		} `json:"data"`
		Meta struct {
			RequestID string `json:"requestId"`
			Env       string `json:"env"`
			MockOnly  bool   `json:"mockOnly"`
		} `json:"meta"`
		Audit struct {
			AuditEventID string `json:"auditEventId"`
		} `json:"audit"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Data.WorkItemID == "" || body.Data.Status != "open" || !body.Data.MockOnly {
		t.Fatalf("unexpected data: %#v", body.Data)
	}
	if body.Meta.RequestID != "req-1" || body.Meta.Env != "local" || !body.Meta.MockOnly {
		t.Fatalf("unexpected meta: %#v", body.Meta)
	}
	if body.Audit.AuditEventID == "" || len(body.Data.EventsPreview) != 1 || body.Data.EventsPreview[0].EventType != "task.created" {
		t.Fatalf("unexpected audit/events: %#v %#v", body.Audit, body.Data.EventsPreview)
	}
}

func TestCreateWorkItemMockIDUsesIdempotencyKey(t *testing.T) {
	first := httptest.NewRecorder()
	second := httptest.NewRecorder()
	body := func(requestID string) string {
		return `{
			"meta": {
				"requestId": "` + requestID + `",
				"idempotencyKey": "same-idem",
				"env": "local",
				"actorType": "HumanActor",
				"actorId": "human-1",
				"projectInstanceId": "instance-1"
			},
			"data": {
				"title": "Stable mock id",
				"requestedBy": {"actorType": "HumanActor", "actorId": "human-1"},
				"riskLevel": "low"
			}
		}`
	}
	handler := NewHandler(policy.DeterministicKernel{}, "local")

	handler.Create(first, httptest.NewRequest(http.MethodPost, "/api/v1/work-items", strings.NewReader(body("req-1"))))
	handler.Create(second, httptest.NewRequest(http.MethodPost, "/api/v1/work-items", strings.NewReader(body("req-2"))))

	var firstBody struct {
		Data struct {
			WorkItemID string `json:"workItemId"`
		} `json:"data"`
	}
	var secondBody struct {
		Data struct {
			WorkItemID string `json:"workItemId"`
		} `json:"data"`
	}
	if err := json.Unmarshal(first.Body.Bytes(), &firstBody); err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(second.Body.Bytes(), &secondBody); err != nil {
		t.Fatal(err)
	}
	if firstBody.Data.WorkItemID == "" || firstBody.Data.WorkItemID != secondBody.Data.WorkItemID {
		t.Fatalf("expected stable mock id, got %q and %q", firstBody.Data.WorkItemID, secondBody.Data.WorkItemID)
	}
}

func TestCreateWorkItemValidation(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/work-items", strings.NewReader(`{
		"meta": {
			"requestId": "req-2",
			"idempotencyKey": "idem-2",
			"env": "staging",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1"
		},
		"data": {
			"title": "",
			"requestedBy": {"actorType": "HumanActor", "actorId": "human-1"},
			"riskLevel": "unknown"
		}
	}`))

	NewHandler(policy.DeterministicKernel{}, "local").Create(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), "validation_failed") || !strings.Contains(response.Body.String(), "meta.env") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestCreateWorkItemPolicyViolation(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/work-items", strings.NewReader(`{
		"meta": {
			"requestId": "req-policy",
			"idempotencyKey": "idem-policy",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1"
		},
		"data": {
			"title": "Blocked work",
			"requestedBy": {"actorType": "HumanActor", "actorId": "human-1"},
			"riskLevel": "low"
		}
	}`))
	handler := NewHandler(fixedKernel{decision: policy.Decision{
		Outcome: policy.DecisionPolicyViolation,
		Reason:  "blocked by test policy",
	}}, "local")

	handler.Create(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), "policy_violation") || strings.Contains(response.Body.String(), "approval_required") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestCreateWorkItemApprovalRequired(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/work-items", strings.NewReader(`{
		"meta": {
			"requestId": "req-3",
			"idempotencyKey": "idem-3",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1",
			"reason": "needs human approval"
		},
		"data": {
			"title": "High risk work",
			"requestedBy": {"actorType": "HumanActor", "actorId": "human-1"},
			"riskLevel": "high"
		}
	}`))

	NewHandler(policy.DeterministicKernel{}, "local").Create(response, request)

	if response.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), "approval_required") || !strings.Contains(response.Body.String(), "approval.requested") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestGetWorkItem(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/work-items/mock-1", nil)
	request.SetPathValue("workItemId", "mock-1")
	request.Header.Set("X-Request-ID", "read-1")

	NewHandler(policy.DeterministicKernel{}, "local").Get(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), `"workItemId":"mock-1"`) || !strings.Contains(response.Body.String(), `"requestId":"read-1"`) {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestTransitionWorkItem(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/work-items/mock-1/transition", strings.NewReader(`{
		"meta": {
			"requestId": "req-4",
			"idempotencyKey": "idem-4",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1",
			"workItemId": "mock-1"
		},
		"data": {"transition": "start"}
	}`))
	request.SetPathValue("workItemId", "mock-1")

	NewHandler(policy.DeterministicKernel{}, "local").Transition(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}
	if !strings.Contains(response.Body.String(), `"status":"in_progress"`) || strings.Contains(response.Body.String(), "task.transitioned") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestTransitionWorkItemPathMismatch(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/work-items/mock-1/transition", strings.NewReader(`{
		"meta": {
			"requestId": "req-5",
			"idempotencyKey": "idem-5",
			"env": "local",
			"actorType": "HumanActor",
			"actorId": "human-1",
			"projectInstanceId": "instance-1",
			"workItemId": "mock-2"
		},
		"data": {"transition": "complete"}
	}`))
	request.SetPathValue("workItemId", "mock-1")

	NewHandler(policy.DeterministicKernel{}, "local").Transition(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), "meta.workItemId") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}
