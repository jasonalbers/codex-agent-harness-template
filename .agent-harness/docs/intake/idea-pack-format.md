# Idea Pack Format

An Idea Pack is the durable bridge between a ChatGPT web conversation and
Linear-ready work.

It must preserve:

- The high-level idea.
- The reasoning and decisions.
- The strong ideas that were deferred.
- The open questions.
- The eventual small work items.

## Required Top-Level Fields

The file must start with:

```text
IDEA_PACK_VERSION: 1
idea_id: short-kebab-case-id
idea_name: Human readable name
stage: raw | refined | ready-for-linear
source: chatgpt-web
```

## Required Sections

- `## Summary`
- `## Target Users`
- `## Problem`
- `## Business Outcome`
- `## Core Workflows`
- `## Idea Ledger`
- `## Deferred Ideas`
- `## Rejected Ideas`
- `## Open Questions`
- `## Decisions`
- `## Risks`
- `## Epics`
- `## Linear Issues`

## Linear Issue Shape

Each issue under `## Linear Issues` must use this structure:

```markdown
### Issue: Short action title

#### Goal

#### User Value

#### Acceptance Criteria

- [ ] Specific result.

#### Out Of Scope

#### Dependencies

#### Verification

#### Notes For Agent
```

If an issue cannot meet this shape, it is not ready for Linear.
