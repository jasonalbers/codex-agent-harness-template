# Codex Setup

Codex agents are the workers.

The base repo assumes Codex can:

- Read this repository.
- Clone target GitHub repositories.
- Create branches.
- Run validation commands.
- Open pull requests.
- Produce proof of work.

Set the preferred model in `.env`:

```bash
CODEX_MODEL=gpt-5.5
```

Use the current Codex app-server approval policy value:

```bash
CODEX_APPROVAL_POLICY=never
```

`never` is the template default for the trusted local autopilot runner. It is a
valid Codex app-server `AskForApproval` value and avoids Symphony's older
object-form `reject` default, which current Codex app-server builds reject.

Codex worker authentication comes from the local Codex auth file:

```text
~/.codex/auth.json
```

Set `CODEX_AUTH_FILE` only when the auth file lives somewhere else.

Do not store Codex auth files or API keys in tracked files.

When Codex app-server compatibility changes, regenerate the local schema:

```bash
codex app-server generate-json-schema --out /tmp/codex-schema
```

Confirm the generated workflow values still match the schema:

- `codex.approval_policy`: `never`
- `codex.thread_sandbox`: `workspace-write`
- `codex.turn_sandbox_policy.type`: `workspaceWrite`
