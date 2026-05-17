import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const allowedRootEntries = new Set([
  ".devcontainer",
  ".git",
  ".gitattributes",
  ".github",
  ".gitignore",
  ".idea",
  ".vscode",
  "AGENTS.md",
  "ARCHITECTURE.md",
  "README.md",
  "apps",
  "config",
  "docs",
  "infra",
  "package.json",
  "packages",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "scripts",
  "uv.lock"
]);

const ignoredRootEntries = new Set([
  "coverage",
  "dist",
  "node_modules",
  ".pnpm-store",
  ".turbo",
  ".cache"
]);

const shellSpecificScriptPattern =
  /(^|\s)(rm|cp|mv|sed|grep|awk|chmod|chown|bash|sh|powershell|cmd(?:\.exe)?)\b|(^|\s)(export|set)\s+[A-Za-z_][A-Za-z0-9_]*=/;

function toWorkspacePath(value) {
  return value.split("/").join(path.sep);
}

function normalizeWorkspacePath(value) {
  return value.replaceAll("\\", "/").replace(/\/+$/u, "");
}

function compareLists(left, right) {
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return (
    leftSorted.length === rightSorted.length &&
    leftSorted.every((value, index) => value === rightSorted[index])
  );
}

async function pathExists(relativePath) {
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

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

function parsePnpmWorkspace(text) {
  return text
    .split(/\r?\n/u)
    .map((line) => line.match(/^\s*-\s*["']?([^"']+)["']?\s*$/u)?.[1])
    .filter(Boolean)
    .map(normalizeWorkspacePath);
}

function addIssue(collection, code, message, file = "workspace") {
  collection.push({ code, message, file });
}

const errors = [];
const warnings = [];

const rootEntries = await readdir(repoRoot, { withFileTypes: true });
for (const entry of rootEntries) {
  if (ignoredRootEntries.has(entry.name)) {
    continue;
  }
  if (entry.name === ".env" || /^\.env\./u.test(entry.name)) {
    addIssue(errors, "root_secret_file", "Root .env files must not be committed; keep examples in documented sample files.", entry.name);
    continue;
  }
  if (/^(tmp|temp)[._-]?/iu.test(entry.name)) {
    addIssue(errors, "root_temp_file", "Temporary files must not live at repository root.", entry.name);
    continue;
  }
  if (!allowedRootEntries.has(entry.name)) {
    addIssue(
      warnings,
      "unregistered_root_entry",
      "Root entry is not in the documented current/future organization map.",
      entry.name
    );
  }
}

const rootPackage = await readJson("package.json");
const packageWorkspaces = (rootPackage.workspaces ?? []).map(normalizeWorkspacePath);

let pnpmWorkspaces = [];
if (await pathExists("pnpm-workspace.yaml")) {
  pnpmWorkspaces = parsePnpmWorkspace(await readFile(path.join(repoRoot, "pnpm-workspace.yaml"), "utf8"));
} else {
  addIssue(errors, "missing_pnpm_workspace", "pnpm-workspace.yaml is required for the monorepo workspace.", "pnpm-workspace.yaml");
}

if (!compareLists(packageWorkspaces, pnpmWorkspaces)) {
  addIssue(
    errors,
    "workspace_manifest_mismatch",
    "package.json workspaces and pnpm-workspace.yaml packages must list the same workspace paths.",
    "package.json"
  );
}

for (const workspacePath of packageWorkspaces) {
  const packageJsonPath = normalizeWorkspacePath(path.join(workspacePath, "package.json"));
  if (!(await pathExists(toWorkspacePath(packageJsonPath)))) {
    addIssue(errors, "missing_workspace_package", `Workspace ${workspacePath} must contain package.json.`, packageJsonPath);
  }
}

if (await pathExists("packages")) {
  const packageDirs = await readdir(path.join(repoRoot, "packages"), { withFileTypes: true });
  for (const entry of packageDirs) {
    if (!entry.isDirectory()) {
      continue;
    }
    const workspacePath = normalizeWorkspacePath(`packages/${entry.name}`);
    const packageJsonPath = path.join("packages", entry.name, "package.json");
    if (await pathExists(packageJsonPath)) {
      if (!packageWorkspaces.includes(workspacePath)) {
        addIssue(errors, "workspace_package_not_registered", `${workspacePath} has package.json but is not registered as a workspace.`, workspacePath);
      }
    } else {
      const cargoTomlPath = path.join("packages", entry.name, "Cargo.toml");
      if (await pathExists(cargoTomlPath)) {
        const readmePath = path.join("packages", entry.name, "README.md");
        const srcLibPath = path.join("packages", entry.name, "src", "lib.rs");
        if (!(await pathExists(readmePath))) {
          addIssue(errors, "rust_package_missing_readme", `${workspacePath} must contain README.md.`, workspacePath);
        }
        if (!(await pathExists(srcLibPath))) {
          addIssue(errors, "rust_package_missing_src", `${workspacePath} must contain src/lib.rs.`, workspacePath);
        }
      } else {
        addIssue(warnings, "package_without_manifest", `${workspacePath} exists without package.json or Cargo.toml.`, workspacePath);
      }
    }
  }
}

if (await pathExists("apps")) {
  const appDirs = await readdir(path.join(repoRoot, "apps"), { withFileTypes: true });
  for (const entry of appDirs) {
    if (!entry.isDirectory()) {
      continue;
    }
    const appPath = path.join("apps", entry.name);
    const hasReadme = await pathExists(path.join(appPath, "README.md"));
    const hasPackage = await pathExists(path.join(appPath, "package.json"));
    const hasPyproject = await pathExists(path.join(appPath, "pyproject.toml"));
    if (!hasReadme) {
      addIssue(errors, "app_missing_readme", `${normalizeWorkspacePath(appPath)} must explain its owner, runtime, and local commands.`, appPath);
    }
    if (!hasPackage && !hasPyproject) {
      addIssue(errors, "app_missing_runtime_manifest", `${normalizeWorkspacePath(appPath)} must declare package.json or pyproject.toml.`, appPath);
    }
  }
}

for (const [name, command] of Object.entries(rootPackage.scripts ?? {})) {
  if (shellSpecificScriptPattern.test(command)) {
    addIssue(
      errors,
      "os_specific_root_script",
      `Script "${name}" uses shell-specific command text; wrap it in a cross-platform Node script instead.`,
      "package.json"
    );
  }
}

if (Object.keys(rootPackage.dependencies ?? {}).length > 0 || Object.keys(rootPackage.devDependencies ?? {}).length > 0) {
  if (!(await pathExists("pnpm-lock.yaml"))) {
    addIssue(errors, "missing_lockfile", "Dependencies require pnpm-lock.yaml to keep installs reproducible.", "pnpm-lock.yaml");
  }
}

for (const warning of warnings) {
  console.warn(`[workspace] warn ${warning.file}: ${warning.code}: ${warning.message}`);
}

for (const error of errors) {
  console.error(`[workspace] FAIL ${error.file}: ${error.code}: ${error.message}`);
}

if (errors.length === 0) {
  console.log("[workspace] ok");
}

process.exit(errors.length === 0 ? 0 : 1);
