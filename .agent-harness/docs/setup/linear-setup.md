# Linear Setup

Use one Linear workspace for all agent-managed work.

Use one Linear project per GitHub repository.

Each project must have a project slug. To find it, open the Linear project in a
browser and copy the slug from the URL.

## Required Local Values

```bash
export LINEAR_API_KEY=...
export LINEAR_PROJECT_SLUG=...
```

One Linear API key can access multiple projects if the account has access.

## Recommended Status Flow

```text
Backlog
Todo
Ready for Agent
In Progress
Changes Requested
Blocked
Ready to Merge
Done
Canceled
Duplicate
```

See `.agent-harness/docs/linear/linear-status-model.md`.
