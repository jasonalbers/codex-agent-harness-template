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
