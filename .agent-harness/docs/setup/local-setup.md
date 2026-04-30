# Local Setup

## Prerequisites

- Git
- Node.js 20 or newer
- GitHub CLI (`gh`)
- Codex CLI
- Optional: `mise` for the upstream Symphony Elixir reference implementation

## First Run

```bash
cp .agent-harness/.env.example .agent-harness/.env
npm --prefix .agent-harness ci
npm --prefix .agent-harness run build
node .agent-harness/dist/cli.js validate env --dry-run
node .agent-harness/dist/cli.js validate repo
node .agent-harness/dist/cli.js project summary
```

Do not put real credentials in tracked files.

## Local Runtime State

Runtime state belongs in ignored local folders:

- `.agent-harness/.symphony/`
- `.agent-harness/.runtime/`
- `agent-workspaces/`
- `symphony-workspaces/`
- `log/`
