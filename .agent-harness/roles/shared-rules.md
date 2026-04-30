# Shared Rules

These rules apply to all AI tools working in this repository.

## Safety

- Never commit secrets, tokens, `.env` files, logs, or runtime workspaces.
- Do not modify unrelated files.
- Do not invent external facts.
- Mark assumptions clearly.
- Treat `Ready for Agent` as the human approval gate for Codex execution.
- Do not perform destructive external actions without explicit approval.

## Work Quality

- Keep work small and reviewable.
- Prefer clear acceptance criteria.
- Include verification steps.
- Preserve deferred ideas instead of deleting them.
- Use plain, durable documentation.
- Keep implementation tied to a clear task.
- Record blockers instead of guessing.

## Source Of Truth

- `AGENTS.md` is the universal entry point.
- `.agent-harness/roles/` defines application-specific behavior.
- Harness behavior lives in `.agent-harness/`.
- Product code lives outside `.agent-harness/`.
- ChatGPT web creates Idea Packs.
- Codex executes reviewed work.
- Linear tracks build work.
- GitHub stores code, docs, branches, pull requests, and proof of work.
