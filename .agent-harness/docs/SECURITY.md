# SECURITY.md

## Security Rules

- Never commit secrets, tokens, service-role keys, private connection strings,
  or privileged credentials.
- Do not place secrets in browser code, screenshots, fixtures, generated
  artifacts, logs, or documentation examples.
- Keep tenant isolation explicit when persistence is introduced.
- Gate any external send, mutation, deletion, publish, deployment, charge, or
  schedule behind policy, audit, idempotency, and approval controls.

## Generated Artifacts

Generated artifacts are not trusted by default.

Validate generated specs before rendering or executing them. Generated code
execution is out of scope until an approved sandbox design exists.

## Symphony Security

Symphony requires local credentials such as `LINEAR_API_KEY` and Codex auth.
Store those only in the local environment or ignored `.env` files. Never commit
real tokens or generated runtime workflow files.
