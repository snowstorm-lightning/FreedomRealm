package reports

import (
	"net/http"

	"freedomrealm/apps/control-plane/internal/platform"
)

type Handler struct{}

func (Handler) ServeHTTP(w http.ResponseWriter, _ *http.Request) {
	platform.WriteProblem(w, http.StatusNotImplemented, "report_card_api_disabled", "ExecutionReportCard writes are not enabled in this skeleton.")
}
