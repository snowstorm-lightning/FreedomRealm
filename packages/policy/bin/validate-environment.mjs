#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path, { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateEnvironmentConfig } from "../src/index.mjs";

const target = process.argv[2];
const repoRoot = resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

if (!target) {
  console.error("Usage: node packages/policy/bin/validate-environment.mjs <config.json>");
  process.exit(2);
}

function resolveWorkspacePath(value) {
  const file = resolve(process.cwd(), value);
  const relative = path.relative(repoRoot, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${value} must stay inside the workspace.`);
  }
  return file;
}

try {
  const file = resolveWorkspacePath(target);
  let config;
  try {
    config = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      error.code = "invalid_environment_json";
    }
    throw error;
  }
  const result = validateEnvironmentConfig(config);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    errors: [
      {
        code: error.code ?? "validation_failed",
        message: error.message,
        path: target
      }
    ],
    warnings: []
  }, null, 2));
  process.exit(1);
}
