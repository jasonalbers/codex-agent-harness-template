# Linear Status Model

## Statuses

- `Backlog` - not ready for agent.
- `Todo` - planned but not agent-ready.
- `Ready for Agent` - approved for agent execution.
- `In Progress` - an agent is working.
- `Needs Human Review` - PR or blocker needs human decision.
- `Changes Requested` - review requires agent rework.
- `Ready to Merge` - approved for merge workflow.
- `Done` - complete.
- `Blocked` - cannot proceed without external action.

Agents should only start work from `Ready for Agent`.
