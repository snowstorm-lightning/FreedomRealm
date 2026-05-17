#![forbid(unsafe_code)]

pub const POLICY_VERSION: &str = "policy-kernel-rs.v0";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Environment {
    Dev,
    Ci,
    Staging,
    Prod,
}

impl Environment {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Dev => "dev",
            Self::Ci => "ci",
            Self::Staging => "staging",
            Self::Prod => "prod",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActorType {
    HumanActor,
    AgentActor,
    ServiceAccount,
    ExternalConnector,
    GovernanceBrain,
}

impl ActorType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::HumanActor => "HumanActor",
            Self::AgentActor => "AgentActor",
            Self::ServiceAccount => "ServiceAccount",
            Self::ExternalConnector => "ExternalConnector",
            Self::GovernanceBrain => "GovernanceBrain",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

impl RiskLevel {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Low => "low",
            Self::Medium => "medium",
            Self::High => "high",
            Self::Critical => "critical",
        }
    }

    pub fn requires_approval_gate(self) -> bool {
        matches!(self, Self::High | Self::Critical)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum DataClassification {
    Public,
    Internal,
    Restricted,
    Sensitive,
}

impl DataClassification {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Public => "public",
            Self::Internal => "internal",
            Self::Restricted => "restricted",
            Self::Sensitive => "sensitive",
        }
    }

    pub fn requires_default_approval_gate(self) -> bool {
        matches!(self, Self::Sensitive)
    }

    pub fn is_external_model_sensitive(self) -> bool {
        matches!(self, Self::Restricted | Self::Sensitive)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DataBoundary {
    Local,
    ExternalModelOrConnector,
    Federation,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PolicyDecision {
    Allow,
    Deny,
    RequireApproval,
    Escalate,
}

impl PolicyDecision {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Allow => "allow",
            Self::Deny => "deny",
            Self::RequireApproval => "require_approval",
            Self::Escalate => "escalate",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApprovalDecision {
    Approve,
    Reject,
    EditAndApprove,
    Escalate,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ApprovalRef {
    pub approval_id: String,
    pub policy_evaluation_id: String,
    pub approver_actor_id: String,
    pub decision: ApprovalDecision,
    pub decision_reason: String,
    pub rollback_ref: String,
}

impl ApprovalRef {
    pub fn is_complete(&self) -> bool {
        has_text(&self.approval_id)
            && has_text(&self.policy_evaluation_id)
            && has_text(&self.approver_actor_id)
            && has_text(&self.decision_reason)
            && has_text(&self.rollback_ref)
    }

    pub fn is_positive(&self) -> bool {
        matches!(
            self.decision,
            ApprovalDecision::Approve | ApprovalDecision::EditAndApprove
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OperationContract {
    pub operation_name: String,
    pub risk_level: RiskLevel,
    pub allowed_actor_types: Vec<ActorType>,
    pub allowed_environments: Vec<Environment>,
    pub data_classification_allowed: Vec<DataClassification>,
    pub data_boundary: DataBoundary,
    pub auto_execute: bool,
    pub audit_tags: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExecutionContext {
    pub env: Environment,
    pub actor_type: ActorType,
    pub data_classification: DataClassification,
    pub approval: Option<ApprovalRef>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PolicyIssueCode {
    ValidationFailed,
    Forbidden,
    PolicyViolation,
    ApprovalRequired,
    InvalidApproval,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PolicyIssue {
    pub code: PolicyIssueCode,
    pub path: String,
    pub message: String,
}

impl PolicyIssue {
    pub fn new(code: PolicyIssueCode, path: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code,
            path: path.into(),
            message: message.into(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MatchedRule {
    pub rule_id: &'static str,
    pub decision: PolicyDecision,
    pub message: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PolicyEvaluation {
    pub policy_version: &'static str,
    pub decision: PolicyDecision,
    pub risk_level: RiskLevel,
    pub reason: String,
    pub matched_rules: Vec<MatchedRule>,
    pub issues: Vec<PolicyIssue>,
    pub audit_tags: Vec<String>,
}

impl PolicyEvaluation {
    fn with_decision(
        decision: PolicyDecision,
        risk_level: RiskLevel,
        reason: impl Into<String>,
        audit_tags: Vec<String>,
    ) -> Self {
        Self {
            policy_version: POLICY_VERSION,
            decision,
            risk_level,
            reason: reason.into(),
            matched_rules: Vec::new(),
            issues: Vec::new(),
            audit_tags,
        }
    }

    fn add_rule(
        &mut self,
        rule_id: &'static str,
        decision: PolicyDecision,
        message: &'static str,
    ) {
        self.matched_rules.push(MatchedRule {
            rule_id,
            decision,
            message,
        });
    }

    fn add_approval_gate_tag(&mut self) {
        push_unique(&mut self.audit_tags, "ApprovalGate");
    }
}

pub fn evaluate_operation(
    contract: &OperationContract,
    context: &ExecutionContext,
) -> PolicyEvaluation {
    let audit_tags = normalized_audit_tags(&contract.audit_tags);

    let contract_issues = validate_contract(contract);
    if !contract_issues.is_empty() {
        let mut evaluation = PolicyEvaluation::with_decision(
            PolicyDecision::Deny,
            contract.risk_level,
            "invalid_operation_contract",
            audit_tags,
        );
        evaluation.issues = contract_issues;
        evaluation.add_rule(
            "contract.validation",
            PolicyDecision::Deny,
            "OperationContract must declare explicit governance boundaries.",
        );
        return evaluation;
    }

    if !contract.allowed_environments.contains(&context.env) {
        return deny(
            contract,
            audit_tags,
            "environment_not_allowed",
            "context.env",
            format!(
                "Operation {} is not allowed in {}.",
                contract.operation_name,
                context.env.as_str()
            ),
            "contract.allowed_environments",
        );
    }

    if !contract.allowed_actor_types.contains(&context.actor_type) {
        return deny(
            contract,
            audit_tags,
            "actor_type_not_allowed",
            "context.actor_type",
            format!(
                "Actor type {} is not allowed for {}.",
                context.actor_type.as_str(),
                contract.operation_name
            ),
            "contract.allowed_actor_types",
        );
    }

    if !contract
        .data_classification_allowed
        .contains(&context.data_classification)
    {
        return deny(
            contract,
            audit_tags,
            "data_classification_not_allowed",
            "context.data_classification",
            format!(
                "Operation {} is not allowed to handle {} data.",
                contract.operation_name,
                context.data_classification.as_str()
            ),
            "contract.data_classification_allowed",
        );
    }

    if let Some(approval) = &context.approval {
        if !approval.is_complete() {
            return deny(
                contract,
                audit_tags,
                "invalid_approval_ref",
                "context.approval",
                "ApprovalGate evidence must include approval, policy evaluation, approver, reason, and rollback references.",
                "approval.ref_complete",
            );
        }

        match approval.decision {
            ApprovalDecision::Reject => {
                return deny(
                    contract,
                    audit_tags,
                    "approval_rejected",
                    "context.approval.decision",
                    "ApprovalGate rejected this operation.",
                    "approval.decision",
                );
            }
            ApprovalDecision::Escalate => {
                let mut evaluation = PolicyEvaluation::with_decision(
                    PolicyDecision::Escalate,
                    contract.risk_level,
                    "approval_escalated",
                    audit_tags,
                );
                evaluation.add_rule(
                    "approval.decision",
                    PolicyDecision::Escalate,
                    "ApprovalGate escalated this operation.",
                );
                evaluation.add_approval_gate_tag();
                return evaluation;
            }
            ApprovalDecision::Approve | ApprovalDecision::EditAndApprove => {}
        }
    }

    if let Some(rule) = first_approval_required_rule(contract, context) {
        let has_positive_approval = context
            .approval
            .as_ref()
            .is_some_and(ApprovalRef::is_positive);

        if !has_positive_approval {
            let mut evaluation = PolicyEvaluation::with_decision(
                PolicyDecision::RequireApproval,
                contract.risk_level,
                rule.reason,
                audit_tags,
            );
            evaluation.issues.push(PolicyIssue::new(
                PolicyIssueCode::ApprovalRequired,
                rule.path,
                rule.message,
            ));
            evaluation.add_rule(rule.rule_id, PolicyDecision::RequireApproval, rule.message);
            evaluation.add_approval_gate_tag();
            return evaluation;
        }
    }

    let mut evaluation = PolicyEvaluation::with_decision(
        PolicyDecision::Allow,
        contract.risk_level,
        "policy_allowed",
        audit_tags,
    );
    evaluation.add_rule(
        "policy.allowed",
        PolicyDecision::Allow,
        "Operation is within contract, data, actor, environment, and approval boundaries.",
    );
    evaluation
}

pub fn evaluate_data_classification_transition(
    source: DataClassification,
    current: DataClassification,
    approval: Option<&ApprovalRef>,
) -> PolicyEvaluation {
    let mut evaluation = PolicyEvaluation::with_decision(
        PolicyDecision::Allow,
        RiskLevel::Medium,
        "data_classification_transition_allowed",
        vec!["data-classification".to_string()],
    );

    if let Some(approval) = approval {
        if !approval.is_complete() {
            evaluation.decision = PolicyDecision::Deny;
            evaluation.reason = "invalid_approval_ref".to_string();
            evaluation.issues.push(PolicyIssue::new(
                PolicyIssueCode::InvalidApproval,
                "approval",
                "ApprovalGate evidence is incomplete.",
            ));
            evaluation.add_rule(
                "approval.ref_complete",
                PolicyDecision::Deny,
                "ApprovalGate evidence must be complete.",
            );
            return evaluation;
        }

        if !approval.is_positive() {
            evaluation.decision = match approval.decision {
                ApprovalDecision::Escalate => PolicyDecision::Escalate,
                ApprovalDecision::Reject => PolicyDecision::Deny,
                ApprovalDecision::Approve | ApprovalDecision::EditAndApprove => {
                    PolicyDecision::Allow
                }
            };
            evaluation.reason = match approval.decision {
                ApprovalDecision::Escalate => "approval_escalated".to_string(),
                ApprovalDecision::Reject => "approval_rejected".to_string(),
                ApprovalDecision::Approve | ApprovalDecision::EditAndApprove => {
                    "data_classification_transition_allowed".to_string()
                }
            };
            evaluation.add_approval_gate_tag();
            return evaluation;
        }
    }

    if current < source {
        let has_positive_approval = approval.is_some_and(ApprovalRef::is_positive);
        if !has_positive_approval {
            evaluation.decision = PolicyDecision::RequireApproval;
            evaluation.reason = "data_classification_downgrade_requires_approval".to_string();
            evaluation.issues.push(PolicyIssue::new(
                PolicyIssueCode::ApprovalRequired,
                "current",
                "Lowering data classification requires explicit ApprovalGate evidence.",
            ));
            evaluation.add_rule(
                "data_classification.no_implicit_downgrade",
                PolicyDecision::RequireApproval,
                "Derived data must inherit source constraints unless a downgrade is approved.",
            );
            evaluation.add_approval_gate_tag();
            return evaluation;
        }
    }

    evaluation.add_rule(
        "data_classification.inherits_or_approved",
        PolicyDecision::Allow,
        "Data classification is unchanged, tighter, or explicitly approved.",
    );
    evaluation
}

fn validate_contract(contract: &OperationContract) -> Vec<PolicyIssue> {
    let mut issues = Vec::new();

    if !has_text(&contract.operation_name) {
        issues.push(PolicyIssue::new(
            PolicyIssueCode::ValidationFailed,
            "operation_name",
            "OperationContract.operation_name is required.",
        ));
    }

    if contract.allowed_actor_types.is_empty() {
        issues.push(PolicyIssue::new(
            PolicyIssueCode::ValidationFailed,
            "allowed_actor_types",
            "OperationContract.allowed_actor_types must not be empty.",
        ));
    }

    if contract.allowed_environments.is_empty() {
        issues.push(PolicyIssue::new(
            PolicyIssueCode::ValidationFailed,
            "allowed_environments",
            "OperationContract.allowed_environments must not be empty.",
        ));
    }

    if contract.data_classification_allowed.is_empty() {
        issues.push(PolicyIssue::new(
            PolicyIssueCode::ValidationFailed,
            "data_classification_allowed",
            "OperationContract.data_classification_allowed must not be empty.",
        ));
    }

    if contract.audit_tags.iter().all(|tag| !has_text(tag)) {
        issues.push(PolicyIssue::new(
            PolicyIssueCode::ValidationFailed,
            "audit_tags",
            "OperationContract.audit_tags must include at least one non-empty tag.",
        ));
    }

    if contract.allowed_environments.contains(&Environment::Prod)
        && contract.risk_level.requires_approval_gate()
        && contract.auto_execute
    {
        issues.push(PolicyIssue::new(
            PolicyIssueCode::PolicyViolation,
            "auto_execute",
            "High-risk production operations must not auto-execute.",
        ));
    }

    issues
}

#[derive(Debug, Clone, Copy)]
struct ApprovalRule {
    rule_id: &'static str,
    reason: &'static str,
    path: &'static str,
    message: &'static str,
}

fn first_approval_required_rule(
    contract: &OperationContract,
    context: &ExecutionContext,
) -> Option<ApprovalRule> {
    if contract.risk_level.requires_approval_gate() {
        return Some(ApprovalRule {
            rule_id: "risk.high_requires_approval_gate",
            reason: "approval_required",
            path: "risk_level",
            message: "High and critical risk operations require ApprovalGate evidence.",
        });
    }

    if context
        .data_classification
        .requires_default_approval_gate()
    {
        return Some(ApprovalRule {
            rule_id: "data.sensitive_requires_approval_gate",
            reason: "sensitive_data_approval_required",
            path: "data_classification",
            message: "Sensitive data requires ApprovalGate evidence.",
        });
    }

    if matches!(
        contract.data_boundary,
        DataBoundary::ExternalModelOrConnector | DataBoundary::Federation
    ) && context.data_classification.is_external_model_sensitive()
    {
        return Some(ApprovalRule {
            rule_id: "data.restricted_external_boundary_requires_approval_gate",
            reason: "data_classification_approval_required",
            path: "data_boundary",
            message: "Restricted or sensitive data crossing an external boundary requires ApprovalGate evidence.",
        });
    }

    if !contract.auto_execute {
        return Some(ApprovalRule {
            rule_id: "execution.manual_requires_approval_gate",
            reason: "manual_execution_required",
            path: "auto_execute",
            message: "Operations that are not allowed to auto-execute require ApprovalGate evidence before execution.",
        });
    }

    None
}

fn deny(
    contract: &OperationContract,
    audit_tags: Vec<String>,
    reason: &'static str,
    path: &'static str,
    message: impl Into<String>,
    rule_id: &'static str,
) -> PolicyEvaluation {
    let mut evaluation = PolicyEvaluation::with_decision(
        PolicyDecision::Deny,
        contract.risk_level,
        reason,
        audit_tags,
    );
    evaluation.issues.push(PolicyIssue::new(
        match reason {
            "actor_type_not_allowed" => PolicyIssueCode::Forbidden,
            "invalid_approval_ref" => PolicyIssueCode::InvalidApproval,
            _ => PolicyIssueCode::PolicyViolation,
        },
        path,
        message,
    ));
    evaluation.add_rule(rule_id, PolicyDecision::Deny, "Policy boundary denied the operation.");
    evaluation
}

fn normalized_audit_tags(tags: &[String]) -> Vec<String> {
    let mut normalized = Vec::new();
    for tag in tags {
        if has_text(tag) {
            push_unique(&mut normalized, tag.trim());
        }
    }
    normalized
}

fn push_unique(values: &mut Vec<String>, value: &str) {
    if !values.iter().any(|existing| existing == value) {
        values.push(value.to_string());
    }
}

fn has_text(value: &str) -> bool {
    !value.trim().is_empty()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn approval(decision: ApprovalDecision) -> ApprovalRef {
        ApprovalRef {
            approval_id: "approval-001".to_string(),
            policy_evaluation_id: "policy-eval-001".to_string(),
            approver_actor_id: "human-owner-001".to_string(),
            decision,
            decision_reason: "Reviewed against ApprovalGate policy.".to_string(),
            rollback_ref: "rollback-plan-001".to_string(),
        }
    }

    fn base_contract() -> OperationContract {
        OperationContract {
            operation_name: "knowledge.search".to_string(),
            risk_level: RiskLevel::Low,
            allowed_actor_types: vec![ActorType::AgentActor, ActorType::HumanActor],
            allowed_environments: vec![Environment::Dev, Environment::Staging],
            data_classification_allowed: vec![
                DataClassification::Public,
                DataClassification::Internal,
            ],
            data_boundary: DataBoundary::Local,
            auto_execute: true,
            audit_tags: vec!["knowledge".to_string(), "read".to_string()],
        }
    }

    fn base_context() -> ExecutionContext {
        ExecutionContext {
            env: Environment::Staging,
            actor_type: ActorType::AgentActor,
            data_classification: DataClassification::Internal,
            approval: None,
        }
    }

    #[test]
    fn enum_labels_match_documented_terms() {
        assert_eq!(RiskLevel::Critical.as_str(), "critical");
        assert_eq!(DataClassification::Restricted.as_str(), "restricted");
        assert_eq!(ActorType::AgentActor.as_str(), "AgentActor");
        assert_eq!(Environment::Staging.as_str(), "staging");
        assert_eq!(PolicyDecision::RequireApproval.as_str(), "require_approval");
    }

    #[test]
    fn allows_low_risk_operation_inside_contract_boundaries() {
        let result = evaluate_operation(&base_contract(), &base_context());

        assert_eq!(result.decision, PolicyDecision::Allow);
        assert_eq!(result.reason, "policy_allowed");
        assert!(result.issues.is_empty());
    }

    #[test]
    fn denies_disallowed_environment() {
        let context = ExecutionContext {
            env: Environment::Prod,
            ..base_context()
        };

        let result = evaluate_operation(&base_contract(), &context);

        assert_eq!(result.decision, PolicyDecision::Deny);
        assert_eq!(result.reason, "environment_not_allowed");
    }

    #[test]
    fn denies_disallowed_actor_type() {
        let context = ExecutionContext {
            actor_type: ActorType::ExternalConnector,
            ..base_context()
        };

        let result = evaluate_operation(&base_contract(), &context);

        assert_eq!(result.decision, PolicyDecision::Deny);
        assert_eq!(result.reason, "actor_type_not_allowed");
    }

    #[test]
    fn requires_approval_gate_for_high_risk_without_approval() {
        let contract = OperationContract {
            operation_name: "attendance.correct".to_string(),
            risk_level: RiskLevel::High,
            auto_execute: false,
            ..base_contract()
        };

        let result = evaluate_operation(&contract, &base_context());

        assert_eq!(result.decision, PolicyDecision::RequireApproval);
        assert_eq!(result.reason, "approval_required");
        assert!(result.audit_tags.iter().any(|tag| tag == "ApprovalGate"));
    }

    #[test]
    fn allows_high_risk_operation_with_complete_positive_approval() {
        let contract = OperationContract {
            operation_name: "attendance.correct".to_string(),
            risk_level: RiskLevel::High,
            auto_execute: false,
            ..base_contract()
        };
        let context = ExecutionContext {
            approval: Some(approval(ApprovalDecision::Approve)),
            ..base_context()
        };

        let result = evaluate_operation(&contract, &context);

        assert_eq!(result.decision, PolicyDecision::Allow);
    }

    #[test]
    fn denies_incomplete_approval_gate_evidence() {
        let contract = OperationContract {
            operation_name: "attendance.correct".to_string(),
            risk_level: RiskLevel::High,
            auto_execute: false,
            ..base_contract()
        };
        let context = ExecutionContext {
            approval: Some(ApprovalRef {
                approval_id: String::new(),
                ..approval(ApprovalDecision::Approve)
            }),
            ..base_context()
        };

        let result = evaluate_operation(&contract, &context);

        assert_eq!(result.decision, PolicyDecision::Deny);
        assert_eq!(result.reason, "invalid_approval_ref");
    }

    #[test]
    fn rejects_high_risk_prod_auto_execute_contract() {
        let contract = OperationContract {
            operation_name: "workforce.profile.update".to_string(),
            risk_level: RiskLevel::Critical,
            allowed_environments: vec![Environment::Prod],
            auto_execute: true,
            ..base_contract()
        };
        let context = ExecutionContext {
            env: Environment::Prod,
            ..base_context()
        };

        let result = evaluate_operation(&contract, &context);

        assert_eq!(result.decision, PolicyDecision::Deny);
        assert_eq!(result.reason, "invalid_operation_contract");
        assert!(result
            .issues
            .iter()
            .any(|issue| issue.path == "auto_execute"));
    }

    #[test]
    fn requires_approval_for_sensitive_data_even_when_low_risk() {
        let contract = OperationContract {
            data_classification_allowed: vec![DataClassification::Sensitive],
            ..base_contract()
        };
        let context = ExecutionContext {
            data_classification: DataClassification::Sensitive,
            ..base_context()
        };

        let result = evaluate_operation(&contract, &context);

        assert_eq!(result.decision, PolicyDecision::RequireApproval);
        assert_eq!(result.reason, "sensitive_data_approval_required");
    }

    #[test]
    fn requires_approval_for_restricted_data_crossing_external_boundary() {
        let contract = OperationContract {
            data_classification_allowed: vec![DataClassification::Restricted],
            data_boundary: DataBoundary::ExternalModelOrConnector,
            ..base_contract()
        };
        let context = ExecutionContext {
            data_classification: DataClassification::Restricted,
            ..base_context()
        };

        let result = evaluate_operation(&contract, &context);

        assert_eq!(result.decision, PolicyDecision::RequireApproval);
        assert_eq!(result.reason, "data_classification_approval_required");
    }

    #[test]
    fn denies_data_classification_outside_contract_allow_list() {
        let context = ExecutionContext {
            data_classification: DataClassification::Restricted,
            ..base_context()
        };

        let result = evaluate_operation(&base_contract(), &context);

        assert_eq!(result.decision, PolicyDecision::Deny);
        assert_eq!(result.reason, "data_classification_not_allowed");
    }

    #[test]
    fn data_classification_downgrade_requires_approval() {
        let result = evaluate_data_classification_transition(
            DataClassification::Restricted,
            DataClassification::Internal,
            None,
        );

        assert_eq!(result.decision, PolicyDecision::RequireApproval);
        assert_eq!(
            result.reason,
            "data_classification_downgrade_requires_approval"
        );
    }

    #[test]
    fn data_classification_tightening_is_allowed_without_approval() {
        let result = evaluate_data_classification_transition(
            DataClassification::Internal,
            DataClassification::Restricted,
            None,
        );

        assert_eq!(result.decision, PolicyDecision::Allow);
    }

    #[test]
    fn data_classification_downgrade_allows_positive_approval() {
        let approval = approval(ApprovalDecision::EditAndApprove);
        let result = evaluate_data_classification_transition(
            DataClassification::Sensitive,
            DataClassification::Restricted,
            Some(&approval),
        );

        assert_eq!(result.decision, PolicyDecision::Allow);
    }
}
