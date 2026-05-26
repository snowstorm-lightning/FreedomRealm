import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_KNOWLEDGE_QUERY,
  runKnowledgeDemo
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
    query: DEFAULT_KNOWLEDGE_QUERY,
    model: "mock",
    out: "dist/knowledge-demo",
    inputs: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--query") {
      options.query = readOptionValue(argv, index, "--query");
      index += 1;
    } else if (arg === "--model") {
      options.model = readOptionValue(argv, index, "--model");
      index += 1;
    } else if (arg === "--out") {
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

  if (!["mock", "live"].includes(options.model)) {
    throw new Error("--model must be mock or live.");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: pnpm knowledge:demo [--query "${DEFAULT_KNOWLEDGE_QUERY}"] [--model mock|live] [--input path] [--out dist/knowledge-demo]

Knowledge Demo writes JSON AnswerCard, DocChallengeDraft, and ExecutionReportCard outputs.
The default search mode is local-mock-semantic. It does not need embeddings, model keys, external connectors, or real HR data.
The live route is optional and falls back to mock unless FREEDOMREALM_LIVE_MODEL_ENABLED=true.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const execution = await runKnowledgeDemo({
    repoRoot,
    query: options.query,
    model: options.model,
    inputs: options.inputs.length > 0 ? options.inputs : undefined,
    outputDir: options.out
  });

  const knowledge = execution.reportCard.extensions["freedomrealm.knowledge"];
  const modelRoute = execution.reportCard.extensions["freedomrealm.demo"].modelRoute;
  console.log("[knowledge] ok");
  console.log(`[knowledge] query: ${knowledge.query}`);
  console.log(`[knowledge] AnswerCard: ${execution.output.answerCardRelativePath}`);
  console.log(`[knowledge] DocChallengeDraft: ${execution.output.docChallengeDraftRelativePath}`);
  console.log(`[knowledge] ExecutionReportCard: ${execution.output.jsonRelativePath}`);
  console.log(`[knowledge] Markdown render: ${execution.output.markdownRelativePath}`);
  console.log(`[knowledge] search mode: ${knowledge.searchMode}`);
  console.log(`[knowledge] model route: ${modelRoute.actual}${modelRoute.mock ? " (mock)" : ""}`);
}

main().catch((error) => {
  console.error(`[knowledge] FAIL ${error.message}`);
  process.exit(1);
});
