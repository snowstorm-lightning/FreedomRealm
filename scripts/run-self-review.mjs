import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDefaultInputs, runDemoMode } from "../packages/demo/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateId = "project_self_review_and_decay_prevention";

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--") || value === "-h") {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    out: "dist/self-review",
    inputs: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") {
      options.out = readOptionValue(argv, index, "--out");
      index += 1;
    } else if (arg === "--input") {
      options.inputs.push(readOptionValue(argv, index, "--input"));
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.inputs.length === 0) {
    options.inputs = getDefaultInputs(templateId);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: pnpm self-review [--input path] [--out dist/self-review]

Self-review runs the project_self_review_and_decay_prevention template.
It writes a JSON ExecutionReportCard and Markdown render, but does not modify repository documents or code.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const execution = await runDemoMode({
    repoRoot,
    templateId,
    model: "mock",
    inputs: options.inputs,
    outputDir: options.out
  });

  console.log("[self-review] ok");
  console.log(`[self-review] JSON canonical source: ${execution.output.jsonRelativePath}`);
  console.log(`[self-review] Markdown render: ${execution.output.markdownRelativePath}`);
  console.log(
    `[self-review] candidate WorkItems: ${
      execution.reportCard.extensions["ai-hrms.selfReview"]?.candidateWorkItems?.length ?? 0
    }`
  );
  console.log("[self-review] repository files were not modified by this command");
}

main().catch((error) => {
  console.error(`[self-review] FAIL ${error.message}`);
  process.exit(1);
});
