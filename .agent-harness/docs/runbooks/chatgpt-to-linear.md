# ChatGPT To Linear

Use this runbook to turn a high-level ChatGPT web conversation into Linear-ready
work without losing ideas during refinement.

## 1. Start The Workshop In ChatGPT Web

Attach this GitHub repository through the ChatGPT GitHub connector.

Ask ChatGPT to read:

- `README.md`
- `.agent-harness/docs/intake/chatgpt-workshop.md`
- `.agent-harness/docs/intake/idea-pack-format.md`
- `.agent-harness/docs/intake/refinement-stages.md`
- `.agent-harness/docs/intake/linear-promotion-rules.md`
- `.agent-harness/docs/UI_UX.md`

Use the start prompt from `.agent-harness/docs/intake/chatgpt-workshop.md`.

## 2. Refine The Idea

Keep ChatGPT focused on four ledgers:

- Idea Ledger.
- Decision Ledger.
- Deferred or Rejected Ideas Ledger.
- Work Ledger.

Do not ask for Linear issues until the idea reaches `ready-for-linear`.

## 3. Save The Idea Pack

At the end of the ChatGPT session, save the final markdown artifact to:

```text
.agent-harness/intake/inbox/<idea-id>.md
```

## 4. Validate

```bash
npm --prefix .agent-harness run build
node .agent-harness/dist/cli.js intake validate .agent-harness/intake/inbox/<idea-id>.md
```

Fix validation errors in ChatGPT web or by editing the Idea Pack.

## 5. Compile

```bash
node .agent-harness/dist/cli.js intake compile .agent-harness/intake/inbox/<idea-id>.md
```

The compiler writes:

```text
.agent-harness/intake/compiled/<idea-id>/
  source-idea-pack.md
  idea-passport.md
  conversation-ledger.md
  linear-issues.json
  linear-issues.md
  promotion-report.md
```

## 6. Review

Read `promotion-report.md` and `linear-issues.md`.

Confirm:

- No strong idea was silently lost.
- Deferred ideas are preserved.
- Issues are small enough for one pull request.
- Acceptance criteria and verification are clear.
- Unresolved questions are not hidden inside implementation tasks.

## 7. Promote To Linear

Preview first:

```bash
node .agent-harness/dist/cli.js intake promote .agent-harness/intake/compiled/<idea-id> --dry-run
```

Create Linear issues after credentials are configured:

```bash
AGENT_DRY_RUN=false node .agent-harness/dist/cli.js intake promote .agent-harness/intake/compiled/<idea-id>
```

## 8. Start Agent Work

Only after human review, move selected Linear issues to `Ready for Agent`.

Then run:

```bash
node .agent-harness/dist/cli.js agent start --project <project-name> --dry-run
```
