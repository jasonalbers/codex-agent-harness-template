# Docs

This directory is the base repository system of record.

Agents should start with root `AGENTS.md`, then use these docs for the specific
area they are changing.

## Sections

- `setup/` - local, Linear, GitHub, Codex, and Symphony setup.
- `agents/` - agent operating model, permissions, lifecycle, and prompts.
- `intake/` - ChatGPT web idea refinement and Linear promotion workflow.
- `UI_UX.md` - reusable UI/UX guidance for future AI and business-agent products.
- `FRONTEND.md` - frontend validation rules and generated UI boundaries.
- `linear/` - Linear workspace, project, issue, status, and label model.
- `github/` - repository, branch, PR, and CI model.
- `templates/` - reusable starting points for projects, issues, plans, proof,
  decisions, and runbooks.
- `runbooks/` - repeatable operating procedures.
- `decisions/` - architecture and process decisions.
- `generated/` - local generated summaries and reports.

## Key Runbooks

- `runbooks/chatgpt-to-linear.md` - turn a ChatGPT web conversation into
  validated Linear-ready work.
- `runbooks/start-agent-run.md` - start or dry-run agent execution after Linear
  work is reviewed.
