package http

import (
	"encoding/json"
	nethttp "net/http"
	"net/http/httptest"
	"testing"

	"freedomrealm/apps/control-plane/internal/audit"
	"freedomrealm/apps/control-plane/internal/config"
)

func TestHealthEndpoint(t *testing.T) {
	handler := NewServer(config.Config{Mode: "Demo Mode", Version: "test"}).Handler()
	request := httptest.NewRequest(nethttp.MethodGet, "/healthz", nil)
	request.Header.Set("X-Request-ID", "health-test")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != nethttp.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}
	if got := response.Header().Get(audit.HeaderRef); got != "local-request:health-test" {
		t.Fatalf("unexpected audit ref %q", got)
	}

	var body map[string]string
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["status"] != "ok" || body["service"] != "control-plane" || body["mode"] != "Demo Mode" {
		t.Fatalf("unexpected health body: %#v", body)
	}
}

func TestMetadataEndpoint(t *testing.T) {
	handler := NewServer(config.Config{Mode: "Local Mode", Version: "test"}).Handler()
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, httptest.NewRequest(nethttp.MethodGet, "/metadata", nil))

	if response.Code != nethttp.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	var body struct {
		Service   string `json:"service"`
		MockOnly  bool   `json:"mockOnly"`
		Endpoints []struct {
			Method string `json:"method"`
			Path   string `json:"path"`
		} `json:"endpoints"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Service != "control-plane" || !body.MockOnly || len(body.Endpoints) != 8 {
		t.Fatalf("unexpected metadata body: %#v", body)
	}
}
