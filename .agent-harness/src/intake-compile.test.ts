import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..", "..");

test("compiled Linear issues include rich context and preserve multiline issue fields", () => {
  const outDir = mkdtempSync(join(tmpdir(), "intake-compile-"));
  try {
    const result = spawnSync("node", [
      ".agent-harness/dist/cli.js",
      "intake",
      "compile",
      ".agent-harness/docs/templates/idea-pack.template.md",
      "--out",
      outDir,
    ], {
      cwd: projectRoot,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const bundle = JSON.parse(readFileSync(join(outDir, "linear-issues.json"), "utf8")) as { issues: Array<{ title: string; description: string }> };
    assert.match(bundle.issues[0].title, /^\[example-ai-workspace 01\/02\] /);
    const description = bundle.issues[0].description;
    assert.match(description, /## Agent Execution Order/);
    assert.match(description, /Sequence: 01\/02/);
    assert.match(description, /## Idea Context/);
    assert.match(description, /### Core Workflows/);
    assert.match(description, /### Decisions/);
    assert.match(description, /### Deferred Ideas/);
    assert.match(description, /approval to completion/);
    assert.match(description, /their\nattention/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
