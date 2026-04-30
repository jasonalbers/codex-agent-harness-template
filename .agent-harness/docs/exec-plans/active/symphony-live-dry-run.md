# Symphony Live Dry Run Plan

## Goal

Prove the base harness against one disposable Linear issue before unattended
agent work is enabled.

## Prerequisites

- `LINEAR_API_KEY` set locally.
- `LINEAR_PROJECT_SLUG` set locally.
- Target GitHub repo selected from `.agent-harness/config/projects.json`.
- Linear statuses match `.agent-harness/docs/linear/linear-status-model.md`.

## Steps

- [ ] Create a disposable Linear issue that edits one harmless docs file.
- [ ] Run `node .agent-harness/dist/cli.js symphony preflight`.
- [ ] Run `node .agent-harness/dist/cli.js agent start --project <name> --dry-run`.
- [ ] Run `AGENT_DRY_RUN=false node .agent-harness/dist/cli.js agent start --project <name>` only after the dry run is clean.
- [ ] Confirm Symphony creates an isolated workspace.
- [ ] Confirm Codex creates a branch using `agent/<issue-id>-...`.
- [ ] Confirm a PR is opened with proof of work.
- [ ] Confirm no runtime files are committed.
- [ ] Confirm the issue can move through `In Progress`, `Ready to Merge`,
  `Done`, and `Blocked` when appropriate.

## Verification

```bash
node .agent-harness/dist/cli.js symphony preflight
node .agent-harness/dist/cli.js agent start --project <name> --dry-run
git status --short --ignored
```

## Out Of Scope

- Product work.
- Long-running unattended operation.
- Building a GitHub Issues tracker adapter.
