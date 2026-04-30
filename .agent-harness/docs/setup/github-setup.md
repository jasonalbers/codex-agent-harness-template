# GitHub Setup

GitHub stores implementation repositories.

Each configured project needs:

- Repository name in `owner/name` form.
- Default branch.
- GitHub CLI authentication for local operations.
- PR template and CI validation in the target repo when possible.

## Validate

```bash
gh auth status
node .agent-harness/dist/cli.js project summary
```

## Public Template Settings

For a public template repository, set a clear GitHub description, for example:

```text
Reusable Codex agent harness for Linear-driven, Symphony-style GitHub workflows.
```

Recommended repository name:

```text
codex-agent-harness-template
```

Recommended topics:

- `codex`
- `agents`
- `agent-harness`
- `linear`
- `symphony`
- `harness-engineering`
- `agent-orchestration`
- `developer-tools`

Before making the repo public, run `node .agent-harness/dist/cli.js validate repo` and confirm no
private project names, local paths, credentials, logs, or generated workspaces
are committed.
