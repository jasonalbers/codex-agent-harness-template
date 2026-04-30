# AGENTS.md

This project includes a reusable agent harness in `.agent-harness/`.

## Read First

1. `README.md`
2. `.agent-harness/WORKFLOW.md`
3. `.agent-harness/ARCHITECTURE.md`
4. `.agent-harness/docs/README.md`
5. `.agent-harness/docs/intake/` for ChatGPT web idea intake or Linear promotion work.
6. `.agent-harness/docs/UI_UX.md` for UI, frontend, or product experience work.

## Core Rules

- The harness lives in `.agent-harness/`.
- Product code should stay outside `.agent-harness/`.
- Linear issues drive implementation work.
- No product work happens unless tied to a reviewed Linear issue.
- Every agent run must produce proof of work.
- Never commit secrets, tokens, `.env` files, logs, or runtime workspaces.
- Use the TypeScript CLI as the single control surface:
  `node .agent-harness/dist/cli.js`.
- Prefer small changes with focused validation.
- Update harness docs when the operating model changes.

## Source Of Truth

Use `.agent-harness/docs/` for durable harness knowledge.

Use `.agent-harness/WORKFLOW.md` for the Symphony-style run policy.
