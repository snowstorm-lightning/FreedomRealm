import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROJECT_OPERATING_ENTRY_SCHEMA_VERSION,
  validateProjectOperatingEntry
} from "../src/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function validEntry() {
  return {
    schemaVersion: PROJECT_OPERATING_ENTRY_SCHEMA_VERSION,
    sourceDocPath: "docs/zh-CN/project-operating-entry.md",
    recommendedReadOrder: [
      "AGENTS.md",
      "README.md",
      "ARCHITECTURE.md",
      "docs/zh-CN/README.md",
      "docs/zh-CN/project-operating-entry.md"
    ],
    startupCommands: ["pnpm self-review"],
    currentTasks: [
      {
        taskId: "p0-demo",
        priority: "P0",
        status: "implemented-in-repo",
        title: "Demo task",
        ownerActorTypes: ["AgentActor"],
        outputs: ["Manifest"],
        acceptanceCriteria: ["Validation passes"],
        verificationCommands: ["pnpm check"],
        riskLevel: "low",
        suggestedWriteSet: ["config/project-operating-entry.json"],
        sourceRefs: ["docs/zh-CN/project-operating-entry.md"],
        implementationRefs: ["abc1234"]
      }
    ],
    assignmentRules: {
      splitWhen: ["超过 30 到 60 分钟且需要 checkpoint"],
      defaultRules: ["一个任务只能有一个最终 owner"]
    },
    leaseTemplate: {
      requiredFields: [
        "goal",
        "nonGoals",
        "readSet",
        "writeSet",
        "allowedToolContracts",
        "forbiddenActions",
        "checkpoint",
        "verificationCommands",
        "deliverables",
        "rollbackPlan"
      ]
    },
    conflictRules: {
      defaultWriteSetPolicy: "non-overlapping",
      rules: ["并行 WorkShard 的 writeSet 默认不得重叠", "MergeGate 必须检查契约"]
    },
    continuationRules: {
      allowStopWhen: [
        "触发 ApprovalGate 或需要人工 owner 决策",
        "触发 dataClassification 限制",
        "到达 checkpoint 且已交付 ChangePacket"
      ],
      mustContinueWhen: ["测试失败且存在合理修复路径"],
      checkpointDeliverables: ["ChangePacket", "ExecutionReportCard"]
    },
    harnessPrinciples: ["仓库知识是 system of record"],
    extensions: {
      "ai-hrms.harness": {
        mockOnly: true
      }
    }
  };
}

test("validates ProjectOperatingEntry v1", () => {
  const result = validateProjectOperatingEntry(validEntry());
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
});

test("validates checked-in project operating entry manifest", async () => {
  const entry = JSON.parse(await readFile(path.join(repoRoot, "config/project-operating-entry.json"), "utf8"));
  const result = validateProjectOperatingEntry(entry);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
});

test("rejects project operating entry without schemaVersion", () => {
  const entry = validEntry();
  delete entry.schemaVersion;
  const result = validateProjectOperatingEntry(entry);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.path === "schemaVersion"), true);
});

test("rejects project operating entry without a P0 task", () => {
  const entry = validEntry();
  entry.currentTasks[0].priority = "P1";
  const result = validateProjectOperatingEntry(entry);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "missing_p0_task"), true);
});

test("rejects tasks without verification commands or writeSet", () => {
  const entry = validEntry();
  delete entry.currentTasks[0].verificationCommands;
  delete entry.currentTasks[0].suggestedWriteSet;
  const result = validateProjectOperatingEntry(entry);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.path === "currentTasks.0.verificationCommands"), true);
  assert.equal(result.errors.some((error) => error.path === "currentTasks.0.suggestedWriteSet"), true);
});

test("rejects implemented tasks without implementation refs", () => {
  const entry = validEntry();
  delete entry.currentTasks[0].implementationRefs;
  const result = validateProjectOperatingEntry(entry);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.path === "currentTasks.0.implementationRefs"), true);
});

test("rejects invalid task status", () => {
  const entry = validEntry();
  entry.currentTasks[0].status = "done";
  const result = validateProjectOperatingEntry(entry);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "invalid_task_status"), true);
});

test("rejects non-namespaced project operating entry extensions", () => {
  const entry = validEntry();
  entry.extensions.harness = {};
  const result = validateProjectOperatingEntry(entry);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "invalid_extension_namespace"), true);
});

test("rejects implemented backlog items that drift from formal task implementation refs", () => {
  const entry = validEntry();
  entry.extensions["ai-hrms.decayPreventionBacklog"] = {
    sourceReportPath: "dist/self-review/report-demo.json",
    humanApprovalRef: "human-approved-demo",
    promotionPolicy: "human_owner_review_required",
    autoCreateExternalIssues: false,
    items: [
      {
        candidateWorkItemId: "candidate-work-item-001",
        formalTaskId: "p0-demo",
        status: "implemented-in-repo",
        priority: "P0",
        riskLevel: "low",
        ownerActorTypes: ["AgentActor"],
        sourceFindingIds: ["finding-001"],
        sourceRecommendationIds: ["recommendation-001"],
        readSet: ["README.md"],
        writeSet: ["config/project-operating-entry.json"],
        verificationCommands: ["pnpm check"],
        implementationRefs: ["different-ref"]
      }
    ]
  };

  const result = validateProjectOperatingEntry(entry);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.code === "implementation_refs_drift"), true);
});

test("validate-operating-entry script rejects unknown pnpm scripts", async () => {
  const outputDir = path.join(repoRoot, "dist", "test-operating-entry");
  await mkdir(outputDir, { recursive: true });
  const invalidPath = path.join(outputDir, "invalid-operating-entry.json");
  const invalidEntry = validEntry();
  invalidEntry.startupCommands = ["pnpm missing:script"];
  await writeFile(invalidPath, JSON.stringify(invalidEntry, null, 2), "utf8");

  const result = spawnSync(process.execPath, ["scripts/validate-operating-entry.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      AI_HRMS_OPERATING_ENTRY_PATH: path.relative(repoRoot, invalidPath).split(path.sep).join("/")
    },
    shell: false
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown_pnpm_script/u);
});

test("validate-operating-entry script keeps override path inside the workspace", () => {
  const result = spawnSync(process.execPath, ["scripts/validate-operating-entry.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      AI_HRMS_OPERATING_ENTRY_PATH: "../outside-operating-entry.json"
    },
    shell: false
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /manifest_path_outside_workspace/u);
});
