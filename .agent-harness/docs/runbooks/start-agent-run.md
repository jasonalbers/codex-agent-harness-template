# Start Agent Run

1. Confirm the Linear issue is `Ready for Agent`.
2. Confirm project config is agent-enabled.
3. Run:

```bash
node .agent-harness/dist/cli.js agent start --project example-app --dry-run
```

4. Review the planned workspace, branch, repo, and issue.
5. Disable dry-run only after credentials and workflow are verified:

```bash
AGENT_DRY_RUN=false node .agent-harness/dist/cli.js agent start --project example-app
```

Live `agent start` is the explicit trusted local runner entry point. After the
readiness checks pass, it supplies Symphony's required unattended guardrail
acknowledgement flag to the pinned upstream binary.

## Ordered Ready Issues

If multiple promoted issues are set to `Ready for Agent`, `agent start` keeps
the lowest `Agent Execution Order` issue ready and moves later ready issues back
to `Todo` before starting the runner.

Use a different hold state when needed:

```bash
AGENT_DRY_RUN=false node .agent-harness/dist/cli.js agent start --project example-app --hold-state "Needs Human Review"
```
