import test from "node:test";
import assert from "node:assert/strict";
import { classifyTemplatePath, planFileChange, normalizeTemplateRepo } from "./template-sync.js";

test("classifies owned, optional, protected, and product paths", () => {
  assert.equal(classifyTemplatePath("AGENTS.md", {}), "owned");
  assert.equal(classifyTemplatePath(".agent-harness/src/cli.ts", {}), "owned");
  assert.equal(classifyTemplatePath(".agent-harness/.env.example", {}), "owned");
  assert.equal(classifyTemplatePath(".agent-harness/.env.local", {}), "protected");
  assert.equal(classifyTemplatePath(".agent-harness/config/projects.example.json", {}), "owned");
  assert.equal(classifyTemplatePath(".agent-harness/config/projects.json", {}), "protected");
  assert.equal(classifyTemplatePath(".agent-harness/intake/inbox/idea.md", {}), "protected");
  assert.equal(classifyTemplatePath("README.md", {}), "optional");
  assert.equal(classifyTemplatePath("README.md", { includeReadme: true }), "owned");
  assert.equal(classifyTemplatePath(".gitignore", {}), "optional");
  assert.equal(classifyTemplatePath(".gitignore", { includeGitignore: true }), "owned");
  assert.equal(classifyTemplatePath("src/product.ts", {}), "excluded");
});

test("plans safe add, modify, delete, already-synced, and conflict outcomes", () => {
  assert.deepEqual(planFileChange("AGENTS.md", null, "new", null, { includeReadme: false, includeGitignore: false, force: false }), {
    path: "AGENTS.md",
    kind: "add",
    reason: "target missing and template added file",
  });

  assert.deepEqual(planFileChange("AGENTS.md", "old", "new", "old", { includeReadme: false, includeGitignore: false, force: false }), {
    path: "AGENTS.md",
    kind: "modify",
    reason: "target matches previous template content",
  });

  assert.deepEqual(planFileChange("AGENTS.md", "old", null, "old", { includeReadme: false, includeGitignore: false, force: false }), {
    path: "AGENTS.md",
    kind: "delete",
    reason: "target matches deleted template content",
  });

  assert.deepEqual(planFileChange("AGENTS.md", "old", "new", "new", { includeReadme: false, includeGitignore: false, force: false }), {
    path: "AGENTS.md",
    kind: "already-synced",
    reason: "target already matches latest template content",
  });

  assert.deepEqual(planFileChange("AGENTS.md", "old", "new", "local", { includeReadme: false, includeGitignore: false, force: false }), {
    path: "AGENTS.md",
    kind: "conflict",
    reason: "target differs from both previous and latest template content",
  });

  assert.deepEqual(planFileChange("AGENTS.md", "old", "new", "local", { includeReadme: false, includeGitignore: false, force: true }), {
    path: "AGENTS.md",
    kind: "modify",
    reason: "force enabled; target differs from both previous and latest template content",
  });
});

test("never plans protected paths and skips optional paths by default", () => {
  assert.deepEqual(planFileChange(".agent-harness/config/projects.json", "old", "new", "old", { includeReadme: false, includeGitignore: false, force: true }), {
    path: ".agent-harness/config/projects.json",
    kind: "protected",
    reason: "protected path is never synced",
  });

  assert.deepEqual(planFileChange("README.md", "old", "new", "old", { includeReadme: false, includeGitignore: false, force: true }), {
    path: "README.md",
    kind: "optional",
    reason: "optional path requires an include flag",
  });
});

test("normalizes owner/repo names but preserves git URLs", () => {
  assert.equal(normalizeTemplateRepo("owner/repo"), "https://github.com/owner/repo.git");
  assert.equal(normalizeTemplateRepo("https://github.com/owner/repo.git"), "https://github.com/owner/repo.git");
  assert.equal(normalizeTemplateRepo("git@github.com:owner/repo.git"), "git@github.com:owner/repo.git");
});
