package platform

import "testing"

func TestDefaultServiceMetadata(t *testing.T) {
	metadata := DefaultServiceMetadata("Tiny Mode", "test", []EndpointMetadata{{Method: "GET", Path: "/healthz"}})

	if metadata.Service != "control-plane" || metadata.RunningMode != "Tiny Mode" || !metadata.MockOnly {
		t.Fatalf("unexpected metadata: %#v", metadata)
	}
	if len(metadata.Endpoints) != 1 {
		t.Fatalf("expected 1 endpoint, got %d", len(metadata.Endpoints))
	}
	if len(metadata.Boundaries) == 0 {
		t.Fatal("expected explicit boundaries")
	}
}
