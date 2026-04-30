# Agent Service Runbook

Use the agent service when a template-derived repo should continuously poll its
own Linear project for approved Codex work.

The service is per repo and per project. Installing a service in one checkout
does not affect other repositories or projects.

## Requirements

- Linux or WSL with `systemd --user`.
- Built harness CLI:
  `npm --prefix .agent-harness run build`
- Local project config:
  `.agent-harness/config/projects.json`
- Local environment file:
  `.agent-harness/.env`
- The project entry has `agent_enabled: true`.
- `.agent-harness/.env` includes `LINEAR_API_KEY` and `AGENT_WORKSPACE_ROOT`.

The service reads `.agent-harness/.env`, but CLI previews and logs must not
print secrets.

## Install

From the target repo:

```bash
node .agent-harness/dist/cli.js agent service install --project <name>
```

Preview without writing the unit:

```bash
node .agent-harness/dist/cli.js agent service install --project <name> --dry-run
```

The generated unit is installed under:

```text
~/.config/systemd/user/agent-harness-<project>.service
```

It runs from the repo root, loads `.agent-harness/.env`, sets
`AGENT_DRY_RUN=false`, sets `SYMPHONY_AGENT_HARNESS_SINGLE_ISSUE=1`, and uses a
repo-local lock file under `.agent-harness/.runtime/`.

## Start

```bash
node .agent-harness/dist/cli.js agent service start --project <name>
```

## Stop Or Pause

```bash
node .agent-harness/dist/cli.js agent service stop --project <name>
```

Stopping this service pauses this repo/project runner only. It does not modify
other repositories, other projects, or Linear issues.

## Restart

```bash
node .agent-harness/dist/cli.js agent service restart --project <name>
```

## Status

```bash
node .agent-harness/dist/cli.js agent service status --project <name>
```

## Logs

```bash
node .agent-harness/dist/cli.js agent service logs --project <name>
```

This tails:

```bash
journalctl --user -u agent-harness-<project>.service -f -n 200
```

## Work Pickup

The user marks a reviewed Linear issue as `Ready for Agent`.

The service runs:

```bash
AGENT_DRY_RUN=false node .agent-harness/dist/cli.js agent start --project <name>
```

The harness claims one issue, runs the worker, publishes the PR, and handles the
configured lifecycle. If no `Ready for Agent` issue exists, the run exits
cleanly and systemd restarts it after `RestartSec`.

## Safety

- Never commit `.agent-harness/.env`.
- Never run one repo service from another repo root.
- Use `status` and `logs` before assuming work is stuck.
- Stop the service before doing manual repairs to the same project runner.
