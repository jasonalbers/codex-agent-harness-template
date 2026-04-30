# Symphony Setup

Symphony-style orchestration is the target operating model.

This base does not vendor Symphony. It provides repo-local policy and a single
TypeScript CLI so upstream Symphony can run against future projects.

## Commands

```bash
node .agent-harness/dist/cli.js symphony bootstrap
node .agent-harness/dist/cli.js symphony preflight
node .agent-harness/dist/cli.js agent start --project example-app --dry-run
```

`node .agent-harness/dist/cli.js symphony bootstrap` clones the upstream Symphony reference
implementation under `.agent-harness/.symphony/openai-symphony` and checks out the pinned
`SYMPHONY_REF` from `.agent-harness/.env.example` by default. Override `SYMPHONY_REF` only when
you intentionally want to test a newer upstream revision.

For live runs, prefer `node .agent-harness/dist/cli.js agent start --project <name>` over calling
`node .agent-harness/dist/cli.js symphony run` directly. The project-aware wrapper resolves
`GITHUB_REPO` and `LINEAR_PROJECT_SLUG` from `.agent-harness/config/projects.json`.

Live runs are trusted local runner operations. The CLI passes Symphony's
required unattended guardrail acknowledgement flag to the pinned upstream binary
only after the local dry-run and readiness checks have completed.

## Current Boundary

The upstream reference implementation is Linear-first. If a future project must
use GitHub Issues directly as the work source, create a dedicated adapter plan.
