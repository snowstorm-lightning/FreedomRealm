package v1

import "testing"

func TestValidateRequestMeta(t *testing.T) {
	violations := ValidateRequestMeta(RequestMeta{
		RequestID:         "req-1",
		IdempotencyKey:    "idem-1",
		Env:               "local",
		ActorType:         ActorHuman,
		ActorID:           "human-1",
		ProjectInstanceID: "instance-1",
		WorkItemID:        "work-1",
	}, MetaValidation{ExpectedEnv: "local", PathWorkItemID: "work-1", RequirePathMatch: true})

	if len(violations) != 0 {
		t.Fatalf("unexpected violations: %#v", violations)
	}
}

func TestValidateRequestMetaRejectsEnvAndPathMismatch(t *testing.T) {
	violations := ValidateRequestMeta(RequestMeta{
		RequestID:         "req-1",
		IdempotencyKey:    "idem-1",
		Env:               "staging",
		ActorType:         ActorAgent,
		ActorID:           "agent-1",
		ProjectInstanceID: "instance-1",
		WorkItemID:        "work-2",
	}, MetaValidation{ExpectedEnv: "local", PathWorkItemID: "work-1", RequirePathMatch: true})

	if len(violations) != 2 {
		t.Fatalf("expected two violations, got %#v", violations)
	}
}
