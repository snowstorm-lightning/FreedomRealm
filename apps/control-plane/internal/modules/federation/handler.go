package federation

import (
	"net/http"

	"freedomrealm/apps/control-plane/internal/platform"
)

type Handler struct{}

func (Handler) ServeHTTP(w http.ResponseWriter, _ *http.Request) {
	platform.WriteProblem(w, http.StatusNotImplemented, "federation_gateway_disabled", "Federation gateway writes are not enabled in this skeleton.")
}
