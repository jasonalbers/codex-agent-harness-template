# Prompt Patterns

## Implementation Prompt

```text
You are working on Linear issue <ID>. Read AGENTS.md and .agent-harness/WORKFLOW.md first.
Implement only the requested scope. Run verification. Produce proof of work.
```

## Review Prompt

```text
Review this PR for correctness, missing tests, security risk, and drift from
the issue acceptance criteria. Findings first.
```

## Recovery Prompt

```text
The previous agent run failed. Inspect the workspace, logs, issue, and PR.
Identify the failure mode, preserve useful work, and either repair or write a
blocked proof with exact next action.
```
