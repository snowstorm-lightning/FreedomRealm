package http

import (
	"net/http"

	"freedomrealm/apps/control-plane/internal/audit"
	"freedomrealm/apps/control-plane/internal/config"
	"freedomrealm/apps/control-plane/internal/modules/approvals"
	"freedomrealm/apps/control-plane/internal/modules/work"
	"freedomrealm/apps/control-plane/internal/platform"
	"freedomrealm/apps/control-plane/internal/policy"
)

type Server struct {
	metadata  platform.ServiceMetadata
	approvals approvals.Handler
	work      work.Handler
}

func NewServer(cfg config.Config) Server {
	runtimeEnv := platform.EnvFromMode(cfg.Mode)
	server := Server{
		approvals: approvals.NewHandler(runtimeEnv),
		work:      work.NewHandler(policy.DeterministicKernel{}, runtimeEnv),
	}
	server.metadata = platform.DefaultServiceMetadata(cfg.Mode, cfg.Version, endpointMetadata(server.routes()))
	return server
}

func (s Server) Handler() http.Handler {
	mux := http.NewServeMux()
	for _, route := range s.routes() {
		mux.HandleFunc(route.Pattern(), route.Handler)
	}
	return s.withAuditRef(mux)
}

func (s Server) routes() []route {
	return []route{
		{Method: "GET", Path: "/healthz", Handler: s.handleHealth},
		{Method: "GET", Path: "/metadata", Handler: s.handleMetadata},
		{Method: "POST", Path: "/api/v1/work-items", Handler: s.work.Create},
		{Method: "GET", Path: "/api/v1/work-items/{workItemId}", Handler: s.work.Get},
		{Method: "POST", Path: "/api/v1/work-items/{workItemId}/transition", Handler: s.work.Transition},
		{Method: "POST", Path: "/api/v1/approvals", Handler: s.approvals.Create},
		{Method: "GET", Path: "/api/v1/approvals/{approvalId}", Handler: s.approvals.Get},
		{Method: "POST", Path: "/api/v1/approvals/{approvalId}/decide", Handler: s.approvals.Decide},
	}
}

func (s Server) handleMetadata(w http.ResponseWriter, _ *http.Request) {
	platform.WriteJSON(w, http.StatusOK, s.metadata)
}

func (s Server) withAuditRef(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(audit.HeaderRef, audit.RefFromRequest(r))
		next.ServeHTTP(w, r)
	})
}
