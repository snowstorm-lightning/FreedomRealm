package platform

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWriteProblem(t *testing.T) {
	response := httptest.NewRecorder()

	WriteProblem(response, http.StatusForbidden, "blocked", "blocked by policy")

	if response.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", response.Code)
	}

	var body ErrorResponse
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Error.Code != "blocked" || body.Error.Message != "blocked by policy" {
		t.Fatalf("unexpected problem: %#v", body)
	}
}
