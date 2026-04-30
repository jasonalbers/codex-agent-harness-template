# Agent Run Lifecycle

1. Select the next eligible Linear issue by agent execution order.
2. Create isolated workspace.
3. Clone target GitHub repo.
4. Move the selected Linear issue to `In Progress`.
5. Read repo instructions.
6. Create or update an execution plan.
7. Implement the smallest useful change.
8. Run validation.
9. Write proof of work.
10. Parent CLI creates branch: `agent/<linear-issue-id>-short-description`.
11. Parent CLI commits publishable workspace changes.
12. Parent CLI pushes the branch and opens the pull request.
13. Parent CLI moves Linear status to `Ready to Merge`.
14. Merge or complete the work when verification and workflow policy allow it.
15. Move Linear status to `Done`, or `Blocked` with an explanatory comment if the run cannot continue.

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
that, Codex/Symphony owns implementation and verification, while the parent CLI
owns branch creation, commit, PR handling, status movement, and blocked/error
reporting from the verified host environment.

The Symphony worker is configured for one Codex turn per issue. A Codex turn can
run many local tool calls, so the worker should finish implementation and
verification before it ends the turn. After that turn exits, the parent CLI
inspects the workspace and publishes the result.

`agent start` runs Symphony in one-issue mode. When the claimed worker task
completes normally, the harness stops the Symphony process so control returns to
the parent CLI. The parent CLI must then either publish the workspace and move
the issue to `Ready to Merge`, or move the issue to `Blocked` with the publish
error. It must not let Symphony redispatch the same `In Progress` issue after a
completed worker turn.
