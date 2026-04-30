# codex-agent-harness-template

A reusable public template for starting new projects with a built-in agent
operating system.

## Starting From ChatGPT Web

Open ChatGPT web, attach the GitHub connector, select this repository, and paste:

```text
Use this repo. Read AGENTS.md and start.
```

The template keeps the harness in one hidden directory:

```text
.agent-harness/
```

That keeps future product files clean. A new project can add its own app code,
`package.json`, `src/`, `docs/`, database files, framework config, and product
README without colliding with the harness internals.

## What This Gives You

- One TypeScript CLI for the full flow from idea to Linear to agent work.
- ChatGPT web idea refinement workflow.
- Linear issue promotion.
- Symphony-style Codex agent execution policy.
- GitHub PR and review conventions.
- UI/UX guidance for future AI/business-agent products.
- Validation, safety, and public-template hygiene checks.

## Operating Model

```text
ChatGPT web conversation
  -> Idea Pack
  -> .agent-harness intake validation
  -> compiled Linear issue bundle
  -> Linear issues
  -> reviewed agent-ready tasks
  -> Codex/Symphony work
  -> GitHub pull requests
  -> proof of work
```

ChatGPT web is the high-reasoning product studio.

The harness CLI is the compiler and control surface.

Linear is the work queue.

Codex agents execute only after work is clear.

## Repository Layout

Root files are intentionally minimal:

```text
README.md
AGENTS.md
.gitignore
.github/
.agent-harness/
```

The harness owns:

```text
.agent-harness/
  WORKFLOW.md
  ARCHITECTURE.md
  package.json
  src/cli.ts
  config/
  docs/
  intake/
  roles/
```

## First Run

Install and build the CLI:

```bash
npm --prefix .agent-harness ci
npm --prefix .agent-harness run build
```

Validate the template:

```bash
node .agent-harness/dist/cli.js validate env --dry-run
node .agent-harness/dist/cli.js validate repo
node .agent-harness/dist/cli.js project summary
```

Create local config only when you are ready:

```bash
cp .agent-harness/.env.example .agent-harness/.env
cp .agent-harness/config/projects.example.json .agent-harness/config/projects.json
```

Do not commit `.agent-harness/.env` or private project config.

## ChatGPT Web To Linear

Use ChatGPT web with the GitHub connector as the idea studio. Start from
`AGENTS.md`, complete the role handshake, and follow
`.agent-harness/roles/chatgpt-web.md`.

At the end of the session, ChatGPT should output one `IDEA_PACK_VERSION: 1`
markdown artifact.

Save it to:

```text
.agent-harness/intake/inbox/<idea-id>.md
```

Then run:

```bash
node .agent-harness/dist/cli.js intake validate .agent-harness/intake/inbox/<idea-id>.md
node .agent-harness/dist/cli.js intake compile .agent-harness/intake/inbox/<idea-id>.md
node .agent-harness/dist/cli.js intake promote .agent-harness/intake/compiled/<idea-id> --dry-run
```

When Linear credentials are configured and the dry run looks right:

```bash
AGENT_DRY_RUN=false node .agent-harness/dist/cli.js intake promote .agent-harness/intake/compiled/<idea-id>
```

The intake pipeline preserves:

- High-level idea.
- Decision trail.
- Deferred ideas.
- Rejected ideas.
- Open questions.
- Epics.
- Small Linear-ready issues.

## Project Setup

Add a target project:

```bash
node .agent-harness/dist/cli.js project bootstrap \
  --name example-app \
  --repo example-org/example-app \
  --linear-slug example-app-abc123 \
  --dry-run
```

Write the config after review:

```bash
node .agent-harness/dist/cli.js project bootstrap \
  --name example-app \
  --repo example-org/example-app \
  --linear-slug example-app-abc123
```

Summarize readiness:

```bash
node .agent-harness/dist/cli.js project summary
```

## Linear Commands

Preview issue creation:

```bash
node .agent-harness/dist/cli.js linear create .agent-harness/docs/templates/issue-plan.template.md --dry-run
```

Sync Linear summary:

```bash
node .agent-harness/dist/cli.js linear sync --dry-run
```

## Agent Work

Preview an agent run:

```bash
node .agent-harness/dist/cli.js agent start --project example-app --dry-run
```

Start live work only after Linear issues are reviewed and credentials are
configured:

```bash
AGENT_DRY_RUN=false node .agent-harness/dist/cli.js agent start --project example-app
```

## CLI Reference

```bash
node .agent-harness/dist/cli.js help
node .agent-harness/dist/cli.js validate env --dry-run
node .agent-harness/dist/cli.js validate repo
node .agent-harness/dist/cli.js project bootstrap --name example-app --repo example-org/example-app --linear-slug example-app-abc123 --dry-run
node .agent-harness/dist/cli.js project summary
node .agent-harness/dist/cli.js intake new --idea-id example-idea --name "Example Idea"
node .agent-harness/dist/cli.js intake validate .agent-harness/intake/inbox/example-idea.md
node .agent-harness/dist/cli.js intake compile .agent-harness/intake/inbox/example-idea.md
node .agent-harness/dist/cli.js intake promote .agent-harness/intake/compiled/example-idea --dry-run
node .agent-harness/dist/cli.js linear create .agent-harness/docs/templates/issue-plan.template.md --dry-run
node .agent-harness/dist/cli.js linear sync --dry-run
node .agent-harness/dist/cli.js symphony bootstrap
node .agent-harness/dist/cli.js symphony preflight
```

## Public Template Checklist

Before publishing:

```bash
npm --prefix .agent-harness ci
npm --prefix .agent-harness run build
node .agent-harness/dist/cli.js validate repo
git status --short
```

Also confirm:

- No personal names, private repos, local paths, secrets, logs, or generated
  workspaces are committed.
- `.agent-harness/.env` and `.agent-harness/config/projects.json` remain private.
- The GitHub repository description is clear.
- Useful GitHub topics are set:
  - `codex`
  - `agents`
  - `agent-harness`
  - `linear`
  - `symphony`
  - `harness-engineering`
  - `agent-orchestration`
  - `developer-tools`

## Why The Harness Lives In `.agent-harness`

This is a template for future projects. The future project should own the root
product files. The harness should stay portable, hidden, and easy to replace or
upgrade.

That means:

- Product code belongs outside `.agent-harness/`.
- Harness docs, config, templates, intake files, and runtime state belong inside
  `.agent-harness/`.
- Root `AGENTS.md` tells agents where the harness lives.
- Root `README.md` explains the template and can be replaced by product-specific
  documentation after adoption if desired.
