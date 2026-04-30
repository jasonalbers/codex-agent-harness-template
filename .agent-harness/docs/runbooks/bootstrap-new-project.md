# Bootstrap New Project

1. Create or choose a GitHub repository.
2. Create one Linear project for that repository.
3. Copy the Linear project slug from the Linear URL.
4. Add the project to `.agent-harness/config/projects.json`.
5. Run:

```bash
node .agent-harness/dist/cli.js project bootstrap --name example-app --repo example-org/example-app --linear-slug example-app-abc123 --dry-run
node .agent-harness/dist/cli.js project bootstrap --name example-app --repo example-org/example-app --linear-slug example-app-abc123
node .agent-harness/dist/cli.js validate repo
node .agent-harness/dist/cli.js project summary
```

6. Create starter issues.
7. Mark only reviewed issues as `Ready for Agent`.
