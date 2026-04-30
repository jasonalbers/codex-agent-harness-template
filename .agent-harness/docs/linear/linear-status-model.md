# Linear Status Model

## Statuses

- `Backlog` - gray, Backlog. Created but not approved for work.
- `Todo` - gray / white, Unstarted. Reviewed, but not approved for Codex yet.
- `Ready for Agent` - green, Started. Approved for Codex/Symphony to start. Human has reviewed the issue and wants the agent to work on it.
- `In Progress` - yellow, Started. Agent has picked up the issue and is actively working.
- `Changes Requested` - orange, Started. The previous agent output needs revision. Agent may pick this issue back up and continue.
- `Blocked` - red, Started. Agent cannot continue. The issue must include a comment explaining the blocker, failed command, missing input, or setup problem.
- `Ready to Merge` - green, Started. Agent completed the work, ran verification, and opened or prepared a PR with proof of work.
- `Done` - purple / blue, Completed. Work is merged or completed.
- `Canceled` - gray, Canceled. No longer needed.
- `Duplicate` - gray, Canceled. Duplicate of another issue.

## Normal Autopilot Flow

The user manually moves reviewed work from `Backlog` or `Todo` to `Ready for Agent`.

After that, Codex/Symphony owns the lifecycle:

- `Ready for Agent` -> `In Progress`
- `In Progress` -> `Ready to Merge`
- `Changes Requested` -> `In Progress`
- `Ready to Merge` -> `Done`

If blocked, move to `Blocked` and include a comment explaining the blocker.
