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
12. Update Linear status.
13. Stop for human review or continue only if the workflow allows it.

## Ordered Pickup

Idea Pack promotion adds an `Agent Execution Order` section to every generated
Linear issue.

When `agent start` runs, the CLI selects the lowest ordered issue in
`Ready for Agent`. If later ordered issues are also `Ready for Agent`, the CLI
moves them back to the configured hold state, `Todo` by default, before starting
the agent runner.

This lets a user mark several issues as `Ready for Agent` without allowing the
runner to skip ahead in a sequential work plan.
