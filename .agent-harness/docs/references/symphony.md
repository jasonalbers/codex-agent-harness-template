# Symphony Reference

Source: https://github.com/openai/symphony

## Local Summary

Symphony turns project work into isolated autonomous implementation runs.

The upstream project describes Symphony as the next step after a repository has
adopted Harness Engineering: instead of supervising coding agents directly, the
team manages work that needs to get done.

## Upstream Shape

Current upstream Symphony has:

- A language-agnostic `SPEC.md`.
- An experimental Elixir reference implementation.
- A Linear-first tracker integration.
- Repo-owned `.agent-harness/WORKFLOW.md` policy.
- Per-issue isolated workspaces.
- Codex app-server execution.

## Base Setup

This base repo provides the reusable pieces a future project needs before live
Symphony operation:

- `.agent-harness/WORKFLOW.md` - repo-owned Symphony-style workflow policy.
- `.agent-harness/.env.example` - required local environment variables.
- `.agent-harness/config/projects.example.json` - multi-project configuration example.
- `.agent-harness/docs/references/linear-symphony-workflow.md` - expected Linear state setup.
- `.agent-harness/docs/references/symphony-readiness-checklist.md` - readiness gate before live work.
- `node .agent-harness/dist/cli.js symphony bootstrap` - clone/build upstream Symphony locally.
- `node .agent-harness/dist/cli.js symphony run` - generate runtime workflow and launch Symphony.
- `node .agent-harness/dist/cli.js agent start` - project-aware wrapper for dry-run and live starts.
- Live starts pass Symphony's required unattended guardrail acknowledgement flag
  to the pinned upstream binary after harness readiness checks pass.

Ignored local state:

- `.agent-harness/.symphony/`
- `.agent-harness/.env`
- `.agent-harness/.env.*`
- `log/`
- `agent-workspaces/`
- `symphony-workspaces/`

## Required Environment

- `LINEAR_API_KEY`
- `LINEAR_PROJECT_SLUG`
- `GITHUB_REPO`
- GitHub CLI auth from `gh auth token`
- Codex auth at `~/.codex/auth.json` or `CODEX_AUTH_FILE`
- `CODEX_MODEL`
- `CODEX_APPROVAL_POLICY`
- `AGENT_WORKSPACE_ROOT`
- `AGENT_MAX_PARALLEL_RUNS`
- `AGENT_DRY_RUN`
- `SYMPHONY_REPO`
- `SYMPHONY_REF`

## Commands

```bash
node .agent-harness/dist/cli.js symphony bootstrap
node .agent-harness/dist/cli.js symphony preflight
node .agent-harness/dist/cli.js agent start --project example-app --dry-run
```

The bootstrap command pins upstream Symphony to the default `SYMPHONY_REF` in
`.agent-harness/.env.example`. Update that ref only after rerunning the local readiness checks.

The template explicitly sets `codex.approval_policy` to `never` in the generated
workflow. Do not rely on the pinned Symphony default for this field; older
Symphony builds defaulted to object-form `reject`, which is not accepted by
current Codex app-server schemas.

## Known Boundary

Upstream Symphony currently targets Linear. If a future project should run
directly from GitHub Issues instead, create a dedicated execution plan for a
GitHub tracker adapter rather than overloading the Linear workflow.
