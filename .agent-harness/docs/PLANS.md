# PLANS.md

## Execution Plans

Execution plans are first-class repository artifacts.

Use an execution plan when work spans multiple files, changes architecture,
introduces tooling, changes product direction, or will be handed to another
agent.

## Location

- Active plans live in `.agent-harness/docs/exec-plans/active/`.
- Completed plans move to `.agent-harness/docs/exec-plans/completed/`.
- Follow-up debt lives in `.agent-harness/docs/exec-plans/tech-debt-tracker.md`.

## Required Sections

Each plan should include:

- Goal.
- Current context.
- Target files or areas.
- Steps.
- Acceptance criteria.
- Verification commands.
- Out-of-scope notes.
- Risks and rollback notes.
- Progress log.

## Plan Discipline

Update the plan as reality changes. Do not leave stale plan text that would
mislead the next agent.

## Symphony Plans

Symphony-managed issues should create or update execution plans for meaningful
changes. Plans should name the Linear issue identifier when available and should
record the GitHub PR opened by the agent.
