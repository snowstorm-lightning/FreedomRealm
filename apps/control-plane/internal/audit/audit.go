package audit

import "net/http"

const HeaderRef = "X-FreedomRealm-Audit-Ref"

func RefFromRequest(r *http.Request) string {
	if value := r.Header.Get("X-Request-ID"); value != "" {
		return "local-request:" + value
	}
	return "local-request:unassigned"
}
