import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateProjectOperatingEntry } from "../packages/contracts/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = process.env.AI_HRMS_OPERATING_ENTRY_PATH ?? "config/project-operating-entry.json";

function toWorkspacePath(value) {
  return path.join(repoRoot, value);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(toWorkspacePath(relativePath), "utf8"));
}

async function pathExists(relativePath) {
  try {
    const target = path.resolve(repoRoot, relativePath);
    const relative = path.relative(repoRoot, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return false;
    }
    await stat(target);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function extractPnpmScript(command) {
  const parts = command.trim().split(/\s+/u);
  if (parts[0] !== "pnpm" || !parts[1]) {
    return null;
  }
  return parts[1];
}

function addIssue(collection, code, message, file = manifestPath) {
  collection.push({ code, message, file });
}

const errors = [];
const rootPackage = await readJson("package.json");
const rootScripts = rootPackage.scripts ?? {};
const entry = await readJson(manifestPath);

const validation = validateProjectOperatingEntry(entry);
for (const error of validation.errors) {
  addIssue(errors, error.code, `${error.path}: ${error.message}`);
}

const pathsToCheck = [
  entry.sourceDocPath,
  ...(entry.recommendedReadOrder ?? []),
  ...(entry.currentTasks ?? []).flatMap((task) => task.sourceRefs ?? [])
].filter(Boolean);

for (const relativePath of pathsToCheck) {
  if (!(await pathExists(relativePath))) {
    addIssue(errors, "missing_entry_path", `${relativePath} must exist in the workspace.`);
  }
}

const commands = [
  ...(entry.startupCommands ?? []),
  ...(entry.currentTasks ?? []).flatMap((task) => task.verificationCommands ?? [])
];

for (const command of commands) {
  const script = extractPnpmScript(command);
  if (!script || !(script in rootScripts)) {
    addIssue(errors, "unknown_pnpm_script", `${command} must reference a root package.json script.`);
  }
}

for (const error of errors) {
  console.error(`[operating-entry] FAIL ${error.file}: ${error.code}: ${error.message}`);
}

if (errors.length === 0) {
  console.log("[operating-entry] ok");
}

process.exit(errors.length === 0 ? 0 : 1);
