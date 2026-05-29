package v1

import "strings"

const (
	ActorHuman = "HumanActor"
	ActorAgent = "AgentActor"

	RiskLow      = "low"
	RiskMedium   = "medium"
	RiskHigh     = "high"
	RiskCritical = "critical"

	DataPublic     = "public"
	DataInternal   = "internal"
	DataRestricted = "restricted"
	DataSensitive  = "sensitive"
)

type ActorRef struct {
	ActorType string `json:"actorType"`
	ActorID   string `json:"actorId"`
}

type RequestMeta struct {
	RequestID         string `json:"requestId"`
	IdempotencyKey    string `json:"idempotencyKey"`
	Env               string `json:"env"`
	ActorType         string `json:"actorType"`
	ActorID           string `json:"actorId"`
	ProjectInstanceID string `json:"projectInstanceId"`
	WorkItemID        string `json:"workItemId,omitempty"`
	Reason            string `json:"reason,omitempty"`
}

type Violation struct {
	Field   string
	Message string
}

type MetaValidation struct {
	ExpectedEnv      string
	PathWorkItemID   string
	RequirePathMatch bool
}

func ValidateRequestMeta(meta RequestMeta, options MetaValidation) []Violation {
	var violations []Violation
	required := map[string]string{
		"meta.requestId":         meta.RequestID,
		"meta.idempotencyKey":    meta.IdempotencyKey,
		"meta.env":               meta.Env,
		"meta.actorType":         meta.ActorType,
		"meta.actorId":           meta.ActorID,
		"meta.projectInstanceId": meta.ProjectInstanceID,
	}
	for field, value := range required {
		if strings.TrimSpace(value) == "" {
			violations = append(violations, Violation{Field: field, Message: "field is required"})
		}
	}
	if meta.ActorType != "" && !ValidActorType(meta.ActorType) {
		violations = append(violations, Violation{Field: "meta.actorType", Message: "actorType must be HumanActor or AgentActor"})
	}
	if meta.Env != "" && options.ExpectedEnv != "" && meta.Env != options.ExpectedEnv {
		violations = append(violations, Violation{Field: "meta.env", Message: "env must match the control-plane runtime env"})
	}
	if options.RequirePathMatch && strings.TrimSpace(options.PathWorkItemID) == "" {
		violations = append(violations, Violation{Field: "workItemId", Message: "workItemId is required"})
	}
	if options.RequirePathMatch && meta.WorkItemID != "" && meta.WorkItemID != options.PathWorkItemID {
		violations = append(violations, Violation{Field: "meta.workItemId", Message: "must match path workItemId"})
	}
	return violations
}

func ValidateActor(prefix string, actor ActorRef) []Violation {
	var violations []Violation
	if actor.ActorType == "" || !ValidActorType(actor.ActorType) {
		violations = append(violations, Violation{Field: prefix + ".actorType", Message: "actorType must be HumanActor or AgentActor"})
	}
	if strings.TrimSpace(actor.ActorID) == "" {
		violations = append(violations, Violation{Field: prefix + ".actorId", Message: "field is required"})
	}
	return violations
}

func ValidateRiskReason(meta RequestMeta, riskLevel string) []Violation {
	if (riskLevel == RiskHigh || riskLevel == RiskCritical) && strings.TrimSpace(meta.Reason) == "" {
		return []Violation{{Field: "meta.reason", Message: "reason is required for high-risk work"}}
	}
	return nil
}

func ValidActorType(value string) bool {
	return value == ActorHuman || value == ActorAgent
}

func ValidRiskLevel(value string) bool {
	switch value {
	case RiskLow, RiskMedium, RiskHigh, RiskCritical:
		return true
	default:
		return false
	}
}

func ValidDataClassification(value string) bool {
	switch value {
	case DataPublic, DataInternal, DataRestricted, DataSensitive:
		return true
	default:
		return false
	}
}

func RiskLevelOrDefault(value string) string {
	if value == "" {
		return RiskLow
	}
	return value
}

func DataClassificationOrDefault(value string) string {
	if value == "" {
		return DataInternal
	}
	return value
}
