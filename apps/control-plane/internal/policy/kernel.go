package policy

import "context"

type DecisionOutcome string

const (
	DecisionAllowed          DecisionOutcome = "allowed"
	DecisionApprovalRequired DecisionOutcome = "approval_required"
	DecisionPolicyViolation  DecisionOutcome = "policy_violation"
)

type DecisionRequest struct {
	Action             string
	RiskLevel          string
	DataClassification string
	Environment        string
	RealConnector      bool
}

type Decision struct {
	Outcome          DecisionOutcome
	Allowed          bool
	ApprovalRequired bool
	Reason           string
}

type Kernel interface {
	Evaluate(context.Context, DecisionRequest) Decision
}

type DeterministicKernel struct{}

func (DeterministicKernel) Evaluate(_ context.Context, request DecisionRequest) Decision {
	if request.RealConnector {
		return Decision{Outcome: DecisionPolicyViolation, Reason: "real external connector execution is disabled in the skeleton"}
	}
	if request.RiskLevel == "high" || request.RiskLevel == "critical" {
		return Decision{Outcome: DecisionApprovalRequired, ApprovalRequired: true, Reason: "ApprovalGate is required for high-risk actions"}
	}
	if request.DataClassification == "restricted" || request.DataClassification == "sensitive" {
		return Decision{Outcome: DecisionApprovalRequired, ApprovalRequired: true, Reason: "ApprovalGate is required for restricted or sensitive data"}
	}
	return Decision{Outcome: DecisionAllowed, Allowed: true, Reason: "allowed by deterministic skeleton policy"}
}
