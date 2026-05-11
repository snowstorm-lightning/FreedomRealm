import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(repoRoot, "packages");

async function collectTestFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectTestFiles(absolutePath);
      }
      return entry.isFile() && entry.name.endsWith(".test.mjs") ? [absolutePath] : [];
    })
  );

  return files.flat();
}

const testFiles = (await collectTestFiles(packagesDir)).sort();

if (testFiles.length === 0) {
  console.warn("[test] No *.test.mjs files found under packages/.");
  process.exit(0);
}

const child = spawn(process.execPath, ["--test", ...testFiles], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: false
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[test] Node test runner terminated by ${signal}.`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
