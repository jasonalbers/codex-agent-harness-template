# Repo Map

This repo is the base harness, not an app.

## Root Files

- `README.md`: plain-English overview for humans.
- `.agent-harness/ARCHITECTURE.md`: high-level system architecture and ownership boundaries.
- `AGENTS.md`: short map for coding agents.
- `.agent-harness/WORKFLOW.md`: Symphony workflow contract for Linear-driven agent runs.
- `.agent-harness/.env.example`: environment variable template.
- `.gitignore`: local files and generated artifacts that should not be committed.

## Docs

- `.agent-harness/docs/DESIGN.md`: product design direction.
- `.agent-harness/docs/UI_UX.md`: reusable UI/UX guidance for future AI and business-agent products.
- `.agent-harness/docs/FRONTEND.md`: frontend stack decision space.
- `.agent-harness/docs/intake/`: ChatGPT web to Linear idea intake workflow.
- `.agent-harness/docs/PLANS.md`: execution plan rules.
- `.agent-harness/docs/PRODUCT_SENSE.md`: product judgment and anti-goals.
- `.agent-harness/docs/QUALITY_SCORE.md`: current quality scorecard.
- `.agent-harness/docs/RELIABILITY.md`: reliability model.
- `.agent-harness/docs/SECURITY.md`: security rules.
- `.agent-harness/docs/harness-engineering.md`: how this project applies the Harness Engineering model.
- `.agent-harness/docs/linear-workflow.md`: legacy summary of Linear states, ticket rules, and handoff expectations.
- `.agent-harness/docs/repo-map.md`: this map.
- `.agent-harness/docs/symphony-readiness.md`: readiness checklist before unattended Symphony work.
- `.agent-harness/docs/setup/`: setup guides.
- `.agent-harness/docs/agents/`: agent operating rules.
- `.agent-harness/docs/linear/`: Linear model.
- `.agent-harness/docs/github/`: GitHub model.
- `.agent-harness/docs/templates/`: reusable templates.
- `.agent-harness/docs/runbooks/`: repeatable procedures.
- `.agent-harness/docs/decisions/`: decision records.
- `.agent-harness/docs/projects/`: generated project-specific notes.
- `.agent-harness/docs/design-docs/`: design decision documents.
- `.agent-harness/docs/exec-plans/`: active plans, completed plans, and technical debt tracker.
- `.agent-harness/docs/generated/`: generated references, such as future schema docs.
- `.agent-harness/docs/product-specs/`: product specifications.
- `.agent-harness/docs/references/`: curated external references.

## CLI

- `node .agent-harness/dist/cli.js validate env`: environment readiness.
- `node .agent-harness/dist/cli.js validate repo`: base structure, config, script syntax, and secret hygiene.
- `node .agent-harness/dist/cli.js project bootstrap`: add a project config and docs.
- `node .agent-harness/dist/cli.js linear create`: dry-run or create Linear issues from a plan.
- `node .agent-harness/dist/cli.js linear sync`: dry-run or fetch Linear summary.
- `node .agent-harness/dist/cli.js agent start`: project-aware dry-run and live Symphony entry point.
- `node .agent-harness/dist/cli.js project summary`: project readiness summary.
- `node .agent-harness/dist/cli.js intake ...`: cross-platform Idea Pack validation, compilation, and promotion.
