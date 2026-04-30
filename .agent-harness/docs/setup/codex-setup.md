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

Codex worker authentication comes from the local Codex auth file:

```text
~/.codex/auth.json
```

Set `CODEX_AUTH_FILE` only when the auth file lives somewhere else.

Do not store Codex auth files or API keys in tracked files.
