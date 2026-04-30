# Base Repository Foundation Implementation Plan

**Goal:** Turn this repository into the reusable agent harness base for future projects.

**Current Context:** The repo already contains a Harness Engineering skeleton and draft Symphony scripts. It needs multi-project configuration, Linear/GitHub/Codex setup docs, reusable templates, validation scripts, and runbooks before product work starts.

**Implementation Steps:**

- [x] Inspect current repository contents.
- [x] Read the Harness Engineering and Symphony references.
- [x] Remove product-specific docs from the base.
- [x] Add base project configuration examples.
- [x] Add Linear, GitHub, Codex, Symphony, and local setup docs.
- [x] Add agent operating model docs.
- [x] Add reusable templates and runbooks.
- [x] Add validation and workflow scripts.
- [x] Add GitHub templates and CI validation.
- [x] Validate the base locally.

**Verification Commands:**

```bash
node .agent-harness/dist/cli.js validate env --dry-run
node .agent-harness/dist/cli.js validate repo
node .agent-harness/dist/cli.js project summary
npm --prefix .agent-harness run build
```

**Out Of Scope:**

- Product implementation for any target project.
- A web UI.
- A database.
- A long-running daemon.
- Real Linear issue creation unless credentials are provided and dry-run is disabled.
