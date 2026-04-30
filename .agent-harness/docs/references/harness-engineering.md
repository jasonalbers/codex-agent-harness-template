# Harness Engineering Reference

Source: https://openai.com/index/harness-engineering/

## Local Summary

Harness Engineering treats the repository as an agent-legible system of record.
The agent receives a small map, then follows indexed repository documents,
execution plans, generated artifacts, and mechanical checks.

Key ideas for this repo:

- Keep `AGENTS.md` short.
- Put durable knowledge in `.agent-harness/docs/`.
- Treat execution plans as versioned artifacts.
- Make UI, logs, metrics, generated artifacts, and validation output legible to
  agents.
- Enforce architecture and taste with tests, linters, rubrics, and review
  checklists.
- Continuously remove stale docs and low-quality patterns.
