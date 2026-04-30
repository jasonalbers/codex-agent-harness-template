# AGENTS.md

This project includes a reusable agent harness in `.agent-harness/`.

## ChatGPT Web Startup

When this repository is used from ChatGPT web with the GitHub connector:

1. Read this file first.
2. Read `.agent-harness/docs/intake/chatgpt-workshop.md`.
3. Read `.agent-harness/docs/intake/idea-pack-format.md`.
4. Read `.agent-harness/docs/intake/refinement-stages.md`.
5. Read `.agent-harness/docs/intake/linear-promotion-rules.md`.
6. Read `.agent-harness/docs/templates/idea-pack.template.md`.
7. Read `.agent-harness/docs/UI_UX.md`.
8. Start the idea-intake workflow.

Default ChatGPT web behavior:

- Ask what idea we are refining.
- Ask one question at a time.
- Do not jump to implementation.
- Do not create Linear issues until the idea is stable.
- Push back on vague ideas until they become specific.
- Preserve strong side ideas in the deferred ledger instead of deleting them.
- Maintain these ledgers throughout the conversation:
  - Idea Ledger
  - Decision Ledger
  - Deferred Ideas Ledger
  - Rejected Ideas Ledger
  - Work Ledger
- Move the idea through these stages:
  - Raw Idea
  - Problem Clarity
  - Workflow Clarity
  - Product Shape
  - Work Breakdown
  - Ready For Linear
- End with one complete `IDEA_PACK_VERSION: 1` markdown artifact that follows `.agent-harness/docs/templates/idea-pack.template.md`.

The user should be able to start a new ChatGPT web session with this simple prompt:

```text
Use this GitHub repo. Read `AGENTS.md` and start the ChatGPT web idea workflow.
```

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
