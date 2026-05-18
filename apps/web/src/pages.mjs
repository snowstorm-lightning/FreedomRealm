export function buildLearningHtml() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI-HRMS Project Learning System / 项目学习系统</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main class="shell learning-shell">
      <header class="page-nav" aria-label="页面导航 / Page navigation">
        <a class="nav-brand" href="./index.html" aria-current="page">
          <span class="brand-mark" aria-hidden="true">AI</span>
          <strong>项目学习系统 / Project Learning</strong>
        </a>
        <nav class="nav-links">
          <a href="./index.html">学习首页 / Learning</a>
          <a href="./workbench.html">工作台 / Workbench</a>
          <a href="./workbench.html#tasks">当前任务 / Tasks</a>
          <a href="./workbench.html#docs">知识问答 / Docs Q&A</a>
        </nav>
      </header>

      <section class="learning-hero" aria-label="项目学习系统概览 / Project learning overview">
        <div class="learning-hero-copy">
          <p class="eyebrow">AI-HRMS 学习入口 / AI-HRMS learning entry</p>
          <h1>先理解项目结构，再进入治理工作台。 / Learn the project structure before entering the governed workbench.</h1>
          <p class="lead">这个首页把仓库入口、当前任务、Demo 闭环和治理边界拆成可点击学习路径；完整报告卡和密集信息保留在独立工作台页面。 / This page turns repo entry points, current tasks, the Demo loop, and governance boundaries into clickable learning paths; dense report-card detail stays on a separate workbench page.</p>
          <div class="hero-actions">
            <a class="primary-action" href="./workbench.html#tasks">查看当前任务 / View current tasks</a>
            <a class="secondary-action" href="./workbench.html#reports">进入报告卡 / Open report cards</a>
          </div>
        </div>
        <aside class="learning-status" aria-label="学习系统状态 / Learning system status">
          <span>默认首页 / Default page</span>
          <strong>项目学习系统 / Project Learning System</strong>
          <p>静态生成、mock 数据、无真实连接器、无模型 key、无生产数据。 / Static build, mock data, no real connector, no model key, no production data.</p>
        </aside>
      </section>

      <section class="learning-focus" aria-label="学习任务选择 / Learning task choices">
        <div class="section-heading">
          <p class="eyebrow">学习任务 / Learning Tasks</p>
          <h2>先选一个目标，只看当前需要的路径。 / Pick one goal first, then only read the path needed now.</h2>
        </div>
        <div class="learning-task-layout">
          <div class="learning-task-buttons" id="learningTaskButtons"></div>
          <article class="learning-task-detail" id="learningTaskDetail"></article>
        </div>
      </section>

      <section class="learning-reference" aria-label="按需展开的学习参考 / On-demand learning reference">
        <div class="section-heading">
          <p class="eyebrow">按需展开 / Open only when needed</p>
          <h2>结构、页面和报告卡入口默认收起，避免一开始就堆满信息。 / Structure, page, and report-card references stay collapsed by default.</h2>
        </div>
        <details class="learning-disclosure">
          <summary>项目结构地图 / Project Map</summary>
          <p>从入口文档到校验门禁的五层地图。 / Five layers from entry docs to quality gates.</p>
          <div class="structure-map" id="projectStructureMap"></div>
        </details>
        <details class="learning-disclosure">
          <summary>页面拆分与导航 / Page Split and Navigation</summary>
          <p>首页只教你怎么理解项目；重信息放到专门页面。 / The home page teaches project understanding; dense details move to dedicated views.</p>
          <div class="page-card-grid" id="learningPages"></div>
        </details>
        <details class="learning-disclosure">
          <summary>运行快照与报告卡入口 / Operating Snapshot and Report Cards</summary>
          <section class="operating-snapshot" id="operatingSnapshot" aria-label="当前运行快照 / Current operating snapshot"></section>
          <div class="template-preview-grid" id="templatePreview"></div>
        </details>
      </section>
    </main>
    <script src="./learning.js"></script>
  </body>
</html>
`;
}

export function buildHtml(languageBoundaryNotice) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI-HRMS Workbench / AI-HRMS 工作台</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main class="shell">
      <header class="page-nav" aria-label="页面导航 / Page navigation">
        <a class="nav-brand" href="./index.html">
          <span class="brand-mark" aria-hidden="true">AI</span>
          <strong>项目学习系统 / Project Learning</strong>
        </a>
        <nav class="nav-links">
          <a href="./index.html">学习首页 / Learning</a>
          <a href="./workbench.html" aria-current="page">工作台 / Workbench</a>
          <a href="#tasks">当前任务 / Tasks</a>
          <a href="#docs">知识问答 / Docs Q&A</a>
        </nav>
      </header>

      <section class="hero" id="overview" aria-label="工作台概览 / Workbench overview">
        <div class="topbar">
          <div class="brand-lockup">
            <span class="brand-mark" aria-hidden="true">FR</span>
            <div>
              <p class="eyebrow">FreedomRealm / AI-HRMS</p>
              <strong>治理工作台 / Governed workbench</strong>
            </div>
          </div>
          <div class="topbar-actions" aria-label="运行状态 / Runtime status">
            <span>演示档位 / Demo Mode</span>
            <span>Mock 路由 / Mock route</span>
            <span>JSON 事实源 / JSON source</span>
            <span>跨平台 / OS-neutral</span>
          </div>
        </div>

        <div class="command-board">
          <div class="command-copy">
            <p class="eyebrow">下一步驾驶舱 / Next action cockpit</p>
            <h1>让 AI 协助工作可见、有边界、可复核。 / Make AI-assisted work visible, bounded, and reviewable.</h1>
            <p class="lead">选择入口、查看治理模板，并复核 canonical JSON 报告卡；无需连接模型、账号、连接器或生产数据。 / Pick an entry path, inspect a governed template, and review the canonical JSON report card without connecting a model, account, connector, or production data.</p>
            <p class="language-note">${languageBoundaryNotice}</p>
          </div>
          <div class="hero-status" aria-label="MVP 状态 / MVP status">
            <span>运行契约 / Runtime contract</span>
            <strong>无实时副作用 / No live side effects</strong>
            <small>无模型 key、连接器、HR 数据、外部写入或隐藏训练资源。 / No model key, connector, HR data, external write, or hidden training resource.</small>
            <div class="safety-badges" id="safetyBadges" aria-label="演示安全边界 / Demo safety boundaries"></div>
          </div>
          <div class="feedback-targets" id="feedbackTargets" aria-label="首屏反馈目标 / First-screen feedback targets"></div>
          <div class="proof-stats" id="proofStats" aria-label="MVP 凭证目标 / MVP proof targets"></div>
          <div class="flow-map" aria-label="治理执行流 / Governed execution flow">
            <span>工作单元 / WorkItem</span>
            <span>智能体 / AgentActor</span>
            <span>工具契约 / ToolContract</span>
            <span>审批闸门 / ApprovalGate</span>
            <span>观测记录 / Observation</span>
            <span>报告卡 / ReportCard</span>
          </div>
        </div>
      </section>

      <section class="workbench-view-switch" aria-label="工作台视图切换 / Workbench view switch">
        <div>
          <p class="eyebrow">视图切换 / View Switch</p>
          <h2>一次只看一个任务视图 / Show one task view at a time</h2>
        </div>
        <div class="view-actions">
          <button type="button" id="tasks" data-workbench-view="tasks" aria-pressed="true">当前任务 / Tasks</button>
          <button type="button" id="reports" data-workbench-view="reports" aria-pressed="false">报告卡 / Report Cards</button>
          <button type="button" id="docs" data-workbench-view="docs" aria-pressed="false">知识问答 / Docs Q&A</button>
          <button type="button" id="decisions" data-workbench-view="decisions" aria-pressed="false">Owner 决策 / Owner Decisions</button>
        </div>
      </section>

      <section class="entry-strip" data-workbench-panel="tasks" aria-label="入口模式 / Entry modes">
        <div class="entry-copy">
          <h2>选择开始方式 / Choose how to start</h2>
          <p id="entryNote">从任务目标开始，选择治理模板，生成可复核工作凭证。 / Start from a task goal, select a governed template, and generate a reviewable work proof.</p>
          <div class="entry-recommendation" aria-label="当前入口建议 / Current entry recommendation">
            <span>推荐下一步 / Recommended Next Action</span>
            <strong id="entryInlineActionTitle">起草有边界的 WorkItem / Draft a bounded WorkItem</strong>
            <code id="entryInlineCommand">pnpm demo -- --template repo_understanding_and_work_plan</code>
          </div>
        </div>
        <div class="entry-actions" id="entryModes"></div>
      </section>

      <section class="review-prompts" data-workbench-panel="decisions" aria-label="修改意见入口 / Review prompts">
        <div class="section-heading">
          <p class="eyebrow">修改意见入口 / Review Prompts</p>
          <h2>让反馈直接落在定位、治理、下一步和页面负担上 / Keep feedback focused on positioning, governance, next actions, and visual load</h2>
        </div>
        <div class="review-prompt-grid" id="reviewPrompts"></div>
      </section>

      <section class="mode-fit" data-workbench-panel="decisions" aria-label="运行档位适配 / Running mode fit">
        <div class="section-heading">
          <p class="eyebrow">运行档位 / Running Modes</p>
          <h2>从 Windows 个人试用到强治理组织，档位变了，治理不降级。 / From Windows personal trials to strong-governance organizations, modes change but governance does not downgrade.</h2>
        </div>
        <div class="mode-grid" id="modeCards"></div>
      </section>

      <section class="decision-strip" data-workbench-panel="tasks" aria-label="推荐下一步 / Recommended next action">
        <div>
          <p class="eyebrow">推荐下一步 / Recommended Next Action</p>
          <h2 id="entryActionTitle">起草有边界的 WorkItem / Draft a bounded WorkItem</h2>
          <p id="entryActionDetail">从任务目标开始，选择治理模板，生成可复核工作凭证。 / Start from a task goal, select a governed template, and generate a reviewable work proof.</p>
        </div>
        <div class="command-tile">
          <span>本地命令 / Local command</span>
          <code id="entryCommand">pnpm demo -- --template repo_understanding_and_work_plan</code>
        </div>
      </section>

      <section class="owner-decisions" id="ownerDecisionQueue" data-workbench-panel="decisions" aria-label="需要 owner 决策 / Owner decision queue"></section>

      <section class="next-workbench" id="next-workbench" data-workbench-panel="tasks" aria-label="下一步工作台 / Next Workbench">
        <div class="section-heading">
          <p class="eyebrow">下一步工作台 / Next Workbench</p>
          <h2>任务、租约、冲突防护与停止规则 / Tasks, leases, conflict guards, and stopping rules</h2>
        </div>
        <div class="next-grid">
          <article class="panel" id="operatingTasks"></article>
          <article class="panel" id="operatingGuards"></article>
          <article class="panel backlog-panel" id="decayBacklog"></article>
        </div>
        <div class="active-plan-strip" id="activePlans"></div>
      </section>

      <section class="workbench" id="report-workbench" data-workbench-panel="reports" aria-label="工作台 / Workbench">
        <aside class="template-rail" aria-label="模板列表 / Template list">
          <div class="section-heading">
            <p class="eyebrow">模板 / Templates</p>
            <h2>首批可用路径 / First usable paths</h2>
          </div>
          <div id="templateList" class="template-list"></div>
        </aside>

        <article class="report-surface" id="reportSurface" aria-label="执行报告卡预览 / Execution report card preview"></article>

        <aside class="right-rail" aria-label="执行细节 / Execution details">
          <section class="panel">
            <div class="section-heading">
              <p class="eyebrow">执行链 / Execution Chain</p>
              <h2>治理闭环 / Governed loop</h2>
            </div>
            <ol id="executionTrace" class="trace-list"></ol>
          </section>

          <section class="panel">
            <div class="section-heading">
              <p class="eyebrow">知识循环 / Knowledge Loop</p>
              <h2>下一段产品切片 / Next product slice</h2>
            </div>
            <div class="knowledge-box">
              <strong>AnswerCard</strong>
              <span>用维护文档的来源引用回答。 / Answer with source references from maintained docs.</span>
            </div>
            <div class="knowledge-box">
              <strong>DocChallenge</strong>
              <span>允许用户挑战具体来源点，再形成可复核工作项。 / Let users challenge a specific source point, then create a reviewable work item.</span>
            </div>
          </section>
        </aside>
      </section>

      <section class="knowledge-demo" id="knowledge-demo" data-workbench-panel="docs" aria-label="询问维护文档 / Ask maintained docs">
        <div class="section-heading">
          <p class="eyebrow">询问维护文档 / Ask Maintained Docs</p>
          <h2>有来源的回答与可复核挑战 / Source-backed answers and reviewable challenges</h2>
        </div>
        <div class="knowledge-layout">
          <div class="question-list" id="knowledgeQuestionList"></div>
          <article class="knowledge-answer" id="knowledgeAnswer"></article>
        </div>
      </section>

      <section class="roadmap" id="roadmap" data-workbench-panel="tasks" aria-label="路线图 / Roadmap">
        <div class="section-heading">
          <p class="eyebrow">执行计划 / Execution Plan</p>
          <h2>从可见 MVP 到长期系统 / From visible MVP to longer-term system</h2>
        </div>
        <div id="roadmapList" class="roadmap-list"></div>
      </section>
    </main>
    <script src="./app.js"></script>
  </body>
</html>
`;
}
