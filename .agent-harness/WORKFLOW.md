---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: "__LINEAR_PROJECT_SLUG__"
  active_states:
    - Ready for Agent
    - In Progress
    - Changes Requested
    - Ready to Merge
  terminal_states:
    - Done
    - Canceled
    - Duplicate
polling:
  interval_ms: 10000
workspace:
  root: $AGENT_WORKSPACE_ROOT
hooks:
  after_create: |
    git clone --depth 1 "git@github.com:__GITHUB_REPO__.git" .
agent:
  max_concurrent_agents: __AGENT_MAX_PARALLEL_RUNS__
  max_turns: 1
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="__CODEX_MODEL__"' --config model_reasoning_effort=high app-server
  approval_policy: __CODEX_APPROVAL_POLICY__
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
server:
  port: 4007
---

# Workflow

You are working on a Linear issue for a configured GitHub repository.

Issue context:

- Identifier: `{{ issue.identifier }}`
- Title: `{{ issue.title }}`
- Current status: `{{ issue.state }}`
- Labels: `{{ issue.labels }}`
- URL: `{{ issue.url }}`

Description:

{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

## Operating Model

Humans steer. Agents execute.

Linear supplies the work. GitHub stores the code. The base repo stores the
operating model.

## Required Reading

1. `AGENTS.md`
2. `.agent-harness/WORKFLOW.md`
3. `.agent-harness/ARCHITECTURE.md`
4. Target repository instructions.
5. The Linear issue acceptance criteria.

## Linear Issue Selection

Only work on issues in `Ready for Agent`, `In Progress`, `Changes Requested`,
or `Ready to Merge`.

Do not start work from `Backlog`, `Todo`, `Blocked`, `Done`, `Canceled`, or
`Duplicate`.

## Branch Naming

Use:

```text
agent/<linear-issue-id>-short-description
```

## Plan Before Editing

Before editing code:

1. Inspect the target repo.
2. Confirm the issue scope.
3. Create or update an execution plan when the work is non-trivial.
4. Identify the verification command.

## Implementation

Keep changes small and directly tied to the Linear issue.

Do not perform product work in the base repo unless the issue is explicitly
about the base harness.

## Verification

Run the issue or plan verification command. If verification cannot run, record
the exact blocker.

## Trust And Safety

This public template uses Symphony and Codex safer defaults unless a target
project explicitly documents a higher-trust local policy.

Do not relax approvals, sandboxing, or external write permissions unless the
project runbook explains why that is acceptable.

## Proof Of Work

Every run must produce proof of work using the structure in
`.agent-harness/docs/templates/proof-of-work.template.md`.

Include:

- Linear issue.
- GitHub repo.
- Branch.
- PR link.
- Summary.
- Files changed.
- Commands run.
- Test results.
- Risks.
- Rollback notes.

## Pull Requests

The parent `.agent-harness` CLI owns branch creation, commits, pull request
creation, and Linear state transitions after the worker exits. The Codex worker
must not create branches, push, open pull requests, merge, or move Linear issues.

The parent CLI uses this PR title format:

```text
[Linear issue id] Short description
```

When implementation and verification are complete, leave the workspace changes
in place and stop. The parent CLI will publish the workspace from the verified
host environment and move Linear to `Ready to Merge`. If `AGENT_AUTO_MERGE=true`
is configured, the parent CLI may then merge the clean PR and move Linear to
`Done` after GitHub confirms the PR is open, not draft, mergeable, clean,
successfully checked, and not blocked by review.

## Linear Updates

The parent CLI owns this lifecycle:

- `Ready for Agent` -> `In Progress`
- `Changes Requested` -> `In Progress`
- `In Progress` -> `Ready to Merge`
- `Ready to Merge` -> `Done` when safe auto-merge is enabled and succeeds

If blocked, move to `Blocked` and explain the blocker.

## Never Do

Never:

- Commit secrets.
- Modify unrelated projects.
- Start product work without a Linear issue.
- Run destructive external actions without explicit approval.
- Merge without passing verification and recording proof of work.
- Hide failed verification.
