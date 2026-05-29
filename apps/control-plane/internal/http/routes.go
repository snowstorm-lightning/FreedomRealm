package http

import (
	"net/http"

	"freedomrealm/apps/control-plane/internal/platform"
)

type route struct {
	Method  string
	Path    string
	Handler http.HandlerFunc
}

func (r route) Pattern() string {
	return r.Method + " " + r.Path
}

func endpointMetadata(routes []route) []platform.EndpointMetadata {
	endpoints := make([]platform.EndpointMetadata, 0, len(routes))
	for _, route := range routes {
		endpoints = append(endpoints, platform.EndpointMetadata{Method: route.Method, Path: route.Path})
	}
	return endpoints
}
