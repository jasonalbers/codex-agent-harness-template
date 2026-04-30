# Linear Workflow For Symphony

## Status

Base reference. Use this file to configure each project's Linear statuses.

## Required Linear Project

Set the project slug in the local environment for the project being operated:

```bash
export LINEAR_PROJECT_SLUG=...
```

The base repository does not store real tokens. Project slugs are stored in
`.agent-harness/config/projects.json` when a project is configured.

## Required States

`.agent-harness/WORKFLOW.md` expects these active states:

- `Ready for Agent`
- `In Progress`
- `Changes Requested`
- `Ready to Merge`

`.agent-harness/WORKFLOW.md` expects these holding or terminal states:

- `Backlog`
- `Todo`
- `Blocked`
- `Done`
- `Canceled`
- `Duplicate`

Before running live Symphony work, confirm the Linear project uses these state
names or update `.agent-harness/WORKFLOW.md` to match the real project.

## Issue Requirements

Every issue handed to an agent should include:

- Goal.
- Target files or areas.
- Acceptance criteria.
- Verification command.
- Out-of-scope notes.
- Expected PR behavior.
- Any required docs updates.

## Dry-Run Gate

Before unattended work starts for a project, create a disposable Linear issue
that only edits a harmless docs file. Use it to prove:

- Symphony creates an isolated workspace.
- Codex reads `AGENTS.md`, `.agent-harness/ARCHITECTURE.md`, and relevant docs.
- Codex creates a GitHub PR.
- Verification evidence appears in the PR.
- Runtime files remain ignored.
- The issue can move through the expected ready, in-progress, ready-to-merge,
  done, and blocked/error states.
