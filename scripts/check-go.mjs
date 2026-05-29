import { spawnSync } from "node:child_process";
import { mkdir, readdir, stat } from "node:fs/promises";
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

async function findGoApps() {
  const appsDir = path.join(repoRoot, "apps");
  const entries = await readdir(appsDir, { withFileTypes: true });
  const goApps = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const relativePath = path.join("apps", entry.name);
    if (await pathExists(path.join(relativePath, "go.mod"))) {
      goApps.push(relativePath);
    }
  }
  return goApps.sort();
}

async function goEnv() {
  const env = { ...process.env, GOTOOLCHAIN: "local" };
  if (process.platform === "win32") {
    const cacheDir = path.join(repoRoot, ".cache", "go-telemetry");
    await mkdir(cacheDir, { recursive: true });
    env.APPDATA = cacheDir;
    env.LOCALAPPDATA = cacheDir;
  }
  return env;
}

function runGo(appPath, args, env) {
  const result = spawnSync("go", args, {
    cwd: path.join(repoRoot, appPath),
    env,
    stdio: "inherit",
    shell: false
  });
  if (result.error) {
    console.error(`[go] FAIL ${appPath}: failed to start go: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const goApps = await findGoApps();
if (goApps.length === 0) {
  console.log("[go] skip: no Go apps found");
  process.exit(0);
}

const env = await goEnv();
for (const appPath of goApps) {
  console.log(`[go] test ${appPath}`);
  runGo(appPath, ["test", "./..."], env);
  console.log(`[go] vet ${appPath}`);
  runGo(appPath, ["vet", "./..."], env);
}

console.log("[go] ok");
