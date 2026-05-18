export const css = `:root {
  color-scheme: light;
  --bg: #f6f8fb;
  --ink: #1f252e;
  --muted: #5f6977;
  --line: #d8dee8;
  --panel: #ffffff;
  --soft: #e9f7f5;
  --soft-2: #f3eefc;
  --accent: #0f766e;
  --accent-strong: #115e59;
  --indigo: #4338ca;
  --amber: #9a6700;
  --warn: #8a5a00;
  --shadow: 0 18px 45px rgba(31, 37, 46, 0.08);
}

* { box-sizing: border-box; }
html { max-width: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  max-width: 100%;
}
button, a { font: inherit; }
button, a, code, summary, .status-pill, .priority-pill, .template-badges span, .safety-badges span {
  overflow-wrap: anywhere;
}
[hidden] {
  display: none !important;
}
.shell {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 28px 24px 40px;
}
.learning-shell {
  max-width: 1240px;
}
.page-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 58px;
  margin: -28px -24px 18px;
  border-bottom: 1px solid var(--line);
  background: rgba(246, 248, 251, 0.94);
  padding: 10px 24px;
  backdrop-filter: blur(12px);
}
.nav-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  text-decoration: none;
}
.nav-brand strong {
  overflow-wrap: anywhere;
}
.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.nav-links a,
.hero-actions a,
.primary-action,
.secondary-action {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--ink);
  padding: 8px 12px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 740;
  line-height: 1.2;
}
.nav-links a[aria-current="page"],
.primary-action {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}
.secondary-action {
  color: var(--accent-strong);
}
.learning-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: stretch;
  padding: 8px 0 22px;
  border-bottom: 1px solid var(--line);
}
.learning-hero-copy,
.learning-status {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
  padding: 22px;
}
.learning-status {
  display: grid;
  align-content: start;
  gap: 8px;
  background: #fbfcfa;
}
.learning-status span {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.learning-status strong {
  font-size: 20px;
  line-height: 1.2;
}
.learning-status p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}
.learning-focus,
.learning-reference {
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}
.learning-disclosure {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  margin-top: 12px;
  padding: 0;
}
.learning-disclosure summary {
  cursor: pointer;
  min-height: 48px;
  padding: 14px 16px;
  color: var(--ink);
  font-weight: 780;
  line-height: 1.25;
}
.learning-disclosure > p {
  margin: 0;
  border-top: 1px solid var(--line);
  color: var(--muted);
  padding: 0 16px 14px;
  line-height: 1.45;
}
.learning-disclosure > div,
.learning-disclosure > section {
  margin: 0 16px 16px;
}
.learning-task-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 14px;
  margin-top: 14px;
}
.learning-task-buttons {
  display: grid;
  gap: 8px;
}
.learning-task-buttons button {
  min-height: 56px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--ink);
  padding: 12px;
  text-align: left;
  cursor: pointer;
}
.learning-task-buttons button[aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--soft);
  color: var(--accent-strong);
}
.learning-task-buttons strong,
.learning-task-buttons span {
  display: block;
}
.learning-task-buttons span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}
.learning-task-detail {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 18px;
}
.learning-task-detail p {
  color: var(--muted);
  line-height: 1.5;
}
.learning-task-detail ol {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
  padding-left: 22px;
  color: var(--muted);
  line-height: 1.45;
}
.structure-map,
.page-card-grid,
.template-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.structure-card,
.page-card,
.snapshot-card,
.template-preview-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 16px;
}
.structure-card {
  display: grid;
  gap: 8px;
}
.structure-card span,
.page-card span,
.snapshot-card span,
.template-preview-card span {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.structure-card strong,
.page-card strong,
.snapshot-card strong,
.template-preview-card strong {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.structure-card p,
.page-card p,
.snapshot-card p,
.template-preview-card p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
.structure-card ul {
  display: grid;
  gap: 5px;
  margin: 4px 0 0;
  padding-left: 18px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.35;
}
.structure-card a,
.page-card a,
.template-preview-card a,
.learning-task-detail a {
  display: inline-flex;
  width: fit-content;
  min-height: 34px;
  align-items: center;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--accent-strong);
  padding: 7px 10px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 740;
}
.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.workbench-view-switch {
  position: sticky;
  top: 58px;
  z-index: 9;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow);
  margin: 0 0 16px;
  padding: 12px;
  backdrop-filter: blur(12px);
}
.view-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.view-actions button {
  min-height: 36px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--ink);
  padding: 8px 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 740;
  line-height: 1.2;
}
.view-actions button[aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}
.hero {
  display: grid;
  gap: 16px;
  padding: 0 0 18px;
  border-bottom: 1px solid var(--line);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 54px;
}
.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-mark {
  display: inline-grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 8px;
  background: var(--ink);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}
.brand-lockup strong {
  display: block;
  font-size: 16px;
}
.topbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.topbar-actions span {
  min-height: 28px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--muted);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 730;
  line-height: 1.2;
}
.command-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
  align-items: stretch;
}
.command-copy {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 22px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  max-width: 900px;
  font-size: 36px;
  line-height: 1.08;
  font-weight: 780;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}
h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}
h3 {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.3;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}
.lead {
  margin: 14px 0 0;
  max-width: 820px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.55;
}
.language-note {
  margin: 12px 0 0;
  max-width: 820px;
  border-left: 3px solid var(--accent);
  padding-left: 10px;
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}
.hero-status, .panel, .template-rail, .report-surface {
  min-width: 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.hero-status {
  display: grid;
  gap: 7px;
  padding: 16px;
}
.hero-status span {
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 760;
}
.hero-status strong { font-size: 18px; }
.hero-status small { color: var(--muted); line-height: 1.45; }
.safety-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.safety-badges span {
  min-height: 24px;
  border: 1px solid rgba(15, 118, 110, 0.24);
  border-radius: 999px;
  background: var(--soft);
  color: var(--accent-strong);
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 760;
  line-height: 1.25;
}
.feedback-targets {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.feedback-target {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}
.feedback-target span {
  display: block;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
}
.feedback-target strong {
  display: block;
  margin-top: 5px;
  font-size: 14px;
}
.feedback-target p {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}
.proof-stats {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.proof-stat {
  min-width: 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 11px 12px;
}
.proof-stat span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 740;
}
.proof-stat strong {
  display: block;
  margin-top: 4px;
  color: var(--ink);
  font-size: 21px;
  line-height: 1.1;
  overflow-wrap: anywhere;
}
.proof-stat p {
  margin: 6px 0 0;
  color: var(--muted);
  line-height: 1.35;
  font-size: 12px;
}
.flow-map {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  align-items: stretch;
}
.flow-map span {
  min-height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 780;
  text-align: center;
  padding: 8px;
}
.entry-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.9fr);
  gap: 20px;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.entry-copy p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.5;
}
.entry-recommendation {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}
.entry-recommendation span {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.entry-recommendation strong {
  font-size: 15px;
  line-height: 1.25;
}
.entry-recommendation code {
  display: block;
  overflow-wrap: anywhere;
  border-radius: 6px;
  background: #f1f5f2;
  color: var(--ink);
  padding: 8px;
  line-height: 1.35;
  font-size: 12px;
}
.entry-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.entry-actions button, .template-button {
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}
.entry-actions button {
  display: grid;
  gap: 5px;
}
.entry-actions button small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}
.entry-actions button[aria-pressed="true"],
.template-button[aria-current="true"] {
  border-color: var(--accent);
  background: var(--soft);
  color: var(--accent-strong);
}
.review-prompts {
  display: grid;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.review-prompt-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.review-prompt-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
}
.review-prompt-card span {
  display: block;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.review-prompt-card strong {
  display: block;
  margin-top: 7px;
}
.review-prompt-card p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
.mode-fit {
  display: grid;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.mode-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.mode-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
}
.mode-card span {
  display: block;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
}
.mode-card strong {
  display: block;
  margin-top: 6px;
  overflow-wrap: anywhere;
}
.mode-card p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.42;
  font-size: 13px;
}
.decision-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.55fr);
  gap: 14px;
  align-items: stretch;
  padding: 16px 0 20px;
  border-bottom: 1px solid var(--line);
}
.owner-decisions {
  display: grid;
  grid-template-columns: 280px repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.decision-queue-intro,
.decision-queue-item {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
}
.decision-queue-intro {
  display: grid;
  gap: 8px;
  align-content: start;
}
.decision-queue-intro p,
.decision-queue-item p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}
.decision-queue-item {
  display: grid;
  gap: 8px;
}
.decision-queue-item header {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: start;
}
.decision-queue-item strong {
  overflow-wrap: anywhere;
}
.decision-queue-item code {
  display: block;
  overflow-wrap: anywhere;
  border-radius: 6px;
  background: #f1f5f2;
  color: var(--ink);
  padding: 8px;
  line-height: 1.35;
  font-size: 12px;
}
.decision-strip > div,
.command-tile {
  min-width: 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}
.decision-strip p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
.command-tile {
  display: grid;
  align-content: center;
  gap: 8px;
}
.command-tile span {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.command-tile code {
  display: block;
  overflow-wrap: anywhere;
  border-radius: 6px;
  background: #f1f5f2;
  color: var(--ink);
  padding: 10px;
  line-height: 1.4;
}
.next-workbench {
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}
.next-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.85fr) minmax(280px, 0.75fr);
  gap: 14px;
  margin-top: 14px;
}
.task-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin-top: 12px;
}
.task-lane,
.task-card,
.task-meta,
.task-meta ul,
.task-meta li {
  min-width: 0;
}
.active-task {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfa;
  padding: 12px;
  margin-top: 12px;
}
.active-task span {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.active-task p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip-row span {
  min-height: 24px;
  border-radius: 999px;
  background: var(--soft);
  color: var(--accent-strong);
  padding: 4px 8px;
  text-transform: none;
}
.task-card {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.task-card header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: start;
  justify-content: space-between;
}
.task-card header strong,
.backlog-item header strong,
.plan-card header strong,
.decision-queue-item strong {
  min-width: 0;
}
.priority-pill {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  border-radius: 999px;
  background: var(--soft-2);
  color: var(--amber);
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 760;
  white-space: nowrap;
}
.task-card p,
.guard-block p {
  margin: 6px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
.task-meta {
  display: grid;
  gap: 6px;
  margin-top: 9px;
  color: var(--muted);
}
.task-meta span {
  color: var(--ink);
  font-size: 12px;
  font-weight: 760;
}
.task-meta ul {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-left: 18px;
  line-height: 1.35;
}
.task-origin {
  margin-top: 9px;
  border-left: 3px solid var(--accent);
  padding-left: 10px;
  color: var(--muted);
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.task-origin strong {
  display: block;
  color: var(--ink);
  font-size: 12px;
}
.backlog-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 12px;
}
.backlog-panel > *,
.backlog-list,
.backlog-item,
.backlog-summary {
  min-width: 0;
}
.backlog-summary {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfa;
  padding: 12px;
}
.backlog-summary strong {
  font-size: 16px;
}
.backlog-summary p,
.backlog-item p,
.backlog-note {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}
.backlog-list {
  display: grid;
  gap: 10px;
}
.backlog-item {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.backlog-item header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: start;
  justify-content: space-between;
}
.backlog-item strong {
  overflow-wrap: anywhere;
}
.status-pill.compact {
  min-height: 24px;
  padding: 3px 8px;
  font-size: 12px;
  white-space: nowrap;
}
.backlog-meta {
  display: grid;
  gap: 5px;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.35;
}
.backlog-meta span {
  overflow-wrap: anywhere;
}
.guard-block p,
.backlog-summary p,
.backlog-summary strong,
.task-card p,
.lease-preview dd {
  overflow-wrap: anywhere;
}
.active-plan-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.plan-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
}
.plan-card header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: start;
  justify-content: space-between;
}
.plan-card strong {
  overflow-wrap: anywhere;
}
.plan-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.4;
}
.plan-card ul {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.35;
}
.plan-card a {
  color: var(--accent-strong);
  font-weight: 760;
  text-decoration: none;
}
.plan-warning {
  border-left: 3px solid var(--amber);
  padding-left: 9px;
  color: var(--warn);
  font-size: 13px;
}
.guard-block ul {
  display: grid;
  gap: 6px;
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.4;
}
.risk-note {
  color: var(--warn);
  font-weight: 700;
}
.guard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.lease-preview {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfa;
  padding: 12px;
  margin-top: 12px;
}
.lease-preview dl {
  display: grid;
  gap: 8px;
  margin: 10px 0 0;
}
.lease-preview div {
  min-width: 0;
}
.lease-preview dt {
  color: var(--muted);
  font-size: 12px;
}
.lease-preview dd {
  margin: 3px 0 0;
  overflow-wrap: anywhere;
  line-height: 1.35;
}
.guard-block {
  min-width: 0;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.workbench {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
  padding-top: 20px;
}
.template-rail, .report-surface, .panel {
  padding: 18px;
}
.template-rail, .report-surface {
  box-shadow: var(--shadow);
}
.template-list {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}
.template-button {
  display: grid;
  gap: 6px;
}
.template-button strong {
  font-size: 14px;
  line-height: 1.25;
}
.template-button span {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.35;
}
.template-proof {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}
.template-proof b {
  color: var(--ink);
}
.template-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.template-badges span {
  min-height: 22px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #f8fafc;
  color: var(--muted);
  padding: 3px 7px;
  font-size: 11px;
  font-weight: 720;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.template-button[aria-current="true"] .template-badges span {
  border-color: rgba(15, 118, 110, 0.28);
  background: #ffffff;
  color: var(--accent-strong);
}
.report-header {
  display: grid;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.report-title-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: start;
}
.report-title-row h2 {
  font-size: 26px;
  line-height: 1.2;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  padding: 5px 10px;
  background: var(--soft);
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 760;
  white-space: nowrap;
}
.mock-note {
  margin: 0;
  color: var(--warn);
  line-height: 1.45;
}
.language-boundary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 14px 0 0;
}
.language-boundary article {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fbfcfa;
  padding: 10px;
}
.language-boundary span {
  display: block;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
}
.language-boundary p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
}
.report-digest {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfa;
}
.report-digest div {
  min-width: 0;
}
.report-digest span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 730;
}
.report-digest strong {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.report-digest p {
  margin: 0;
  color: var(--warn);
  line-height: 1.45;
}
.evidence-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
}
.evidence-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}
.evidence-card span {
  display: block;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.evidence-card strong {
  display: block;
  margin-top: 6px;
  overflow-wrap: anywhere;
}
.evidence-card p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}
.decision-checkpoint {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
  border: 1px solid #d8c37a;
  border-radius: 8px;
  background: #fff8e1;
  padding: 12px;
}
.decision-checkpoint header {
  grid-column: 1 / -1;
}
.decision-checkpoint header p {
  margin: 6px 0 0;
  color: var(--warn);
  line-height: 1.45;
}
.decision-checkpoint article {
  min-width: 0;
  border: 1px solid #ecdca7;
  border-radius: 6px;
  background: #fffdf5;
  padding: 10px;
}
.decision-checkpoint span {
  display: block;
  color: var(--warn);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.decision-checkpoint strong {
  display: block;
  margin-top: 5px;
  overflow-wrap: anywhere;
}
.decision-checkpoint p {
  margin: 7px 0 0;
  color: #6b5414;
  font-size: 13px;
  line-height: 1.45;
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0;
}
.meta-grid div {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 10px;
  background: #fbfcfa;
}
.meta-grid dt {
  color: var(--muted);
  font-size: 12px;
}
.meta-grid dd {
  margin: 5px 0 0;
  font-size: 13px;
  font-weight: 760;
  overflow-wrap: anywhere;
}
.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.report-grid > section,
.stack-list,
.stack-list li,
.stack-list strong,
.stack-list span {
  min-width: 0;
}
.wide { grid-column: 1 / -1; }
.stack-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.stack-list li {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.stack-list strong {
  display: block;
  margin-bottom: 4px;
}
.stack-list span {
  display: block;
  color: var(--muted);
  line-height: 1.45;
}
.stack-list,
.stack-list * {
  overflow-wrap: anywhere;
}
.data-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.data-links a {
  min-height: 38px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--accent-strong);
  padding: 8px 12px;
  text-decoration: none;
  font-weight: 700;
}
.right-rail {
  display: grid;
  gap: 14px;
}
.trace-list {
  margin: 14px 0 0;
  padding-left: 22px;
}
.trace-list li {
  margin-bottom: 8px;
  color: var(--muted);
  line-height: 1.35;
}
.knowledge-box {
  display: grid;
  gap: 5px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
  margin-top: 10px;
}
.knowledge-box span {
  color: var(--muted);
  line-height: 1.45;
}
.roadmap {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.knowledge-demo {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.knowledge-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
  margin-top: 14px;
}
.question-list {
  display: grid;
  gap: 8px;
}
.question-list button {
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}
.question-list button[aria-current="true"] {
  border-color: var(--accent);
  background: var(--soft);
  color: var(--accent-strong);
}
.knowledge-answer {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
}
.source-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.source-list li {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.source-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.source-actions button, .source-actions a {
  min-height: 34px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: transparent;
  color: var(--accent-strong);
  padding: 6px 9px;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
}
.challenge-status {
  margin: 12px 0 0;
  color: var(--warn);
  line-height: 1.45;
}
.roadmap-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.roadmap-item {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}
.roadmap-item span {
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 760;
}
.roadmap-item strong {
  display: block;
  margin-top: 6px;
}
.roadmap-item p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}
@media (max-width: 1120px) {
  .learning-hero,
  .learning-task-layout,
  .workbench-view-switch {
    grid-template-columns: 1fr;
  }
  .structure-map,
  .page-card-grid,
  .template-preview-grid,
  .snapshot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .workbench {
    grid-template-columns: 260px minmax(0, 1fr);
  }
  .review-prompt-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mode-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .feedback-targets {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .owner-decisions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .active-plan-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .right-rail {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 840px) {
  .shell { padding: 24px 16px 32px; }
  .page-nav {
    align-items: stretch;
    display: grid;
    margin: -24px -16px 16px;
    padding: 10px 16px;
  }
  .nav-links {
    justify-content: start;
  }
  .structure-map,
  .page-card-grid,
  .template-preview-grid,
  .snapshot-grid {
    grid-template-columns: 1fr;
  }
  .command-board, .entry-strip, .feedback-targets, .review-prompt-grid, .mode-grid, .decision-strip, .owner-decisions, .next-grid, .active-plan-strip, .workbench, .right-rail, .knowledge-layout, .roadmap-list {
    grid-template-columns: 1fr;
  }
  h1 { font-size: 30px; }
  .entry-actions, .meta-grid, .report-grid, .report-digest, .guard-grid, .proof-stats, .flow-map {
    grid-template-columns: minmax(0, 1fr);
  }
  .evidence-strip {
    grid-template-columns: 1fr;
  }
  .language-boundary {
    grid-template-columns: 1fr;
  }
  .decision-checkpoint {
    grid-template-columns: 1fr;
  }
  .report-title-row {
    display: grid;
  }
}
`;

