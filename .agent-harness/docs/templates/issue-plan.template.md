# Linear Issue Plan Template

Use this file as a starter for `node .agent-harness/dist/cli.js linear create`.

## Issue: Set up repository validation

### Repository

owner/repo

### Goal

Add or improve the validation command for the target repository.

### Acceptance Criteria

- [ ] Required files are checked.
- [ ] Config files are parsed.
- [ ] The command prints clear human-readable output.

### Verification

```bash
node .agent-harness/dist/cli.js validate repo
```

### Out Of Scope

- Product feature work.
- Live external actions.

## Issue: Add proof-of-work template

### Repository

owner/repo

### Goal

Add a reusable proof-of-work artifact for agent runs.

### Acceptance Criteria

- [ ] The proof file records issue, branch, PR, commands, results, risks, and rollback notes.
- [ ] The proof file can be attached to a PR or Linear update.

### Verification

```bash
node .agent-harness/dist/cli.js validate repo
```

### Out Of Scope

- Automated PR creation.
- Live Linear updates.
