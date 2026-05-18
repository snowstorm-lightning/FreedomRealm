import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXECUTION_REPORT_CARD_SCHEMA_VERSION,
  validateExecutionReportCard
} from "../packages/contracts/src/index.mjs";
import { renderDeliveryReportHtml } from "../packages/demo/src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultInputs = ["dist/demo-mode", "dist/self-review", "dist/web/data"];

function resolveWorkspacePath(value, label) {
  const absolutePath = path.resolve(repoRoot, value);
  const relativePath = path.relative(repoRoot, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`${label} must stay inside the workspace: ${value}`);
  }
  return absolutePath;
}

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--") || value === "-h") {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    inputs: [],
    out: "dist/reports/delivery-report.html",
    title: "AI-HRMS Delivery Report",
    explicitInputs: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      options.explicitInputs = true;
      options.inputs.push(readOptionValue(argv, index, "--input"));
      index += 1;
    } else if (arg === "--out") {
      options.out = readOptionValue(argv, index, "--out");
      index += 1;
    } else if (arg === "--title") {
      options.title = readOptionValue(argv, index, "--title");
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.inputs.length === 0) {
    options.inputs = defaultInputs;
  }

  return options;
}

function printHelp() {
  console.log(`Usage: pnpm report:html [--input dir-or-json] [--out dist/reports/delivery-report.html] [--title text]

The HTML render is for delivery-level presentation only.
ExecutionReportCard JSON remains canonical, and Markdown remains the default per-run render.
Without --input, the default inputs are dist/demo-mode, dist/self-review, and dist/web/data.
When --input is provided, only the explicit input paths are collected and missing inputs fail.`);
}

async function collectJsonFiles(inputPath, { allowMissing }) {
  const absolutePath = resolveWorkspacePath(inputPath, "Input path");
  let entries;
  try {
    entries = await readdir(absolutePath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOTDIR" && inputPath.endsWith(".json")) {
      return [absolutePath];
    }
    if ((error.code === "ENOENT" || error.code === "ENOTDIR") && !allowMissing) {
      throw new Error(`Input path does not exist: ${inputPath}`);
    }
    if (error.code === "ENOENT" && inputPath.endsWith(".json")) {
      return [absolutePath];
    }
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      return inputPath.endsWith(".json") ? [absolutePath] : [];
    }
    throw error;
  }

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const child = path.join(absolutePath, entry.name);
      if (entry.isDirectory()) {
        return collectJsonFiles(path.relative(repoRoot, child), { allowMissing });
      }
      return entry.isFile() && entry.name.endsWith(".json") ? [child] : [];
    })
  );

  return nested.flat();
}

async function readReportCards(inputs, options) {
  const files = [...new Set((await Promise.all(inputs.map((input) => collectJsonFiles(input, options)))).flat())].sort();
  const cards = [];

  for (const file of files) {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    if (parsed.schemaVersion !== EXECUTION_REPORT_CARD_SCHEMA_VERSION) {
      continue;
    }
    const validation = validateExecutionReportCard(parsed);
    if (!validation.ok) {
      const relativePath = path.relative(repoRoot, file).split(path.sep).join("/");
      const details = validation.errors.map((error) => `${error.path}: ${error.code}`).join(", ");
      throw new Error(`${relativePath} is not a valid ExecutionReportCard: ${details}`);
    }
    cards.push(parsed);
  }

  return cards;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const reportCards = await readReportCards(options.inputs, { allowMissing: !options.explicitInputs });
  const html = renderDeliveryReportHtml({
    reportCards,
    title: options.title
  });
  const outputPath = resolveWorkspacePath(options.out, "Output path");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");

  console.log("[report:html] ok");
  console.log(`[report:html] Report cards: ${reportCards.length}`);
  console.log(`[report:html] HTML render: ${path.relative(repoRoot, outputPath).split(path.sep).join("/")}`);
}

main().catch((error) => {
  console.error(`[report:html] FAIL ${error.message}`);
  process.exit(1);
});
