import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDemoExecution,
  createKnowledgeDemoExecution,
  getDefaultInputs,
  writeDemoExecution
} from "../../../packages/demo/src/index.mjs";
import { buildJs, buildLearningJs } from "../src/client-scripts.mjs";
import { buildHtml, buildLearningHtml } from "../src/pages.mjs";
import { buildWebState, knowledgeQueries, readActivePlans, readOperatingEntry, templateIds } from "../src/demo-state.mjs";
import { css } from "../src/styles.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const webDist = path.join(repoRoot, "dist", "web");
const sampleOut = "dist/web/data";

await mkdir(webDist, { recursive: true });

const executions = [];
for (const templateId of templateIds) {
  const execution = await createDemoExecution({
    repoRoot,
    templateId,
    model: "mock",
    inputs: getDefaultInputs(templateId),
    outputDir: sampleOut
  });
  await writeDemoExecution(execution);
  executions.push(execution);
}

const knowledgeExecutions = [];
for (const query of knowledgeQueries) {
  const execution = await createKnowledgeDemoExecution({
    repoRoot,
    query,
    model: "mock",
    outputDir: sampleOut
  });
  await writeDemoExecution(execution);
  knowledgeExecutions.push(execution);
}

const operatingEntry = await readOperatingEntry(repoRoot);
const activePlans = await readActivePlans(repoRoot);
const state = buildWebState({ operatingEntry, activePlans, executions, knowledgeExecutions });

await writeFile(path.join(webDist, "index.html"), buildLearningHtml(), "utf8");
await writeFile(path.join(webDist, "workbench.html"), buildHtml(state.languageBoundaryNotice), "utf8");
await writeFile(path.join(webDist, "styles.css"), css, "utf8");
await writeFile(path.join(webDist, "app.js"), buildJs(state), "utf8");
await writeFile(path.join(webDist, "learning.js"), buildLearningJs(state), "utf8");

console.log("[web] ok");
console.log("[web] Learning system: dist/web/index.html");
console.log("[web] Workbench: dist/web/workbench.html");
for (const execution of executions) {
  console.log("[web] Sample report card: " + execution.output.jsonRelativePath);
}
for (const execution of knowledgeExecutions) {
  console.log("[web] Knowledge sample report card: " + execution.output.jsonRelativePath);
}
