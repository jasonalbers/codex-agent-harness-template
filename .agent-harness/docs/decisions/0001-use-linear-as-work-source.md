# 0001 Use Linear As Work Source

## Status

Accepted

## Context

Symphony's current reference implementation is Linear-first, and Linear gives a
clear work queue separate from code storage.

## Decision

Use Linear as the source of agent work.

## Consequences

Each project needs a Linear project slug. GitHub Issues can still exist, but
agent execution starts from Linear unless a GitHub adapter is built later.
