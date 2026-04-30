import test from "node:test";
import assert from "node:assert/strict";
import { agentBlockedCommentBody, agentBranchName, codexAuthStatus, githubAuthStatus, linearIssueLabelsInput, patchSymphonyAppServerSource, patchSymphonyOrchestratorSource, publishPreflight, renderWorkflow, requiredLinearStateId, symphonyRunArgs, textFilesForValidation, verifyCreatedLinearIssue, verifyLinearStateTransitionResult } from "./cli.js";

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

test("accepts GitHub CLI auth without exporting a token", () => {
  assert.deepEqual(githubAuthStatus({}, () => ({ code: 0, output: "Logged in to github.com\n" })), {
    ok: true,
    source: "gh auth status",
  });
  assert.deepEqual(githubAuthStatus({ GITHUB_TOKEN: "ignored" }, () => ({ code: 0, output: "Logged in to github.com\n" })), {
    ok: true,
    source: "gh auth status",
  });
  assert.deepEqual(githubAuthStatus({}, () => ({ code: 1, output: "not logged in" })), {
    ok: false,
    source: "gh auth status",
  });
});

test("publish preflight reports setup blockers before claiming work", () => {
  assert.deepEqual(publishPreflight("owner/repo", ""), {
    ok: false,
    checked: [],
    blockers: ["AGENT_WORKSPACE_ROOT is not set"],
  });
  assert.deepEqual(publishPreflight("replace-with-owner/repo", "/tmp"), {
    ok: false,
    checked: [],
    blockers: ["project repo is missing or a placeholder"],
  });
});

test("formats parent-published agent branch names", () => {
  assert.equal(agentBranchName({
    id: "issue-id",
    identifier: "JAS-47",
    title: "Define Operator OS Wave 1 product boundary",
  }), "agent/jas-47-define-operator-os-wave-1-product-boundary");
});

test("verifies successful publish lifecycle state transition before logging success", () => {
  const errors = verifyLinearStateTransitionResult({
    success: true,
    mutationIssue: {
      id: "issue-id",
      identifier: "JAS-50",
      state: { id: "ready-state-id", name: "Ready to Merge" },
    },
    queryIssue: {
      id: "issue-id",
      identifier: "JAS-50",
      state: { id: "ready-state-id", name: "Ready to Merge" },
    },
  }, {
    issueId: "issue-id",
    stateId: "ready-state-id",
    stateName: "Ready to Merge",
  });

  assert.deepEqual(errors, []);
});

test("rejects Linear state update success when verification still sees the old state", () => {
  const errors = verifyLinearStateTransitionResult({
    success: true,
    mutationIssue: {
      id: "issue-id",
      identifier: "JAS-50",
      state: { id: "ready-state-id", name: "Ready to Merge" },
    },
    queryIssue: {
      id: "issue-id",
      identifier: "JAS-50",
      state: { id: "in-progress-state-id", name: "In Progress" },
    },
  }, {
    issueId: "issue-id",
    stateId: "ready-state-id",
    stateName: "Ready to Merge",
  });

  assert.match(errors.join("\n"), /verification query returned state In Progress/);
});

test("rejects Linear state update when mutation returns wrong issue or wrong state", () => {
  const errors = verifyLinearStateTransitionResult({
    success: false,
    mutationIssue: {
      id: "other-issue-id",
      identifier: "JAS-51",
      state: { id: "in-progress-state-id", name: "In Progress" },
    },
    queryIssue: {
      id: "issue-id",
      identifier: "JAS-50",
      state: { id: "in-progress-state-id", name: "In Progress" },
    },
  }, {
    issueId: "issue-id",
    stateId: "ready-state-id",
    stateName: "Ready to Merge",
  });

  assert.match(errors.join("\n"), /did not report success=true/);
  assert.match(errors.join("\n"), /returned issue id other-issue-id/);
  assert.match(errors.join("\n"), /returned state In Progress/);
});

test("reports a clear setup blocker when requested Linear state is missing", () => {
  assert.throws(
    () => requiredLinearStateId(new Map([["In Progress", "state-id"]]), "Ready to Merge"),
    /Linear state Ready to Merge was not found/,
  );
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
  assert.match(workflow, /max_turns:\s+1/);
  assert.doesNotMatch(workflow, /reject/);
  assert.match(workflow, /thread_sandbox:\s+workspace-write/);
  assert.match(workflow, /type:\s+workspaceWrite/);
  assert.match(workflow, /The parent `.agent-harness` CLI owns branch creation/);
});

test("patches Symphony app-server to decline unattended MCP elicitation requests", () => {
  const source = `defmodule SymphonyElixir.Codex.AppServer do
  defp maybe_handle_approval_request(
         _port,
         _method,
         _payload,
         _payload_string,
         _on_message,
         _metadata,
         _tool_executor,
         _auto_approve_requests
       ) do
    :unhandled
  end
end
`;

  const patched = patchSymphonyAppServerSource(source);
  assert.equal(patched.changed, true);
  assert.match(patched.text, /"mcpServer\/elicitation\/request"/);
  assert.match(patched.text, /"action" => "decline"/);
  assert.match(patched.text, /:tool_input_auto_answered/);

  const repatched = patchSymphonyAppServerSource(patched.text);
  assert.equal(repatched.changed, false);
  assert.equal(repatched.text, patched.text);
});

test("patches Symphony orchestrator to exit after one completed issue for parent publish", () => {
  const source = `defmodule SymphonyElixir.Orchestrator do
  def handle_info(
        {:DOWN, ref, :process, _pid, reason},
        %{running: running} = state
      ) do
    case find_issue_id_for_ref(running, ref) do
      issue_id ->
        state =
          case reason do
            :normal ->
              Logger.info("Agent task completed")

              state
              |> complete_issue(issue_id)
              |> schedule_issue_retry(issue_id, 1, %{
                identifier: running_entry.identifier,
                delay_type: :continuation
              })
          end

        {:noreply, state}
    end
  end

  defp last_activity_timestamp(running_entry) when is_map(running_entry) do
    Map.get(running_entry, :last_codex_timestamp)
  end
end
`;

  const patched = patchSymphonyOrchestratorSource(source);
  assert.equal(patched.changed, true);
  assert.match(patched.text, /SYMPHONY_AGENT_HARNESS_SINGLE_ISSUE/);
  assert.match(patched.text, /System\.halt\(0\)/);
  assert.match(patched.text, /maybe_halt_after_agent_harness_one_shot\(issue_id, session_id\)/);

  const repatched = patchSymphonyOrchestratorSource(patched.text);
  assert.equal(repatched.changed, false);
  assert.equal(repatched.text, patched.text);
});
