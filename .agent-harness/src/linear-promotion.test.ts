import test from "node:test";
import assert from "node:assert/strict";
import { agentBlockedCommentBody, codexAuthStatus, githubAuthStatus, linearIssueLabelsInput, renderWorkflow, symphonyRunArgs, textFilesForValidation, verifyCreatedLinearIssue } from "./cli.js";

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

test("accepts GitHub CLI auth when GITHUB_TOKEN is not set", () => {
  assert.deepEqual(githubAuthStatus({}, () => ({ code: 0, output: "gh-token\n" })), {
    ok: true,
    source: "gh auth token",
    token: "gh-token",
  });
  assert.deepEqual(githubAuthStatus({ GITHUB_TOKEN: "ignored" }, () => ({ code: 0, output: "gh-token\n" })), {
    ok: true,
    source: "gh auth token",
    token: "gh-token",
  });
  assert.deepEqual(githubAuthStatus({}, () => ({ code: 1, output: "not logged in" })), {
    ok: false,
    source: "gh auth token",
  });
});

test("passes Symphony unattended guardrail acknowledgement flag", () => {
  assert.deepEqual(symphonyRunArgs("/tmp/workflow.md", "/tmp/logs", "4007"), [
    "/tmp/workflow.md",
    "--logs-root",
    "/tmp/logs",
    "--port",
    "4007",
    "--i-understand-that-this-will-be-running-without-the-usual-guardrails",
  ]);
});

test("formats blocked comments for failed runner startup", () => {
  assert.match(agentBlockedCommentBody({ command: "symphony run", exitCode: 1 }), /Agent runner exited before completing work/);
  assert.match(agentBlockedCommentBody({ command: "symphony run", exitCode: 1 }), /Command: `symphony run`/);
  assert.match(agentBlockedCommentBody({ command: "symphony run", exitCode: 1 }), /Exit code: `1`/);
});

test("generated Symphony workflow uses current Codex app-server policy values", () => {
  const workflow = renderWorkflow({
    LINEAR_PROJECT_SLUG: "example-project",
    GITHUB_REPO: "owner/repo",
    CODEX_MODEL: "gpt-5.5",
    AGENT_MAX_PARALLEL_RUNS: "1",
  });

  assert.match(workflow, /approval_policy:\s+never/);
  assert.doesNotMatch(workflow, /reject/);
  assert.match(workflow, /thread_sandbox:\s+workspace-write/);
  assert.match(workflow, /type:\s+workspaceWrite/);
});
