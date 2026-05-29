package instances

import (
	"net/http"

	"freedomrealm/apps/control-plane/internal/platform"
)

type Handler struct{}

func (Handler) ServeHTTP(w http.ResponseWriter, _ *http.Request) {
	platform.WriteProblem(w, http.StatusNotImplemented, "project_instance_api_disabled", "ProjectInstance writes are not enabled in this skeleton.")
}
