import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

test("doctor can identify pnpm from npm_config_user_agent when pnpm is not on PATH", () => {
  const result = spawnSync(process.execPath, ["scripts/doctor.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: "",
      Path: "",
      npm_config_user_agent: "pnpm/10.0.0 npm/? node/v24.0.0 win32 x64"
    },
    shell: false
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /pnpm 10\.0\.0 from npm_config_user_agent/u);
  assert.match(result.stdout, /doctor completed without blocking issues/u);
});
