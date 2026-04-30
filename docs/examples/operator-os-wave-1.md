# Operator OS Wave 1 Example

This is a synthetic example showing how the harness works end-to-end.

## Flow

```text
Idea → Idea Pack → Linear Issues → Ready for Agent → Codex Run → PR → Proof of Work
```

## Example Steps

1. ChatGPT produces an Idea Pack.
2. CLI compiles and promotes issues to Linear.
3. User sets one issue to `Ready for Agent`.
4. Agent runner picks it up and moves it to `In Progress`.
5. Codex creates a branch and implements the change.
6. Verification commands run.
7. PR is opened with proof of work.
8. Issue moves to `Ready to Merge`.
9. PR merges and issue moves to `Done`.

## Key Insight

The harness ensures:

- work is scoped
- work is verified
- work is reviewable
- work is traceable

This prevents chaotic AI-driven development.
