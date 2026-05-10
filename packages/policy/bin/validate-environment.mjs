#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateEnvironmentConfig } from "../src/index.mjs";

const target = process.argv[2];

if (!target) {
  console.error("Usage: node packages/policy/bin/validate-environment.mjs <config.json>");
  process.exit(2);
}

try {
  const file = resolve(process.cwd(), target);
  const config = JSON.parse(await readFile(file, "utf8"));
  const result = validateEnvironmentConfig(config);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    errors: [
      {
        code: "validation_failed",
        message: error.message,
        path: target
      }
    ],
    warnings: []
  }, null, 2));
  process.exit(1);
}
