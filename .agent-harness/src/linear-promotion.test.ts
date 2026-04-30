import test from "node:test";
import assert from "node:assert/strict";
import { codexAuthStatus, linearIssueLabelsInput, textFilesForValidation, verifyCreatedLinearIssue } from "./cli.js";

test("verifies promoted Linear issues are unarchived and in the target project", () => {
  const errors = verifyCreatedLinearIssue({
    id: "issue-id",
    identifier: "JAS-15",
    archivedAt: null,
    description: "## Source Idea\n\n## Idea Context\n\n## Notes For Agent",
    project: { id: "project-id", slugId: "de2afd8fca7c" },
    labels: { nodes: [{ name: "idea:operator-os-generated-disposable-software" }] },
  }, {
    projectId: "project-id",
    description: "## Source Idea\n\n## Idea Context\n\n## Notes For Agent",
    labels: ["idea:operator-os-generated-disposable-software"],
  });

  assert.deepEqual(errors, []);
});

test("rejects archived or hidden Linear promotion results", () => {
  const errors = verifyCreatedLinearIssue({
    id: "issue-id",
    identifier: "JAS-15",
    archivedAt: "2026-04-30T16:06:03.686Z",
    description: "## Source Idea\n\n## Notes For Agent",
    project: { id: "project-id", slugId: "wrong-project" },
  }, {
    projectId: "expected-project-id",
    description: "## Source Idea\n\n## Idea Context\n\n## Notes For Agent",
  });

  assert.match(errors.join("\n"), /issue is archived/);
  assert.match(errors.join("\n"), /project id is project-id/);
  assert.match(errors.join("\n"), /description is missing marker ## Idea Context/);
});

test("validation text scan ignores local secret files", () => {
  assert.equal(textFilesForValidation(".agent-harness/.env"), false);
  assert.equal(textFilesForValidation(".agent-harness/.env.local"), false);
  assert.equal(textFilesForValidation(".agent-harness/config/projects.local.json"), false);
  assert.equal(textFilesForValidation(".agent-harness/config/projects.private.json"), false);
  assert.equal(textFilesForValidation(".agent-harness/config/projects.example.json"), true);
});

test("passes issue label names to Linear create input", () => {
  assert.deepEqual(linearIssueLabelsInput(["idea:operator-os-generated-disposable-software"]), ["idea:operator-os-generated-disposable-software"]);
  assert.equal(linearIssueLabelsInput(undefined), undefined);
});

test("accepts Codex auth file as worker authentication", () => {
  assert.deepEqual(codexAuthStatus({}, () => true), {
    ok: true,
    source: "~/.codex/auth.json",
  });
  assert.deepEqual(codexAuthStatus({ CODEX_AUTH_FILE: "/tmp/codex-auth.json" }, (path: string) => path === "/tmp/codex-auth.json"), {
    ok: true,
    source: "/tmp/codex-auth.json",
  });
  assert.deepEqual(codexAuthStatus({ OPENAI_API_KEY: "set" }, () => false), {
    ok: false,
    source: "~/.codex/auth.json",
  });
});
