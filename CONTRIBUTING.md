# Contributing

Thanks for your interest in improving the Codex Agent Harness Template.

## What to contribute

- Bug reports
- Workflow improvements
- Better Linear issue generation
- Safer Codex/Symphony execution patterns
- Documentation improvements

## How to contribute

1. Fork the repo
2. Create a branch: `feature/<short-description>`
3. Make small, focused changes
4. Run validation:

```bash
npm --prefix .agent-harness ci
npm --prefix .agent-harness run build
node .agent-harness/dist/cli.js validate repo
```

5. Open a pull request with:
- Summary of change
- Why it matters
- Any risks

## Rules

- Do not commit secrets or `.env`
- Do not change CLI behavior without discussion
- Prefer small, testable improvements
- Keep changes aligned with the agent workflow model

## Testing

Run:

```bash
npm --prefix .agent-harness run build
node .agent-harness/dist/cli.js validate repo
```

## Questions

Use GitHub Discussions for questions or ideas.
