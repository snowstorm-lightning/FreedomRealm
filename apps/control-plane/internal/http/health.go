package http

import (
	"net/http"

	"freedomrealm/apps/control-plane/internal/platform"
)

func (s Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	platform.WriteJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": s.metadata.Service,
		"mode":    s.metadata.RunningMode,
	})
}
