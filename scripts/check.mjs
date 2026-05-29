import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  ["validate:workspace", ["scripts/validate-workspace.mjs"]],
  ["go", ["scripts/check-go.mjs"]],
  ["validate:env:all", ["scripts/validate-env-all.mjs"]],
  ["validate:open-source", ["scripts/validate-open-source-assets.mjs"]],
  ["validate:operating-entry", ["scripts/validate-operating-entry.mjs"]],
  ["validate:templates", ["scripts/validate-templates.mjs"]],
  ["test", ["scripts/run-tests.mjs"]]
];

for (const [name, args] of steps) {
  console.log(`[check] ${name}`);
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error(`[check] ${name} failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("[check] ok");
