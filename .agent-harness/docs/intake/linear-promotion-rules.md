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

## Wave Backlog Rule

Every wave backlog must include a final Linear issue that verifies the completed
wave locally before the next wave starts.

The final verification issue should be the last issue in the wave sequence and
must require the agent to:

- Run all product build, test, demo, and proof commands for that wave.
- Run harness build, test, and repository validation commands when the harness
  is present.
- Inspect generated proof output and required artifacts.
- Confirm the repo is clean except for expected ignored runtime/proof output.
- Produce a clear PASS/FAIL report with commands run, proof paths, key summary
  values, problems found, and a recommendation for whether the next wave can
  begin.

Do not promote a wave backlog that lacks this final verification issue unless
the user explicitly says the wave is documentation-only and explains why a final
verification issue would not add value.

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

- A title prefixed with sequence only, such as
  `[01/04] Define first workflow`.
- A generated Linear label for the Idea Pack id, such as
  `idea:example-idea`.
- Source idea.
- Agent execution order.
- A concise Idea Context block with summary, core workflows, decisions, risks,
  open questions, and deferred ideas.
- The issue-specific goal, user value, acceptance criteria, out of scope,
  dependencies, verification, and notes for agent.

The complete Idea Pack and conversation ledger remain in the compiled local
artifacts for deeper review.

## Status Rule

Created Linear issues should begin outside active agent execution. The human
approval gate is moving a small, clear, safe issue to `Ready for Agent`.

## Promotion Verification

After live promotion, the CLI should verify each created issue before reporting
success:

- The issue is not archived.
- The issue belongs to the target Linear project.
- The issue appears in the target project's normal issue list.
- The issue description contains the expected promoted content.
- The issue has the expected generated Idea Pack label.

If any check fails, promotion should fail loudly so the user can repair Linear
state before starting agent work.
