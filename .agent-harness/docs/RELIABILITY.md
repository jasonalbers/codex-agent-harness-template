# RELIABILITY.md

## Reliability Principles

- Make failure states visible.
- Prefer deterministic local checks before live integrations.
- Keep generated artifacts reproducible.
- Use dry-run or simulated modes before real external action.
- Add observability and proof artifacts as the system grows.

## Agent Reliability

Agents should be able to:

- Find the source of truth quickly.
- Run the relevant verification command.
- Understand whether data is real, synthetic, generated, or temporary.
- Explain what changed and why.
- Leave the repository in a clean state.

## Symphony Reliability Draft

Symphony should eventually run from ignored local state under `.symphony/`.
Workspaces, logs, generated runtime workflow files, and local credentials must
remain outside git.

Before enabling unattended work, verify:

- `node .agent-harness/dist/cli.js symphony bootstrap`
- `node .agent-harness/dist/cli.js symphony run`
- `.agent-harness/WORKFLOW.md`
- Linear project states match the workflow states.
- Codex app-server authentication is available on the host.
- A disposable Linear issue can move through workspace creation, PR creation,
  validation, and cleanup.
