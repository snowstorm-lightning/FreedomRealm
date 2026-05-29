package policy

import (
	"context"
	"testing"
)

func TestDeterministicKernelAllowsLowRiskMock(t *testing.T) {
	decision := DeterministicKernel{}.Evaluate(context.Background(), DecisionRequest{
		Action:             "metadata.read",
		RiskLevel:          "low",
		DataClassification: "internal",
		Environment:        "dev",
	})

	if decision.Outcome != DecisionAllowed || !decision.Allowed || decision.ApprovalRequired {
		t.Fatalf("unexpected decision: %#v", decision)
	}
}

func TestDeterministicKernelBlocksHighRiskAndRealConnectors(t *testing.T) {
	highRisk := DeterministicKernel{}.Evaluate(context.Background(), DecisionRequest{RiskLevel: "high"})
	if highRisk.Outcome != DecisionApprovalRequired || highRisk.Allowed || !highRisk.ApprovalRequired {
		t.Fatalf("unexpected high-risk decision: %#v", highRisk)
	}

	realConnector := DeterministicKernel{}.Evaluate(context.Background(), DecisionRequest{RealConnector: true})
	if realConnector.Outcome != DecisionPolicyViolation || realConnector.Allowed || realConnector.ApprovalRequired {
		t.Fatalf("unexpected connector decision: %#v", realConnector)
	}
}
