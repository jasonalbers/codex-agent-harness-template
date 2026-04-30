# Start Agent Run

1. Confirm the Linear issue is `Ready for Agent`.
2. Confirm project config is agent-enabled.
3. Run:

```bash
node .agent-harness/dist/cli.js agent start --project example-app --dry-run
```

4. Review the planned workspace, repo, issue, and publish preflight result.
5. Disable dry-run only after credentials and workflow are verified:

```bash
AGENT_DRY_RUN=false node .agent-harness/dist/cli.js agent start --project example-app
```

Live `agent start` is the explicit trusted local runner entry point. After the
readiness checks pass, it supplies Symphony's required unattended guardrail
acknowledgement flag to the pinned upstream binary.

The dry run performs the same local publish-environment checks before a live
run claims work. It verifies `gh auth status`, target repo visibility, a
disposable clone under `AGENT_WORKSPACE_ROOT`, local branch creation, writable
`.git` metadata, and a `git push --dry-run` for the publish branch.
Relative `AGENT_WORKSPACE_ROOT` values are resolved from the repository root
before they are passed to Symphony.

Codex/Symphony only implements and verifies the issue inside the isolated
workspace. After the worker exits, the parent CLI publishes from the verified
host environment: it creates the branch, commits publishable changes, pushes,
opens the pull request, comments on Linear, and moves the issue to
`Ready to Merge`.

## Ordered Ready Issues

If multiple promoted issues are set to `Ready for Agent`, `agent start` keeps
the lowest `Agent Execution Order` issue ready and moves later ready issues back
to `Todo` before starting the runner. In live mode, it then claims the selected
issue by moving it to `In Progress`.

Use a different hold state when needed:

```bash
AGENT_DRY_RUN=false node .agent-harness/dist/cli.js agent start --project example-app --hold-state "Todo"
```

Use `AGENT_IN_PROGRESS_STATE` or `--in-progress-state` only if the Linear
workspace intentionally names the claim state differently. The template default
is `In Progress`.

If the runner exits before completing work and parent publish cannot recover a
completed workspace, the CLI moves the claimed issue to `Blocked` and adds a
comment with the failed command and exit code.

## Publish Existing Workspace

If a previous runner completed work but failed during publish, recover without
rerunning the worker:

```bash
node .agent-harness/dist/cli.js agent publish --project example-app --issue ABC-123 --dry-run
node .agent-harness/dist/cli.js agent publish --project example-app --issue ABC-123
```
