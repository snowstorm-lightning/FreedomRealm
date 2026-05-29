package federation

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandlerDisabled(t *testing.T) {
	response := httptest.NewRecorder()

	Handler{}.ServeHTTP(response, httptest.NewRequest(http.MethodPost, "/v1/federation/messages", nil))

	if response.Code != http.StatusNotImplemented {
		t.Fatalf("expected status 501, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), "federation_gateway_disabled") {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}
