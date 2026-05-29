package platform

type EndpointMetadata struct {
	Method string `json:"method"`
	Path   string `json:"path"`
}

type ServiceMetadata struct {
	Service     string             `json:"service"`
	Version     string             `json:"version"`
	RunningMode string             `json:"runningMode"`
	MockOnly    bool               `json:"mockOnly"`
	Boundaries  []string           `json:"boundaries"`
	Endpoints   []EndpointMetadata `json:"endpoints"`
}

func DefaultServiceMetadata(mode string, version string, endpoints []EndpointMetadata) ServiceMetadata {
	return ServiceMetadata{
		Service:     "control-plane",
		Version:     version,
		RunningMode: mode,
		MockOnly:    true,
		Boundaries: []string{
			"no agent reasoning graph execution",
			"no model provider keys",
			"no real external connector execution",
			"no production data access",
			"policy kernel adapter is deterministic fake",
		},
		Endpoints: endpoints,
	}
}

func EnvFromMode(mode string) string {
	switch mode {
	case "Community Mode":
		return "community"
	case "Enterprise Mode":
		return "enterprise"
	default:
		return "local"
	}
}
