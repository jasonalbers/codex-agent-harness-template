# Linear Promotion Rules

Linear should receive only reviewed, buildable work.

## Promotion Requirements

An Idea Pack can be promoted when:

- `stage` is `ready-for-linear`.
- The summary, problem, target users, and business outcome are clear.
- Decisions are captured.
- Deferred ideas are preserved.
- Open questions are answered or explicitly deferred.
- Every Linear issue has:
  - Goal.
  - User value.
  - Acceptance criteria.
  - Out of scope.
  - Dependencies.
  - Verification.
  - Notes for agent.

## What Does Not Get Promoted

- Raw brainstorm notes.
- Vague ideas.
- Product strategy questions.
- Issues with no verification path.
- Issues that require more than one pull request.
- Ideas that belong in the deferred ledger.

## Linear Issue Description Context

Linear issue descriptions should include enough Idea Pack context for an
implementation agent to understand why the issue exists without opening every
compiled artifact first.

Each promoted issue should include:

- A title prefixed with Idea Pack id and sequence, such as
  `[example-idea 01/04] Define first workflow`.
- Source idea.
- Agent execution order.
- A concise Idea Context block with summary, core workflows, decisions, risks,
  open questions, and deferred ideas.
- The issue-specific goal, user value, acceptance criteria, out of scope,
  dependencies, verification, and notes for agent.

The complete Idea Pack and conversation ledger remain in the compiled local
artifacts for deeper review.

## Status Rule

Created Linear issues should begin outside active agent execution. Move them to
`Ready for Agent` only after a human review confirms the issue is small, clear,
and safe for an agent run.

## Promotion Verification

After live promotion, the CLI should verify each created issue before reporting
success:

- The issue is not archived.
- The issue belongs to the target Linear project.
- The issue appears in the target project's normal issue list.
- The issue description contains the expected promoted content.

If any check fails, promotion should fail loudly so the user can repair Linear
state before starting agent work.
