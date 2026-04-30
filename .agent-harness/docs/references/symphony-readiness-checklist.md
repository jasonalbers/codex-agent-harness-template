# Symphony Readiness Checklist

## Foundation Checks

- [ ] Repository follows the Harness Engineering layout.
- [ ] `AGENTS.md` is a short map, not a long manual.
- [ ] `.agent-harness/ARCHITECTURE.md` describes current boundaries.
- [ ] `.agent-harness/WORKFLOW.md` contains the draft Symphony policy.
- [ ] `node .agent-harness/dist/cli.js symphony bootstrap` builds the pinned upstream Symphony ref locally.
- [ ] `node .agent-harness/dist/cli.js symphony preflight` passes.
- [ ] `.symphony/`, logs, workspaces, and env files are ignored.
- [ ] `node .agent-harness/dist/cli.js validate repo` confirms no known personal/private project markers are committed.

## Local Host Checks

- [ ] `mise` is installed.
- [ ] Upstream Symphony builds under `.symphony/openai-symphony`.
- [ ] `codex` is installed and authenticated.
- [ ] `gh` is installed and authenticated.
- [ ] `LINEAR_API_KEY` is set outside git.
- [ ] `LINEAR_PROJECT_SLUG` is set outside git.

## Workflow Checks

- [ ] Linear states match `.agent-harness/WORKFLOW.md`.
- [ ] Disposable dry-run issue completed.
- [ ] Dry-run PR opened successfully.
- [ ] Dry-run validation evidence was included.
- [ ] Dry-run did not commit runtime state or secrets.
- [ ] Dry-run merge/handoff process is documented.

## Ready Definition

The project is Symphony-ready only after every checkbox above is complete.
