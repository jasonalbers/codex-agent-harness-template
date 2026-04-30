# ChatGPT Idea Workshop

Use this guide in ChatGPT web with the GitHub connector attached to this
repository.

The purpose is to use ChatGPT web as the high-reasoning product studio, not as
the execution worker. Codex should start only after the idea has been captured,
refined, validated, compiled, and promoted to Linear.

## Start Prompt

Paste this into ChatGPT web:

```text
Use the connected codex-agent-harness-template repository as the operating model.

We are refining a new product or feature idea.

Read:
- README.md
- .agent-harness/WORKFLOW.md
- .agent-harness/docs/intake/chatgpt-workshop.md
- .agent-harness/docs/intake/idea-pack-format.md
- .agent-harness/docs/intake/refinement-stages.md
- .agent-harness/docs/intake/linear-promotion-rules.md
- .agent-harness/docs/UI_UX.md

Do not create implementation tasks until the idea is stable.
Do not drop good ideas just because they are not in scope for the first build.

Maintain four ledgers throughout the conversation:
1. Idea Ledger
2. Decision Ledger
3. Deferred or Rejected Ideas Ledger
4. Work Ledger

At the end, output one IDEA_PACK_VERSION: 1 markdown artifact that follows
.agent-harness/docs/templates/idea-pack.template.md.
```

## Conversation Rules

- Keep the conversation creative and high level at first.
- Ask questions that expose the user, problem, workflow, business outcome,
  risks, non-goals, and unknowns.
- Push back on vague ideas until they become specific.
- Preserve strong side ideas in the deferred ledger instead of deleting them.
- Mark assumptions clearly.
- Only create draft Linear issues after the MVP boundary is clear.
- Keep issues small enough for one pull request.
- Every issue needs acceptance criteria and verification.

## Output Rule

The final answer from ChatGPT web must be a single markdown Idea Pack. Save that
artifact into:

```text
.agent-harness/intake/inbox/<idea-id>.md
```

Then run:

```bash
npm --prefix .agent-harness run build
node .agent-harness/dist/cli.js intake validate .agent-harness/intake/inbox/<idea-id>.md
node .agent-harness/dist/cli.js intake compile .agent-harness/intake/inbox/<idea-id>.md
node .agent-harness/dist/cli.js intake promote .agent-harness/intake/compiled/<idea-id> --dry-run
```
