# GitHub Setup

GitHub stores implementation repositories.

Each configured project needs:

- Repository name in `owner/name` form.
- Default branch.
- GitHub CLI authentication for local publish operations. The harness checks
  `gh auth status`; do not add `GITHUB_TOKEN` to `.agent-harness/.env`.
- PR template and CI validation in the target repo when possible.

## Validate

```bash
gh auth status
node .agent-harness/dist/cli.js project summary
```

`agent start --dry-run` also runs a disposable publish preflight under
`AGENT_WORKSPACE_ROOT`. It verifies the target repo can be read, cloned, branched
locally, and pushed in `--dry-run` mode before any Linear issue is claimed.

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
