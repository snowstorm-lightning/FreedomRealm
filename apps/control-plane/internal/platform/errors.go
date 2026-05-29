package platform

type Problem struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

type ErrorResponse struct {
	Error Problem    `json:"error"`
	Audit *AuditRefs `json:"audit,omitempty"`
}

type FieldViolation struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}
