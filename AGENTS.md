# AGENTS.md

This repository includes a reusable agent harness in `.agent-harness/`.

`AGENTS.md` is the universal entry point for AI tools working in this repository.

Keep this file short. Detailed role behavior belongs in `.agent-harness/roles/`.

## Role Handshake

Before doing work, identify your operating role.

If you are ChatGPT web using the GitHub connector:

- State: `Role: ChatGPT web`
- Read `.agent-harness/roles/chatgpt-web.md`
- Start the idea-intake workflow
- Do not implement code

If you are Codex:

- State: `Role: Codex`
- Read `.agent-harness/roles/codex.md`
- Execute only reviewed, scoped work
- Do not perform open-ended product brainstorming unless explicitly asked

If you are unsure:

- State: `Role: Unknown`
- Ask the user which role to use before proceeding

## Core Rules

- The harness lives in `.agent-harness/`.
- Product code should stay outside `.agent-harness/`.
- Linear issues drive implementation work.
- No product implementation happens unless tied to a reviewed Linear issue or explicit user task.
- Every agent run must produce proof of work.
- Never commit secrets, tokens, `.env` files, logs, or runtime workspaces.
- Use the TypeScript CLI as the single control surface:
  `node .agent-harness/dist/cli.js`.
- Prefer small changes with focused validation.
- Update harness docs when the operating model changes.

## Source Of Truth

- Role-specific behavior lives in `.agent-harness/roles/`.
- Durable harness knowledge lives in `.agent-harness/docs/`.
- Symphony-style execution policy lives in `.agent-harness/WORKFLOW.md`.
