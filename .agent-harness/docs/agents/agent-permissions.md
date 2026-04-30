# Agent Permissions

Agents may:

- Read repository files.
- Create branches in target repos.
- Edit files required by the issue.
- Run local validation commands.
- Open pull requests.
- Update Linear work items when credentials and workflow allow it.

Agents must not:

- Commit secrets.
- Modify unrelated repositories.
- Run live destructive actions without an explicit issue and approval.
- Start work before the issue is moved to `Ready for Agent`.
- Merge without the configured workflow allowing it.
