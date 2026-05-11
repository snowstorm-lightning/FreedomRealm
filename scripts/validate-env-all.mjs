import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateEnvironmentConfig } from "../packages/policy/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envDir = path.join(repoRoot, "config", "environments");
const requiredEnvironments = ["dev", "ci", "staging", "prod"];

function formatIssue(issue) {
  return `${issue.code} at ${issue.path ?? "$"}: ${issue.message}`;
}

let hasFailure = false;
const discovered = new Map();

let entries;
try {
  entries = await readdir(envDir, { withFileTypes: true });
} catch (error) {
  console.error(`[env] Cannot read ${path.relative(repoRoot, envDir)}: ${error.message}`);
  process.exit(1);
}

const sampleFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sample.json"))
  .map((entry) => entry.name)
  .sort();

for (const fileName of sampleFiles) {
  const filePath = path.join(envDir, fileName);
  const relativePath = path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
  let config;

  try {
    config = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    hasFailure = true;
    console.error(`[env] FAIL ${relativePath}`);
    console.error(`  invalid_json: ${error.message}`);
    continue;
  }

  if (typeof config.env === "string") {
    const existing = discovered.get(config.env);
    if (existing) {
      hasFailure = true;
      console.error(`[env] FAIL ${relativePath}`);
      console.error(`  duplicate_environment: ${config.env} already defined by ${existing}`);
      continue;
    }
    discovered.set(config.env, relativePath);
  }

  const result = validateEnvironmentConfig(config);
  if (!result.ok) {
    hasFailure = true;
    console.error(`[env] FAIL ${relativePath}`);
    for (const error of result.errors) {
      console.error(`  ${formatIssue(error)}`);
    }
  } else {
    console.log(`[env] ok ${relativePath}`);
  }

  for (const warning of result.warnings ?? []) {
    console.warn(`[env] warn ${relativePath}: ${formatIssue(warning)}`);
  }
}

for (const envName of requiredEnvironments) {
  if (!discovered.has(envName)) {
    hasFailure = true;
    console.error(`[env] missing config/environments/${envName}.sample.json`);
  }
}

for (const envName of discovered.keys()) {
  if (!requiredEnvironments.includes(envName)) {
    hasFailure = true;
    console.error(`[env] unexpected environment sample: ${envName}`);
  }
}

process.exit(hasFailure ? 1 : 0);
