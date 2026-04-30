# Intake

This directory is the local handoff point between ChatGPT web idea refinement and
Linear-ready work.

Recommended flow:

1. Use ChatGPT web to run the workshop in `.agent-harness/docs/intake/chatgpt-workshop.md`.
2. Save the final Idea Pack into `.agent-harness/intake/inbox/`.
3. Validate it with `node .agent-harness/dist/cli.js intake validate .agent-harness/intake/inbox/<idea-id>.md`.
4. Compile it with `node .agent-harness/dist/cli.js intake compile .agent-harness/intake/inbox/<idea-id>.md`.
5. Promote the compiled issue bundle to Linear with `node .agent-harness/dist/cli.js intake promote .agent-harness/intake/compiled/<idea-id> --dry-run`.

The subdirectories are ignored by default so private ideas are not accidentally
published in a public template repository.
