# Agent Run Lifecycle

1. Select the next eligible Linear issue by agent execution order.
2. Create isolated workspace.
3. Clone target GitHub repo.
4. Create branch: `agent/<linear-issue-id>-short-description`.
5. Read repo instructions.
6. Create or update an execution plan.
7. Implement the smallest useful change.
8. Run validation.
9. Write proof of work.
10. Push branch.
11. Open pull request.
12. Move Linear status to `Ready to Merge`.
13. Merge or complete the work when verification and workflow policy allow it.
14. Move Linear status to `Done`, or `Blocked` with an explanatory comment if the run cannot continue.

## Ordered Pickup

Idea Pack promotion adds an `Agent Execution Order` section to every generated
Linear issue.

When `agent start` runs, the CLI selects the lowest ordered issue in
`Ready for Agent`. If later ordered issues are also `Ready for Agent`, the CLI
moves them back to the configured hold state, `Todo` by default, before starting
the agent runner. It then moves the selected issue to `In Progress`.

This lets a user mark several issues as `Ready for Agent` without allowing the
runner to skip ahead in a sequential work plan.

The normal user handoff is only `Backlog` or `Todo` to `Ready for Agent`. After
that, Codex/Symphony owns status movement, proof of work, PR handling, merge or
completion, and blocked/error reporting.
