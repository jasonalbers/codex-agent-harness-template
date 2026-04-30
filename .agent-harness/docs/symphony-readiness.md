# Symphony Readiness

This base repo is ready as a reusable harness foundation.

Individual projects are ready for live Symphony-style runs only after their project configuration, Linear project, credentials, and validation commands are complete.

## Base Harness Status

- `AGENTS.md` exists as a short map.
- `.agent-harness/WORKFLOW.md` exists as a Symphony-style workflow contract.
- `.agent-harness/config/projects.example.json` supports multiple projects.
- `node .agent-harness/dist/cli.js agent start` provides a project-aware dry-run and live entry point.
- Live `agent start` passes the upstream Symphony unattended guardrail
  acknowledgement flag after readiness checks pass.
- Parent CLI publishing owns branch creation, commits, pull requests, and Linear
  status updates after the worker exits.
- `node .agent-harness/dist/cli.js symphony bootstrap` pins upstream Symphony through `SYMPHONY_REF`.
- `.agent-harness/docs/templates/proof-of-work.template.md` defines proof format.
- `.github/workflows/validate.yml` runs base validation.

## Per-Project Live Readiness

A project is live-ready when:

- Linear project slug is real.
- `agent_enabled` is `true`.
- Required Linear statuses exist.
- Required Linear labels exist.
- `LINEAR_API_KEY` is set in the runtime environment.
- `gh auth status` passes for local GitHub operations.
- `agent start --dry-run` publish preflight passes for repo clone, branch
  creation, writable `.git` metadata, and remote push dry-run.
- Codex auth is available at `~/.codex/auth.json`, or `CODEX_AUTH_FILE` points
  to the auth file.
- Generated workflow uses current Codex app-server policy values:
  `approval_policy: never`, `thread_sandbox: workspace-write`, and
  `turn_sandbox_policy.type: workspaceWrite`.
- Bootstrapped Symphony has the harness compatibility patch for unattended
  `mcpServer/elicitation/request` events.
- `AGENT_WORKSPACE_ROOT` points outside the source checkout.
- The target repo has a validation command agents can run.
- One setup issue has completed with a PR and proof of work.

## Example Project Status

| Project | Base config status | Live-ready status |
| --- | --- | --- |
| `example-app` | sample config only | not live-ready until replaced with real project data |
| `second-example` | placeholder Linear slug | not live-ready |

## First Live Test

Use a setup issue, not a product feature.

Suggested issue title:

```text
Prepare agent harness for <project-name>
```

Suggested acceptance criteria:

- Project config is present.
- Linear statuses and labels are confirmed.
- Dry-run scripts pass.
- A branch can be created with the correct naming convention.
- A PR can be opened.
- Proof of work is attached.
