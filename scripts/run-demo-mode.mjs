import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_DEMO_TEMPLATE_ID,
  getDefaultInputs,
  runDemoMode
} from "../packages/demo/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--") || value === "-h") {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    template: DEFAULT_DEMO_TEMPLATE_ID,
    model: "mock",
    out: "dist/demo-mode",
    query: undefined,
    inputs: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--template") {
      options.template = readOptionValue(argv, index, "--template");
      index += 1;
    } else if (arg === "--model") {
      options.model = readOptionValue(argv, index, "--model");
      index += 1;
    } else if (arg === "--out") {
      options.out = readOptionValue(argv, index, "--out");
      index += 1;
    } else if (arg === "--query") {
      options.query = readOptionValue(argv, index, "--query");
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

  if (!["mock", "live"].includes(options.model)) {
    throw new Error("--model must be mock or live.");
  }

  if (options.inputs.length === 0) {
    options.inputs = getDefaultInputs(options.template);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: pnpm demo [--template ${DEFAULT_DEMO_TEMPLATE_ID}] [--model mock|live] [--query text] [--input path] [--out dist/demo-mode]

Demo Mode writes JSON ExecutionReportCard as the canonical source.
The default model route is mock. The live route is optional and falls back to mock unless FREEDOMREALM_LIVE_MODEL_ENABLED=true.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const execution = await runDemoMode({
    repoRoot,
    templateId: options.template,
    model: options.model,
    inputs: options.inputs,
    query: options.query,
    outputDir: options.out
  });

  const modelRoute = execution.reportCard.extensions["freedomrealm.demo"].modelRoute;
  console.log("[demo] ok");
  console.log(`[demo] JSON canonical source: ${execution.output.jsonRelativePath}`);
  console.log(`[demo] Markdown render: ${execution.output.markdownRelativePath}`);
  console.log(`[demo] model route: ${modelRoute.actual}${modelRoute.mock ? " (mock)" : ""}`);
  console.log(`[demo] approval status: ${execution.reportCard.approvalStatus}`);
}

main().catch((error) => {
  console.error(`[demo] FAIL ${error.message}`);
  process.exit(1);
});
