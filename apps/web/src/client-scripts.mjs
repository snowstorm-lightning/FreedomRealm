export function buildLearningJs(state) {
  return `const state = ${JSON.stringify(state, null, 2)};
let selectedLearningTaskId = state.learningTasks[0].id;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderLearningTasks() {
  document.getElementById("learningTaskButtons").innerHTML = state.learningTasks.map(function (task) {
    return '<button type="button" data-learning-task="' + escapeHtml(task.id) + '" aria-pressed="' +
      String(task.id === selectedLearningTaskId) + '">' +
      '<strong>' + escapeHtml(task.label) + '</strong>' +
      '<span>' + escapeHtml(task.title) + '</span>' +
    '</button>';
  }).join("");

  document.querySelectorAll("[data-learning-task]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedLearningTaskId = button.dataset.learningTask;
      renderLearningTasks();
    });
  });

  const task = state.learningTasks.find(function (candidate) {
    return candidate.id === selectedLearningTaskId;
  }) || state.learningTasks[0];

  document.getElementById("learningTaskDetail").innerHTML =
    '<p class="eyebrow">当前学习任务 / Current learning task</p>' +
    '<h2>' + escapeHtml(task.title) + '</h2>' +
    '<p>' + escapeHtml(task.summary) + '</p>' +
    '<ol>' + task.steps.map(function (step) {
      return '<li>' + escapeHtml(step) + '</li>';
    }).join("") + '</ol>' +
    '<div class="hero-actions"><a class="primary-action" href="' + escapeHtml(task.primaryHref) + '">' +
      escapeHtml(task.primaryAction) + '</a></div>';
}

function renderProjectStructureMap() {
  document.getElementById("projectStructureMap").innerHTML = state.projectStructureModules.map(function (module) {
    return '<article class="structure-card">' +
      '<span>' + escapeHtml(module.layer) + '</span>' +
      '<strong>' + escapeHtml(module.title) + '</strong>' +
      '<p>' + escapeHtml(module.detail) + '</p>' +
      '<ul>' + module.files.map(function (file) {
        return '<li>' + escapeHtml(file) + '</li>';
      }).join("") + '</ul>' +
      '<a href="' + escapeHtml(module.href) + '">打开入口 / Open entry</a>' +
    '</article>';
  }).join("");
}

function renderLearningPages() {
  document.getElementById("learningPages").innerHTML = state.learningPages.map(function (page) {
    return '<article class="page-card">' +
      '<span>页面 / Page</span>' +
      '<strong>' + escapeHtml(page.title) + '</strong>' +
      '<p>' + escapeHtml(page.detail) + '</p>' +
      '<a href="' + escapeHtml(page.href) + '">进入 / Open</a>' +
    '</article>';
  }).join("");
}

function renderOperatingSnapshot() {
  const tasks = state.operatingEntry.currentTasks || [];
  const p0Tasks = tasks.filter(function (task) { return task.priority === "P0"; });
  const activeTask = tasks.find(function (task) { return task.taskId === "p0-next-workbench-entry"; }) ||
    p0Tasks[0] ||
    tasks[0];
  const ownerDecisions = (state.activePlans || []).reduce(function (count, plan) {
    return count + Number(plan.humanDecisionCount || 0);
  }, 0);
  const activeBacklog = state.operatingEntry.extensions?.["ai-hrms.decayPreventionBacklog"]?.items?.find(function (item) {
    return item.status === "active";
  });

  const cards = [
    {
      label: "当前 P0 / Active P0",
      title: activeTask ? activeTask.title : "暂无任务 / No task",
      detail: activeTask ? activeTask.taskId + "; verify: " + activeTask.verificationCommands.join(" / ") : ""
    },
    {
      label: "待决策 / Decisions",
      title: String(ownerDecisions) + " human owner checkpoints",
      detail: "Go 控制面和 live connector 仍需要人工确认。 / Go control plane and live connectors still need human confirmation."
    },
    {
      label: "衰减预防 / Decay prevention",
      title: activeBacklog ? activeBacklog.formalTaskId : "none",
      detail: activeBacklog ? "status=" + activeBacklog.status + "; verify: " + activeBacklog.verificationCommands.join(" / ") : "No active backlog item."
    }
  ];

  document.getElementById("operatingSnapshot").innerHTML =
    '<div class="section-heading">' +
      '<p class="eyebrow">运行快照 / Operating Snapshot</p>' +
      '<h2>学习时先看当前项目状态 / Check current project state while learning</h2>' +
    '</div>' +
    '<div class="snapshot-grid">' + cards.map(function (card) {
      return '<article class="snapshot-card">' +
        '<span>' + escapeHtml(card.label) + '</span>' +
        '<strong>' + escapeHtml(card.title) + '</strong>' +
        '<p>' + escapeHtml(card.detail) + '</p>' +
      '</article>';
    }).join("") + '</div>';
}

function renderTemplatePreview() {
  document.getElementById("templatePreview").innerHTML = state.cards.slice(0, 6).map(function (card) {
    return '<article class="template-preview-card">' +
      '<span>' + escapeHtml(card.riskLevel + " / " + card.approvalStatus) + '</span>' +
      '<strong>' + escapeHtml(card.displayName) + '</strong>' +
      '<p>' + escapeHtml(card.taskGoal) + '</p>' +
      '<a href="./workbench.html#report-workbench">在工作台查看 / View in workbench</a>' +
    '</article>';
  }).join("");
}

function renderAll() {
  renderLearningTasks();
  renderProjectStructureMap();
  renderLearningPages();
  renderOperatingSnapshot();
  renderTemplatePreview();
}

renderAll();
`;
}

export function buildJs(state) {
  return `const state = ${JSON.stringify(state, null, 2)};
let selectedTemplateId = state.cards[0].templateId;
let selectedEntryId = state.entryModes[0].id;
let selectedKnowledgeIndex = 0;
let selectedWorkbenchView = viewFromHash(window.location.hash);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function itemText(item) {
  return item.detail || item.reason || item.status || "";
}

function renderList(items, titleKey) {
  return '<ul class="stack-list">' + items.map(function (item) {
    const title = item[titleKey] || item.title || item.action || item.toolName || item.path || item.refId;
    return '<li><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(itemText(item)) + '</span></li>';
  }).join("") + '</ul>';
}

function renderMeta(card) {
  const entries = [
    ["契约 / Schema", card.schemaVersion],
    ["风险 / Risk", card.riskLevel],
    ["审批 / Approval", card.approvalStatus],
    ["共享 / Share", card.sharePermission],
    ["模型路由 / Model route", card.modelRoute.actual + (card.modelRoute.mock ? " / mock" : "")],
    ["数据 / Data", card.dataClassification + " / " + card.redactionStatus],
    ["输入 / Inputs", String(card.metrics.inputDocumentCount)],
    ["人工复核 / Human review", card.metrics.requiresHumanReview ? "required" : "not required"]
  ];
  return '<dl class="meta-grid">' + entries.map(function (entry) {
    return '<div><dt>' + escapeHtml(entry[0]) + '</dt><dd>' + escapeHtml(entry[1]) + '</dd></div>';
  }).join("") + '</dl>';
}

function renderTaskMetaList(label, items, limit) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }
  const visibleItems = items.slice(0, limit);
  const overflowCount = Math.max(0, items.length - visibleItems.length);
  return '<div class="task-meta">' +
    '<span>' + escapeHtml(label) + '</span>' +
    '<ul>' + visibleItems.map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join("") +
      (overflowCount > 0 ? '<li>+' + String(overflowCount) + ' more</li>' : '') +
    '</ul>' +
  '</div>';
}

function renderTaskOrigin(origin) {
  if (!origin || typeof origin !== "object") {
    return "";
  }
  const findingIds = Array.isArray(origin.sourceFindingIds)
    ? origin.sourceFindingIds.join(", ")
    : "";
  const recommendationIds = Array.isArray(origin.sourceRecommendationIds)
    ? origin.sourceRecommendationIds.join(", ")
    : "";
  const parts = [
    origin.candidateWorkItemId ? "candidateWorkItemId=" + origin.candidateWorkItemId : "",
    findingIds ? "sourceFindingIds=" + findingIds : "",
    recommendationIds ? "sourceRecommendationIds=" + recommendationIds : "",
    origin.humanApprovalRef ? "humanApprovalRef=" + origin.humanApprovalRef : ""
  ].filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  return '<div class="task-origin">' +
    '<strong>候选来源 / Candidate origin</strong>' +
    escapeHtml(parts.join("; ")) +
  '</div>';
}

function compactJoin(items, fallback) {
  return Array.isArray(items) && items.length > 0 ? items.join(", ") : fallback;
}

function renderDecayPreventionBacklog(entry) {
  const backlog = entry.extensions?.["ai-hrms.decayPreventionBacklog"];
  if (!backlog || !Array.isArray(backlog.items)) {
    return '<div class="section-heading">' +
      '<p class="eyebrow">衰减预防 / Decay prevention</p>' +
      '<h2>暂无已复核 backlog / No reviewed backlog</h2>' +
    '</div>';
  }

  const items = backlog.items.slice(0, 3).map(function (item) {
    const implementationRefs = compactJoin(item.implementationRefs, "none");
    return '<article class="backlog-item">' +
      '<header><strong>' + escapeHtml(item.candidateWorkItemId + " -> " + item.formalTaskId) +
        '</strong><span class="status-pill compact">' + escapeHtml(item.status) + '</span></header>' +
      '<p>优先级 / Priority: ' + escapeHtml(item.priority) + '; 风险 / Risk: ' +
        escapeHtml(item.riskLevel) + '</p>' +
      '<div class="backlog-meta">' +
        '<span>owner: ' + escapeHtml(compactJoin(item.ownerActorTypes, "HumanActor")) + '</span>' +
        '<span>sourceFindingIds: ' + escapeHtml(compactJoin(item.sourceFindingIds, "none")) + '</span>' +
        '<span>sourceRecommendationIds: ' + escapeHtml(compactJoin(item.sourceRecommendationIds, "none")) + '</span>' +
        '<span>verify: ' + escapeHtml(compactJoin(item.verificationCommands, "pnpm check")) + '</span>' +
        '<span>writeSet: ' + escapeHtml(compactJoin(item.writeSet, "read-only")) + '</span>' +
        '<span>implementationRefs: ' + escapeHtml(implementationRefs) + '</span>' +
      '</div>' +
    '</article>';
  }).join("");

  return '<div class="section-heading">' +
      '<p class="eyebrow">衰减预防 / Decay prevention</p>' +
      '<h2>人工复核 backlog / Human-reviewed backlog</h2>' +
    '</div>' +
    '<section class="backlog-summary" aria-label="衰减预防 backlog 摘要 / Decay prevention backlog summary">' +
      '<strong>只追踪候选项，不自动执行 / Tracking only, no automatic execution</strong>' +
      '<p>promotionPolicy=' + escapeHtml(backlog.promotionPolicy) +
        '; humanApprovalRef=' + escapeHtml(backlog.humanApprovalRef) +
        '; autoCreateExternalIssues=' + escapeHtml(String(backlog.autoCreateExternalIssues)) + '</p>' +
      '<p>自我审查输出仍需 human owner 复核；不会自动修改仓库、创建外部 issue/PR、发布 Commons、训练模型或给成员创造义务。 / Self-review output still needs human owner review. It does not automatically modify the repo, create external issues or PRs, publish Commons assets, train models, or create member obligations.</p>' +
    '</section>' +
    '<div class="backlog-list">' + items + '</div>' +
    '<p class="backlog-note">高风险 live connector 仍需要 ApprovalGate；该面板只读取本地 manifest。 / High-risk live connector work still requires ApprovalGate; this panel only reads the local manifest.</p>';
}

function renderActivePlans() {
  const plans = state.activePlans || [];
  if (plans.length === 0) {
    document.getElementById("activePlans").innerHTML = "";
    return;
  }

  document.getElementById("activePlans").innerHTML = plans.map(function (plan) {
    const goalItems = (plan.goals || []).slice(0, 2).map(function (goal) {
      return '<li>' + escapeHtml(goal) + '</li>';
    }).join("");
    const decisionPreview = plan.humanDecisionPreview.length > 0
      ? plan.humanDecisionPreview.join(" / ")
      : "无阻塞决策 / no blocking decision";
    return '<article class="plan-card">' +
      '<header><strong>' + escapeHtml(plan.title) + '</strong><span class="status-pill compact">' +
        escapeHtml(plan.status) + '</span></header>' +
      '<p>计划入口 / Plan entry: <a href="' + escapeHtml(plan.href) + '">' +
        escapeHtml(plan.filename) + '</a></p>' +
      '<p>决策点 / Human decisions: ' + escapeHtml(String(plan.humanDecisionCount)) + '</p>' +
      (goalItems ? '<ul>' + goalItems + '</ul>' : '') +
      '<p class="plan-warning">只读计划入口，不是自动实现授权。 / Read-only plan entry, not automatic implementation authorization.</p>' +
      (plan.statusSource === "inferred"
        ? '<p class="plan-warning">缺少显式状态，当前按 active 推断。 / Missing explicit status; currently inferred as active.</p>'
        : '') +
      (plan.planOnly
        ? '<p class="plan-warning">该计划包含非目标或待决策边界。 / This plan includes non-goals or decision boundaries.</p>'
        : '') +
      '<p>预览 / Preview: ' + escapeHtml(decisionPreview) + '</p>' +
    '</article>';
  }).join("");
}

function renderOwnerDecisionQueue() {
  const tasks = state.operatingEntry.currentTasks || [];
  const highRiskTasks = tasks.filter(function (task) { return task.riskLevel === "high"; });
  const plansWithDecisions = (state.activePlans || []).filter(function (plan) {
    return plan.humanDecisionCount > 0;
  });
  const decayBacklog = state.operatingEntry.extensions?.["ai-hrms.decayPreventionBacklog"];
  const activeBacklogItem = decayBacklog?.items?.find(function (item) {
    return item.status === "active";
  });

  const queueItems = [
    ...plansWithDecisions.slice(0, 2).map(function (plan) {
      return {
        label: "计划决策 / Plan decision",
        status: String(plan.humanDecisionCount) + " pending",
        title: plan.title,
        detail: plan.humanDecisionPreview.join(" / "),
        command: plan.filename
      };
    }),
    ...highRiskTasks.slice(0, 1).map(function (task) {
      return {
        label: "高风险候选 / High-risk candidate",
        status: task.riskLevel,
        title: task.title,
        detail: "需要 human owner 决策、ApprovalGate、secret 边界和数据生命周期设计。 / Requires human owner decision, ApprovalGate, secret boundary, and data lifecycle design.",
        command: task.taskId
      };
    }),
    activeBacklogItem
      ? {
          label: "人工复核 / Human review",
          status: activeBacklogItem.status,
          title: activeBacklogItem.formalTaskId,
          detail: "衰减预防 backlog 只追踪来源和验证；不自动创建 issue、发布 Commons 或修改仓库。 / Decay prevention backlog only tracks provenance and validation; it does not create issues, publish Commons assets, or modify the repo automatically.",
          command: activeBacklogItem.candidateWorkItemId
        }
      : null
  ].filter(Boolean).slice(0, 4);

  document.getElementById("ownerDecisionQueue").innerHTML =
    '<div class="decision-queue-intro">' +
      '<p class="eyebrow">需要 owner 决策 / Owner Decision Queue</p>' +
      '<h2>候选决策，不是自动分派 / Candidate decisions, not automatic assignments</h2>' +
      '<p>这里集中展示会影响架构、连接器、数据生命周期或自审晋升的人工 checkpoint。拒绝、延后、缩小范围或转交都不能成为负面贡献信号。 / This queue gathers human checkpoints that affect architecture, connectors, data lifecycle, or self-review promotion. Refusal, delay, scope reduction, or transfer must not become a negative contribution signal.</p>' +
    '</div>' +
    queueItems.map(function (item) {
      return '<article class="decision-queue-item">' +
        '<header><span class="eyebrow">' + escapeHtml(item.label) + '</span><span class="status-pill compact">' +
          escapeHtml(item.status) + '</span></header>' +
        '<strong>' + escapeHtml(item.title) + '</strong>' +
        '<p>' + escapeHtml(item.detail) + '</p>' +
        '<code>' + escapeHtml(item.command) + '</code>' +
      '</article>';
    }).join("");
}

function renderOperatingEntry() {
  const entry = state.operatingEntry;
  const tasks = entry.currentTasks || [];
  const p0Tasks = tasks.filter(function (task) { return task.priority === "P0"; });
  const activeTask = tasks.find(function (task) { return task.taskId === "p0-next-workbench-entry"; }) ||
    p0Tasks[0] ||
    tasks[0];
  const taskGroups = ["P0", "P1", "P2"].map(function (priority) {
    return {
      priority,
      tasks: tasks.filter(function (task) { return task.priority === priority; })
    };
  }).filter(function (group) { return group.tasks.length > 0; });
  const startupCommand = entry.startupCommands[0] || "pnpm self-review";
  document.getElementById("operatingTasks").innerHTML =
    '<div class="section-heading">' +
      '<p class="eyebrow">' + escapeHtml(entry.schemaVersion) + '</p>' +
      '<h2>当前任务队列 / Current task queue</h2>' +
      '<p>默认下一条命令 / Default next command: <strong>' + escapeHtml(startupCommand) + '</strong></p>' +
    '</div>' +
    (activeTask ? '<section class="active-task">' +
      '<span>当前 P0 WorkItem / Active P0 WorkItem</span>' +
      '<strong>' + escapeHtml(activeTask.taskId) + '</strong>' +
      '<p>' + escapeHtml(activeTask.title) + '</p>' +
      '<div class="chip-row">' +
        (activeTask.outputs || []).slice(0, 8).map(function (output) {
          return '<span>' + escapeHtml(output) + '</span>';
        }).join("") +
      '</div>' +
      renderTaskMetaList("验收 / Acceptance", activeTask.acceptanceCriteria, 6) +
    '</section>' : '') +
    '<div class="task-list">' + taskGroups.map(function (group) {
      return '<section class="task-lane" aria-label="' + escapeHtml(group.priority) + ' 任务 / tasks">' +
        '<h3>' + escapeHtml(group.priority) + ' 队列 / lane</h3>' +
        group.tasks.slice(0, 3).map(function (task) {
          return '<article class="task-card">' +
            '<header><strong>' + escapeHtml(task.title) + '</strong><span class="priority-pill">' +
              escapeHtml(task.priority) + '</span></header>' +
            '<p>任务 ID / TaskId: ' + escapeHtml(task.taskId) + '</p>' +
            '<p>负责人 / Owner: ' + escapeHtml(task.ownerActorTypes.join(" + ")) + '</p>' +
            '<p>风险 / Risk: ' + escapeHtml(task.riskLevel) + '; 验证 / verify: ' +
              escapeHtml(task.verificationCommands.join(" / ")) + '</p>' +
            '<p>writeSet: ' + escapeHtml(task.suggestedWriteSet.join(", ")) + '</p>' +
            renderTaskMetaList("验收 / Acceptance", task.acceptanceCriteria, 2) +
            renderTaskMetaList("来源 / Sources", task.sourceRefs, 2) +
            renderTaskOrigin(task.candidateOrigin) +
            (task.riskLevel === "high"
              ? '<p class="risk-note">任何 live 执行前都需要 human owner 决策和 ApprovalGate。 / Human owner decision and ApprovalGate are required before any live execution.</p>'
              : '') +
          '</article>';
        }).join("") +
      '</section>';
    }).join("") + '</div>';

  const leaseFields = entry.leaseTemplate.requiredFields || [];
  const stopRules = entry.continuationRules.allowStopWhen || [];
  const mergeRule = entry.conflictRules.rules.find(function (rule) {
    return rule.includes("MergeGate");
  }) || "MergeGate checks contracts, docs, tests, dataClassification, and ApprovalGate.";
  const conflictRuleItems = entry.conflictRules.rules.slice(0, 4).map(function (rule) {
    return '<li>' + escapeHtml(rule) + '</li>';
  }).join("");
  document.getElementById("operatingGuards").innerHTML =
    '<div class="section-heading">' +
      '<p class="eyebrow">执行防护 / Harness Guards</p>' +
      '<h2>AgentWorkLease、writeSet、MergeGate 与 checkpoint / AgentWorkLease, writeSet, MergeGate, checkpoint</h2>' +
    '</div>' +
    '<section class="lease-preview" aria-label="当前 AgentWorkLease 预览 / Current AgentWorkLease preview">' +
      '<strong>当前 shard 的 AgentWorkLease 预览 / AgentWorkLease preview for current shard</strong>' +
      '<dl>' +
        '<div><dt>readSet</dt><dd>config/project-operating-entry.json; generated ExecutionReportCard JSON</dd></div>' +
        '<div><dt>writeSet</dt><dd>apps/web/bin/build-demo.mjs; packages/demo/test/web-workbench-build.test.mjs</dd></div>' +
        '<div><dt>validationCommands</dt><dd>pnpm web:demo; pnpm check</dd></div>' +
        '<div><dt>rollbackPlan</dt><dd>回退本次静态 Web Workbench 文案并重建 dist/web / revert this static Web Workbench change and rebuild dist/web</dd></div>' +
      '</dl>' +
    '</section>' +
    '<div class="guard-grid">' +
      '<section class="guard-block"><strong>AgentWorkLease 字段 / AgentWorkLease fields</strong><p>' +
        escapeHtml(leaseFields.join(", ")) + '</p></section>' +
      '<section class="guard-block"><strong>writeSet 策略 / writeSet policy</strong><p>' +
        escapeHtml(entry.conflictRules.defaultWriteSetPolicy) + '; ' + escapeHtml(mergeRule) + '</p>' +
        '<ul>' + conflictRuleItems + '</ul></section>' +
      '<section class="guard-block"><strong>停止条件 / Stop conditions</strong><p>' +
        escapeHtml(stopRules.slice(0, 3).join(" / ")) + '</p></section>' +
      '<section class="guard-block"><strong>执行原则 / Harness principles</strong><p>' +
        escapeHtml(entry.harnessPrinciples.slice(0, 3).join(" / ")) + '</p></section>' +
    '</div>';

  document.getElementById("decayBacklog").innerHTML = renderDecayPreventionBacklog(entry);
}

function renderProofStats() {
  document.getElementById("proofStats").innerHTML = state.proofStats.map(function (item) {
    return '<article class="proof-stat">' +
      '<span>' + escapeHtml(item.label) + '</span>' +
      '<strong>' + escapeHtml(item.value) + '</strong>' +
      '<p>' + escapeHtml(item.detail) + '</p>' +
    '</article>';
  }).join("");
}

function renderReviewPrompts() {
  document.getElementById("reviewPrompts").innerHTML = state.reviewPrompts.map(function (item) {
    return '<article class="review-prompt-card">' +
      '<span>' + escapeHtml(item.label) + '</span>' +
      '<strong>' + escapeHtml(item.focus) + '</strong>' +
      '<p>' + escapeHtml(item.prompt) + '</p>' +
    '</article>';
  }).join("");
}

function renderFeedbackTargets() {
  document.getElementById("feedbackTargets").innerHTML = state.feedbackTargets.map(function (item) {
    return '<article class="feedback-target">' +
      '<span>' + escapeHtml(item.label) + '</span>' +
      '<strong>' + escapeHtml(item.anchor) + '</strong>' +
      '<p>' + escapeHtml(item.cue) + '</p>' +
    '</article>';
  }).join("");
}

function renderSafetyBadges() {
  document.getElementById("safetyBadges").innerHTML = state.safetyBadges.map(function (badge) {
    return '<span>' + escapeHtml(badge) + '</span>';
  }).join("");
}

function renderLanguageBoundary() {
  return '<section class="language-boundary" aria-label="双语展示边界 / Bilingual display boundary">' +
    state.languageBoundary.map(function (item) {
      return '<article><span>' + escapeHtml(item.label) + '</span><p>' + escapeHtml(item.detail) + '</p></article>';
    }).join("") +
  '</section>';
}

function renderModeCards() {
  document.getElementById("modeCards").innerHTML = state.modeCards.map(function (item) {
    return '<article class="mode-card">' +
      '<span>' + escapeHtml(item.audience) + '</span>' +
      '<strong>' + escapeHtml(item.mode) + '</strong>' +
      '<p>' + escapeHtml(item.boundary) + '</p>' +
    '</article>';
  }).join("");
}

function renderHumanDecisionCheckpoint(card, firstNextAction) {
  const reviewRequired = card.metrics.requiresHumanReview === true;
  const approvalNeeded = card.approvalStatus === "requires_human_review";
  const approvalGateDecision = card.approvalGate?.decision || card.approvalStatus;
  const decisionItems = [
    {
      label: "Owner 决策 / Owner decision",
      title: reviewRequired ? card.humanOwnerId : "无 owner 动作待处理 / No owner action pending",
      detail: reviewRequired
        ? "HumanActor 接受、编辑、延后或拒绝前，只能把输出视为候选证据。 / Treat this output as candidate evidence until a HumanActor accepts, edits, defers, or rejects it."
        : "阅读渲染输出前，当前报告卡不需要人工 checkpoint。 / The current report card does not require a human checkpoint before reading the rendered output."
    },
    {
      label: "ApprovalGate",
      title: approvalGateDecision,
      detail: approvalNeeded
        ? "审批前，不得据此执行副作用、发布、分派、共享或训练。 / Do not execute side effects, publish, assign, share, or train from this card before approval."
        : "该 demo 卡未请求高风险副作用。 / No high-risk side effect is requested by this demo card."
    },
    {
      label: "下一选择 / Next choice",
      title: firstNextAction ? firstNextAction.action : "无候选动作 / No candidate action",
      detail: firstNextAction
        ? firstNextAction.reason
        : "保留为审计材料，不自动创建 WorkItem。 / Keep the card as an audit artifact; no automatic WorkItem is created."
    }
  ];

  return '<section class="decision-checkpoint" aria-label="人工决策 checkpoint / Human decision checkpoint">' +
    '<header><p class="eyebrow">人工决策 checkpoint / Human decision checkpoint</p>' +
      '<h3>继续前需要人确认什么 / What needs a person before this moves forward</h3>' +
      '<p>AI 输出仍是建议，不是命令；拒绝、延后、缩小范围或转交不能成为负面贡献信号。 / AI output remains a recommendation. Refusal, delay, scope reduction, or transfer must not become a negative contribution signal.</p></header>' +
    decisionItems.map(function (item) {
      return '<article><span>' + escapeHtml(item.label) + '</span><strong>' + escapeHtml(item.title) +
        '</strong><p>' + escapeHtml(item.detail) + '</p></article>';
    }).join("") +
  '</section>';
}

function renderReport(card) {
  const toolItems = card.toolContractRefs.map(function (tool) {
    return {
      toolName: tool.toolName,
      detail: tool.riskLevel + " 风险 / risk, autoExecute=" + String(tool.autoExecute)
    };
  });
  const inputItems = card.inputRefs.map(function (input) {
    return {
      path: input.path,
      detail: input.dataClassification + ", " + input.byteLength + " bytes"
    };
  });
  const candidateWorkItems = card.selfReview?.candidateWorkItems || [];
  const workPlanCandidateItems = card.workPlan?.candidateWorkItems || [];
  const allCandidateWorkItems = [...candidateWorkItems, ...workPlanCandidateItems];
  const suggestedWorkShards = card.workPlan?.suggestedWorkShards || [];
  const templateEvaluationSamples = card.templateEvaluationSamples?.samples || [];
  const firstTemplateEvaluationSample = templateEvaluationSamples[0];
  const evalSampleItem = card.evalSample
    ? [
        {
          title: card.evalSample.sampleType,
          detail:
            "状态 / status: " +
            card.evalSample.status +
            ", approvalRequired=" +
            String(card.evalSample.approvalRequired) +
            ", sourceTemplate=" +
            card.evalSample.sourceTemplateId
        }
      ]
    : [];
  const firstNextAction = card.nextActions[0];
  document.getElementById("reportSurface").innerHTML =
    '<header class="report-header">' +
      '<div class="report-title-row">' +
        '<div><p class="eyebrow">ExecutionReportCard</p><h2>' + escapeHtml(card.displayName) + '</h2></div>' +
        '<span class="status-pill">' + escapeHtml(card.status) + '</span>' +
      '</div>' +
      '<p class="mock-note">' + escapeHtml(card.mockOutputNotice) + '</p>' +
      '<p>' + escapeHtml(card.summary) + '</p>' +
      renderLanguageBoundary() +
    '</header>' +
    '<section class="report-digest" aria-label="报告卡摘要 / Report card digest">' +
      '<div><span>状态 / Status</span><strong>' + escapeHtml(card.status) + '</strong></div>' +
      '<div><span>风险 / Risk</span><strong>' + escapeHtml(card.riskLevel) + '</strong></div>' +
      '<div><span>审批 / Approval</span><strong>' + escapeHtml(card.approvalStatus) + '</strong></div>' +
      '<div><span>数据 / Data</span><strong>' + escapeHtml(card.dataClassification) + '</strong></div>' +
      '<div class="wide"><span>候选下一步 / Candidate next action</span><strong>' +
        escapeHtml(firstNextAction ? firstNextAction.action : "人工复核 / Human review") + '</strong></div>' +
      '<p class="wide">ExecutionReportCard JSON 是 canonical 事实源；Markdown、HTML 和 Web Workbench 只是复核渲染。 / ExecutionReportCard JSON is canonical. Markdown, HTML, and this Web Workbench are renders for review.</p>' +
    '</section>' +
    '<section class="evidence-strip" aria-label="报告卡证据条 / Report-card evidence strip">' +
      '<article class="evidence-card"><span>Canonical JSON source / canonical JSON 来源</span><strong>' +
        escapeHtml(card.reportCardId) + '</strong><p>使用 JSON 链接进行审计、重放和报告卡校验。 / Use the JSON link for audit, replay, and report-card validation.</p></article>' +
      '<article class="evidence-card"><span>评测样本 / Eval samples</span><strong>' +
        escapeHtml(firstTemplateEvaluationSample ? firstTemplateEvaluationSample.sampleId : "none") +
        '</strong><p>candidate, reviewRequired=' + escapeHtml(String(card.templateEvaluationSamples?.reviewRequired === true)) +
        '</p></article>' +
      '<article class="evidence-card"><span>失败路径 / Failure path</span><strong>' +
        escapeHtml(card.failureSample.failureType) + '</strong><p>' +
        escapeHtml(card.failureSample.statusIfTriggered) + '</p></article>' +
      '<article class="evidence-card"><span>审批 / 数据边界 / Approval / data boundary</span><strong>' +
        escapeHtml(card.approvalStatus) + '</strong><p>' +
        escapeHtml(card.dataClassification + ", " + card.redactionStatus + ", " + card.sharePermission) +
        '</p></article>' +
    '</section>' +
    renderHumanDecisionCheckpoint(card, firstNextAction) +
    renderMeta(card) +
    '<div class="report-grid">' +
      '<section><h3>发现 / Findings</h3>' + renderList(card.findings, "title") + '</section>' +
      '<section><h3>建议 / Recommendations</h3>' + renderList(card.recommendations, "title") + '</section>' +
      '<section><h3>候选下一步 / Candidate Next Actions</h3>' + renderList(card.nextActions, "action") + '</section>' +
      '<section><h3>工具契约 / Tool Contracts</h3>' + renderList(toolItems, "toolName") + '</section>' +
      (allCandidateWorkItems.length > 0
        ? '<section class="wide"><h3>候选 WorkItems / Candidate WorkItems</h3>' + renderList(allCandidateWorkItems.map(function (item) {
            return {
              title: (item.candidateWorkItemId ? item.candidateWorkItemId + " / " : "") + item.title,
              detail:
                "状态 / status: " + item.status +
                ", approvalRequired=" + String(item.approvalRequired === true) +
                ", 负责人 / owner: " + (item.ownerActorTypes || []).join(" + ") +
                ", " + item.priority +
                ", " + item.riskLevel +
                ", writeSet: " + item.suggestedWriteSet.join(", ")
            };
          }), "title") + '</section>'
        : '') +
      (suggestedWorkShards.length > 0
        ? '<section class="wide"><h3>候选 WorkShards / Candidate WorkShards</h3>' + renderList(suggestedWorkShards.map(function (shard) {
            return {
              title: shard.shardId + " / " + shard.ownerAgentRole,
              detail: "候选 shard，未分派 / candidate shard, not assigned, " + shard.riskLevel + ", modelRoute: " + shard.modelRoute + ", verify: " +
                shard.validationCommands.join(" / ") + ", writeSet: " + (shard.writeSet.length > 0 ? shard.writeSet.join(", ") : "read-only")
            };
          }), "title") + '</section>'
        : '') +
      '<section class="wide"><h3>输入引用 / Input Refs</h3>' + renderList(inputItems, "path") + '</section>' +
      (evalSampleItem.length > 0
        ? '<section><h3>候选评测样本 / Eval Sample Candidate</h3>' + renderList(evalSampleItem, "title") + '</section>'
        : '') +
      (templateEvaluationSamples.length > 0
        ? '<section class="wide"><h3>模板评测样本 / Template Evaluation Samples</h3>' + renderList(templateEvaluationSamples.map(function (sample) {
            return {
              title: sample.sampleId,
              detail: sample.purpose + " 失败模式 / Failure mode: " + sample.failureModeCovered
            };
          }), "title") + '</section>'
        : '') +
      '<section class="wide"><h3>失败路径样本 / Failure Path Sample</h3>' +
        renderList([{ title: card.failureSample.failureType, detail: card.failureSample.recovery }], "title") +
      '</section>' +
    '</div>' +
    '<footer class="data-links">' +
      '<a href="' + escapeHtml(card.jsonHref) + '">打开 canonical JSON / Open canonical JSON</a>' +
      '<a href="' + escapeHtml(card.markdownHref) + '">打开 Markdown 渲染 / Open Markdown render</a>' +
      (card.answerCardHref ? '<a href="' + escapeHtml(card.answerCardHref) + '">打开 AnswerCard JSON / Open AnswerCard JSON</a>' : '') +
      (card.docChallengeDraftHref ? '<a href="' + escapeHtml(card.docChallengeDraftHref) + '">打开 ChallengeDraft JSON / Open ChallengeDraft JSON</a>' : '') +
    '</footer>';

  document.getElementById("executionTrace").innerHTML = card.executionTrace.map(function (step) {
    return '<li>' + escapeHtml(step) + '</li>';
  }).join("");
}

function renderKnowledgeExamples() {
  const examples = state.knowledgeExamples || [];
  if (examples.length === 0) {
    return;
  }

  document.getElementById("knowledgeQuestionList").innerHTML = examples.map(function (example, index) {
    return '<button type="button" data-knowledge-index="' + String(index) + '" aria-current="' +
      String(index === selectedKnowledgeIndex) + '">' + escapeHtml(example.query) + '</button>';
  }).join("");

  document.querySelectorAll("[data-knowledge-index]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedKnowledgeIndex = Number(button.dataset.knowledgeIndex);
      renderAll();
    });
  });

  const example = examples[selectedKnowledgeIndex] || examples[0];
  const answerCard = example.answerCard;
  const sourceItems = answerCard.sourceRefs.map(function (sourceRef, index) {
    return '<li>' +
      '<strong>' + escapeHtml(sourceRef.heading) + '</strong>' +
      '<span>' + escapeHtml(sourceRef.path + ":L" + sourceRef.lineStart + "-L" + sourceRef.lineEnd) + '</span>' +
      '<span>' + escapeHtml(sourceRef.preview) + '</span>' +
      '<div class="source-actions">' +
        '<button type="button" data-challenge-source="' + String(index) + '">挑战此点 / Challenge this point</button>' +
        '<a href="' + escapeHtml(example.docChallengeDraftHref) + '">打开草稿 / Open draft</a>' +
      '</div>' +
    '</li>';
  }).join("");

  document.getElementById("knowledgeAnswer").innerHTML =
    '<header class="report-header">' +
      '<p class="eyebrow">' + escapeHtml(example.searchMode) + '</p>' +
      '<h2>' + escapeHtml(answerCard.question) + '</h2>' +
      '<p>' + escapeHtml(answerCard.answer) + '</p>' +
    '</header>' +
    '<dl class="meta-grid">' +
      '<div><dt>契约 / Schema</dt><dd>' + escapeHtml(answerCard.schemaVersion) + '</dd></div>' +
      '<div><dt>置信度 / Confidence</dt><dd>' + escapeHtml(answerCard.confidence) + '</dd></div>' +
      '<div><dt>来源 / Sources</dt><dd>' + String(example.sourceHitCount) + '</dd></div>' +
      '<div><dt>共享 / Share</dt><dd>' + escapeHtml(answerCard.sharePermission) + '</dd></div>' +
    '</dl>' +
    '<section><h3>来源 / Sources</h3><ul class="source-list">' + sourceItems + '</ul></section>' +
    '<p class="challenge-status" id="challengeStatus">挑战动作只生成复核草稿，不修改来源文档。 / Challenge actions create draft review material only. No source document is modified.</p>' +
    '<footer class="data-links">' +
      '<a href="' + escapeHtml(example.answerCardHref) + '">打开 AnswerCard JSON / Open AnswerCard JSON</a>' +
      '<a href="' + escapeHtml(example.docChallengeDraftHref) + '">打开 ChallengeDraft JSON / Open ChallengeDraft JSON</a>' +
      '<a href="' + escapeHtml(example.reportCardHref) + '">打开 ReportCard JSON / Open ReportCard JSON</a>' +
    '</footer>';

  document.querySelectorAll("[data-challenge-source]").forEach(function (button) {
    button.addEventListener("click", function () {
      const source = answerCard.sourceRefs[Number(button.dataset.challengeSource)];
      document.getElementById("challengeStatus").textContent =
        "已为 " + source.path + ":L" + source.lineStart +
        " 准备挑战草稿；任何文档修改前都需要人工复核。 / Draft challenge prepared for " + source.path + ":L" +
        source.lineStart + ". Human review is required before any documentation change.";
    });
  });
}

function renderTemplateBadges(card) {
  const route = card.modelRoute.mock ? "mock route" : card.modelRoute.actual;
  const badges = [
    "风险 / Risk: " + card.riskLevel,
    "审批 / Approval: " + card.approvalStatus,
    "路由 / Route: " + route,
    "共享 / Share: " + card.sharePermission
  ];
  return '<div class="template-badges" aria-label="模板治理标记 / Template governance badges">' +
    badges.map(function (badge) {
      return '<span>' + escapeHtml(badge) + '</span>';
    }).join("") +
  '</div>';
}

function renderTemplates() {
  document.getElementById("templateList").innerHTML = state.cards.map(function (card) {
    const current = card.templateId === selectedTemplateId;
    const firstEvalSample = card.templateEvaluationSamples?.samples?.[0];
    const proofLine = firstEvalSample
      ? "评测 / Eval: " + firstEvalSample.sampleId + "; 失败路径 / failure: " + card.failureSample.failureType
      : "评测 / Eval: missing; 失败路径 / failure: " + card.failureSample.failureType;
    return '<button type="button" class="template-button" data-template="' + escapeHtml(card.templateId) + '" aria-current="' + String(current) + '">' +
      '<strong>' + escapeHtml(card.displayName) + '</strong>' +
      '<span>' + escapeHtml(card.taskGoal) + '</span>' +
      '<span class="template-proof"><b>评测证据 / Eval evidence</b> ' + escapeHtml(proofLine) + '</span>' +
      renderTemplateBadges(card) +
    '</button>';
  }).join("");
  document.querySelectorAll("[data-template]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedTemplateId = button.dataset.template;
      renderAll();
    });
  });
}

function renderEntryModes() {
  document.getElementById("entryModes").innerHTML = state.entryModes.map(function (entry) {
    return '<button type="button" data-entry="' + escapeHtml(entry.id) + '" aria-pressed="' + String(entry.id === selectedEntryId) + '">' +
      '<strong>' + escapeHtml(entry.label) + '</strong>' +
      '<small>' + escapeHtml(entry.summary) + '</small>' +
    '</button>';
  }).join("");
  document.querySelectorAll("[data-entry]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedEntryId = button.dataset.entry;
      const selected = state.entryModes.find(function (entry) { return entry.id === selectedEntryId; });
      if (selected && selected.primaryTemplateId) {
        selectedTemplateId = selected.primaryTemplateId;
      }
      renderEntryModes();
      renderTemplates();
      const card = state.cards.find(function (candidate) { return candidate.templateId === selectedTemplateId; }) || state.cards[0];
      renderReport(card);
    });
  });
  const selected = state.entryModes.find(function (entry) { return entry.id === selectedEntryId; });
  document.getElementById("entryNote").textContent = selected.summary;
  document.getElementById("entryActionTitle").textContent = selected.action;
  document.getElementById("entryActionDetail").textContent = selected.summary;
  document.getElementById("entryCommand").textContent = selected.command;
  document.getElementById("entryInlineActionTitle").textContent = selected.action;
  document.getElementById("entryInlineCommand").textContent = selected.command;
}

function renderRoadmap() {
  document.getElementById("roadmapList").innerHTML = state.roadmap.map(function (item) {
    return '<div class="roadmap-item"><span>' + escapeHtml(item.horizon) + '</span><strong>' +
      escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.detail) + '</p></div>';
  }).join("");
}

function viewFromHash(hash) {
  if (hash === "#report-workbench") {
    return "reports";
  }
  if (hash === "#knowledge-demo") {
    return "docs";
  }
  if (hash === "#ownerDecisionQueue") {
    return "decisions";
  }
  return "tasks";
}

function hashForWorkbenchView(view) {
  if (view === "reports") {
    return "#report-workbench";
  }
  if (view === "docs") {
    return "#knowledge-demo";
  }
  if (view === "decisions") {
    return "#ownerDecisionQueue";
  }
  return "#next-workbench";
}

function renderWorkbenchView() {
  const panels = document.querySelectorAll("[data-workbench-panel]");
  panels.forEach(function (panel) {
    panel.hidden = panel.dataset.workbenchPanel !== selectedWorkbenchView;
  });
  document.querySelectorAll("[data-workbench-view]").forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.workbenchView === selectedWorkbenchView));
  });
}

function bindWorkbenchViewSwitch() {
  document.querySelectorAll("[data-workbench-view]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedWorkbenchView = button.dataset.workbenchView;
      renderWorkbenchView();
      const targetHash = hashForWorkbenchView(selectedWorkbenchView);
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, "", targetHash);
      }
      const target = document.getElementById(targetHash.slice(1));
      if (target) {
        target.scrollIntoView({ block: "start" });
      }
    });
  });
  window.addEventListener("hashchange", function () {
    selectedWorkbenchView = viewFromHash(window.location.hash);
    renderWorkbenchView();
  });
  window.addEventListener("popstate", function () {
    selectedWorkbenchView = viewFromHash(window.location.hash);
    renderWorkbenchView();
  });
}

function renderAll() {
  const card = state.cards.find(function (candidate) { return candidate.templateId === selectedTemplateId; }) || state.cards[0];
  renderProofStats();
  renderFeedbackTargets();
  renderSafetyBadges();
  renderReviewPrompts();
  renderModeCards();
  renderOperatingEntry();
  renderActivePlans();
  renderOwnerDecisionQueue();
  renderTemplates();
  renderEntryModes();
  renderReport(card);
  renderKnowledgeExamples();
  renderRoadmap();
  renderWorkbenchView();
}

renderAll();
bindWorkbenchViewSwitch();
`;
}

