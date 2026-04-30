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

Do not store OpenAI API keys in tracked files.
