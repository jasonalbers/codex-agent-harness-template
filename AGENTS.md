# AGENTS.md

This project includes a reusable agent harness in `.agent-harness/`.

`AGENTS.md` is the universal entry point for ChatGPT web, Codex, and future
agents. Tools must identify their operating role before doing work, then follow
the matching role file.

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
- No product work happens unless tied to a reviewed Linear issue.
- Every agent run must produce proof of work.
- Never commit secrets, tokens, `.env` files, logs, or runtime workspaces.
- Use the TypeScript CLI as the single control surface:
  `node .agent-harness/dist/cli.js`.
- Prefer small changes with focused validation.
- Update harness docs when the operating model changes.

## Source Of Truth

Use `.agent-harness/roles/` for application-specific behavior.

Use `.agent-harness/roles/shared-rules.md` for safety and quality rules that apply to all tools.

Use `.agent-harness/docs/` for durable harness knowledge.

Use `.agent-harness/WORKFLOW.md` for the Symphony-style run policy.
