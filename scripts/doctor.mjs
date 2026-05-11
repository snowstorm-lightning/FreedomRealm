import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function commandName(baseName) {
  return process.platform === "win32" ? `${baseName}.cmd` : baseName;
}

function runNodeScript(scriptPath) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false
  });
}

function parseMajor(version) {
  return Number.parseInt(version.replace(/^v/u, "").split(".")[0], 10);
}

function parseNodeEngineRange(range) {
  return {
    minMajor: Number.parseInt(range.match(/>=\s*(\d+)/u)?.[1] ?? "24", 10),
    maxExclusiveMajor: range.match(/<\s*(\d+)/u)?.[1]
      ? Number.parseInt(range.match(/<\s*(\d+)/u)[1], 10)
      : null
  };
}

function printStatus(kind, message) {
  console.log(`[doctor] ${kind} ${message}`);
}

const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
let failed = false;

const nodeMajor = parseMajor(process.version);
const nodeEngine = packageJson.engines?.node ?? ">=24.0.0 <26.0.0";
const { minMajor, maxExclusiveMajor } = parseNodeEngineRange(nodeEngine);
if (nodeMajor >= minMajor && (maxExclusiveMajor === null || nodeMajor < maxExclusiveMajor)) {
  printStatus("ok", `node ${process.version}`);
} else {
  failed = true;
  printStatus("FAIL", `node ${process.version}; expected ${nodeEngine}`);
}

const packageManager = packageJson.packageManager ?? "pnpm@10.0.0";
const expectedPnpmVersion = packageManager.startsWith("pnpm@") ? packageManager.slice("pnpm@".length) : null;
const pnpmResult = spawnSync(commandName("pnpm"), ["--version"], {
  cwd: repoRoot,
  encoding: "utf8",
  shell: false
});

if (pnpmResult.error) {
  printStatus("warn", `pnpm is not available in PATH. Enable corepack or install ${packageManager}.`);
} else if (pnpmResult.status !== 0) {
  printStatus("warn", `pnpm --version failed: ${pnpmResult.stderr?.trim() ?? "unknown error"}`);
} else {
  const actualVersion = pnpmResult.stdout.trim();
  if (expectedPnpmVersion && actualVersion !== expectedPnpmVersion) {
    printStatus("warn", `pnpm ${actualVersion}; packageManager declares ${packageManager}.`);
  } else {
    printStatus("ok", `pnpm ${actualVersion}`);
  }
}

const hasDependencies =
  Object.keys(packageJson.dependencies ?? {}).length > 0 ||
  Object.keys(packageJson.devDependencies ?? {}).length > 0;
if (hasDependencies && !(await pathExists("pnpm-lock.yaml"))) {
  failed = true;
  printStatus("FAIL", "dependencies are declared but pnpm-lock.yaml is missing.");
} else if (!hasDependencies && !(await pathExists("pnpm-lock.yaml"))) {
  printStatus("warn", "pnpm-lock.yaml is absent; add it when the first external dependency is introduced.");
}

for (const [name, script] of [
  ["workspace", "scripts/validate-workspace.mjs"],
  ["environment samples", "scripts/validate-env-all.mjs"]
]) {
  printStatus("check", name);
  const result = runNodeScript(script);
  if (result.error || result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  printStatus("FAIL", "doctor found blocking issues.");
  process.exit(1);
}

printStatus("ok", "doctor completed without blocking issues.");
