import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "LICENSE-CANDIDATES.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/template_contribution.yml",
  ".github/ISSUE_TEMPLATE/failure_case.yml"
];

const requiredContent = {
  "LICENSE-CANDIDATES.md": [/not legal advice/u, /AGPL-3\.0/u, /human|maintainer|community/u],
  "CONTRIBUTING.md": [/pnpm check/u, /ApprovalGate/u, /production data/iu, /secret/iu],
  "CODE_OF_CONDUCT.md": [/harassment/iu, /reporting/iu, /ApprovalGate/u],
  "SECURITY.md": [/Report a Vulnerability/u, /secret/iu, /production data/iu, /sensitive raw user data/iu],
  ".github/PULL_REQUEST_TEMPLATE.md": [/pnpm check/u, /git diff --check/u, /ApprovalGate/u, /data classification/u],
  ".github/ISSUE_TEMPLATE/bug_report.yml": [/production data/iu, /secret/iu, /Governance impact/u],
  ".github/ISSUE_TEMPLATE/feature_request.yml": [/not automatic assignments/u, /Governance boundaries/u],
  ".github/ISSUE_TEMPLATE/template_contribution.yml": [/Risk level/u, /Data classification/u, /Evaluation and failure coverage/u],
  ".github/ISSUE_TEMPLATE/failure_case.yml": [/Redaction notes/u, /reproducible/iu, /sensitive raw user data/iu]
};

const errors = [];

async function exists(relativePath) {
  try {
    await stat(path.join(repoRoot, relativePath));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

for (const relativePath of requiredFiles) {
  if (!(await exists(relativePath))) {
    errors.push(`${relativePath}: required open-source asset is missing`);
  }
}

for (const [relativePath, patterns] of Object.entries(requiredContent)) {
  if (!(await exists(relativePath))) {
    continue;
  }
  const content = await readFile(path.join(repoRoot, relativePath), "utf8");
  for (const pattern of patterns) {
    if (!pattern.test(content)) {
      errors.push(`${relativePath}: missing required boundary ${pattern}`);
    }
  }
}

const agentsPath = "AGENTS.md";
if (await exists(agentsPath)) {
  const lineCount = (await readFile(path.join(repoRoot, agentsPath), "utf8")).split(/\r?\n/u).length;
  if (lineCount > 100) {
    errors.push(`${agentsPath}: must stay at or below 100 lines; move details into docs/zh-CN/`);
  }
}

if (errors.length > 0) {
  console.error("[open-source] validation failed");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("[open-source] ok");
