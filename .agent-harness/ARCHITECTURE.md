# Architecture

## Purpose

This repository is a reusable agent harness base.

The recommended public template repository name is
`codex-agent-harness-template`.

It is not a product repository. It defines how future projects are configured,
how agents receive work, how runs are isolated, and how proof of work is
recorded.

## System Model

```text
Linear issue
  -> agent run
  -> isolated workspace
  -> GitHub target repo branch
  -> verification
  -> proof of work
  -> pull request
  -> human review
```

Idea intake follows an earlier path:

```text
ChatGPT web conversation
  -> Idea Pack
  -> intake validation
  -> compiled Linear issue bundle
  -> Linear promotion
  -> reviewed agent-ready work
```

## Main Boundaries

- Linear is the work source.
- GitHub repositories are implementation targets.
- Codex agents perform work.
- This base repo stores process, templates, CLI source, config examples, and
  runbooks.
- ChatGPT web is the high-reasoning product studio for idea refinement.
- Product code lives outside this base repo.

## Repository Areas

- `.agent-harness/config/` - example project, Linear, agent, and workflow configuration.
- `.agent-harness/docs/setup/` - setup instructions.
- `.agent-harness/docs/agents/` - agent operating rules.
- `.agent-harness/docs/UI_UX.md` - reusable UI/UX guidance for future products.
- `.agent-harness/docs/intake/` - ChatGPT web to Linear idea intake model.
- `.agent-harness/docs/linear/` - Linear workspace and issue model.
- `.agent-harness/docs/github/` - GitHub repo, branch, PR, and CI model.
- `.agent-harness/docs/templates/` - reusable templates.
- `.agent-harness/docs/runbooks/` - repeatable operating procedures.
- `.agent-harness/docs/decisions/` - decision records.
- `.agent-harness/src/cli.ts` - the single TypeScript CLI for validation,
  idea intake, Linear promotion, project bootstrap, and agent run entry points.

## Symphony Compatibility

The base follows Symphony-style concepts:

- Repo-owned `.agent-harness/WORKFLOW.md`.
- Isolated run directories.
- Issue-to-run lifecycle.
- Bounded agent permissions.
- Proof-of-work artifacts.
- Linear work-source adapter boundary.
- Codex runner boundary.

The base does not require a database, web UI, or daemon.
