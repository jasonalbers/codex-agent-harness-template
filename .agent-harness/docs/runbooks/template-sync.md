# Template Sync Runbook

## Purpose

Template sync gives repositories created from this template a safe way to pull future harness updates without treating product code as template code.

## Why Normal Git Merge Is Not Enough

GitHub template repositories do not preserve shared git history in generated repositories. A derived repository cannot safely merge from the template as if both repos shared a normal ancestor. Template sync works at the file level instead: it fetches the template, compares template-owned files between the last synced template SHA and the latest template SHA, and applies only safe changes.

## Initialize Template Sync

Run this once in a derived repository:

```bash
node .agent-harness/dist/cli.js template init --repo owner/codex-agent-harness-template --ref main
```

This writes `.agent-harness/config/template-sync.json` with the template repo, ref, last synced SHA, and timestamp. Review and commit that state as part of your sync workflow.

## Preview Template Updates

Check whether updates are available:

```bash
node .agent-harness/dist/cli.js template status
```

Preview the file-level plan:

```bash
node .agent-harness/dist/cli.js template sync --dry-run
```

`template sync` is a dry run by default. It does not edit files unless `--apply` is provided.

## Apply Template Updates Safely

Use a branch for the update:

```bash
git checkout -b chore/sync-agent-harness-template
node .agent-harness/dist/cli.js template sync --apply
npm --prefix .agent-harness ci
npm --prefix .agent-harness run build
node .agent-harness/dist/cli.js validate repo
git status --short
```

The command refuses unrelated dirty working-tree changes unless `--force` is provided. The sync state file is managed by the command. It does not create commits, push branches, or open pull requests.

## Conflict Handling

For each changed template-owned file, sync compares:

- Old template content from the last synced SHA.
- New template content from the latest template SHA.
- Current content in the derived repository.

If the current file matches the old template, sync can apply the new template safely. If the current file already matches the new template, it is already synced. If the current file differs from both, sync reports a conflict and skips it unless `--force` is provided.

Use `--force` only after reviewing the dry-run output. It allows overwriting local changes to template-owned files and bypasses the dirty working tree guard.

## Template-Owned Paths

These paths are synced by default:

```text
AGENTS.md
.agent-harness/ARCHITECTURE.md
.agent-harness/WORKFLOW.md
.agent-harness/package.json
.agent-harness/package-lock.json
.agent-harness/tsconfig.json
.agent-harness/src/**
.agent-harness/roles/**
.agent-harness/docs/**
.agent-harness/config/*.example.json
.agent-harness/intake/README.md
.github/pull_request_template.md
.github/workflows/**
.github/ISSUE_TEMPLATE/**
```

## Protected Paths

These paths are never synced:

```text
.agent-harness/config/template-sync.json
.agent-harness/.env
.agent-harness/.env.*
.agent-harness/config/projects.json
.agent-harness/config/*.local.json
.agent-harness/config/*.private.json
.agent-harness/intake/inbox/**
.agent-harness/intake/compiled/**
.agent-harness/intake/promoted/**
.agent-harness/intake/archive/**
.agent-harness/dist/**
.agent-harness/node_modules/**
.agent-harness/build/**
.agent-harness/coverage/**
.agent-harness/.cache/**
.agent-harness/.tmp/**
.agent-harness/.runtime/**
.agent-harness/.symphony/**
```

## Optional Paths

These paths are skipped by default because product repos may customize them:

```text
README.md
.gitignore
```

Include them only when explicitly requested:

```bash
node .agent-harness/dist/cli.js template sync --dry-run --include-readme --include-gitignore
node .agent-harness/dist/cli.js template sync --apply --include-readme --include-gitignore
```

## Recommended PR Workflow

1. Run `template status`.
2. Run `template sync --dry-run`.
3. Create a branch.
4. Run `template sync --apply`.
5. Run `npm --prefix .agent-harness ci`.
6. Run `npm --prefix .agent-harness run build`.
7. Run `node .agent-harness/dist/cli.js validate repo`.
8. Review the diff and open a pull request.
