# 0003 Use Symphony Style Isolated Agent Runs

## Status

Accepted

## Context

Agents need repeatable execution, isolated workspaces, clear lifecycle states,
and proof of work.

## Decision

Use Symphony-style isolated runs as the target orchestration model.

## Consequences

Workflows must define workspace roots, branch naming, status transitions, and
proof artifacts before unattended runs are enabled.
