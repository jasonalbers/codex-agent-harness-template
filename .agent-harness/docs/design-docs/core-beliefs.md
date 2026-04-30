# Core Beliefs

## Humans Steer, Agents Execute

The scarce resource is human attention. The repository should make intent,
constraints, verification, and product judgment legible enough that agents can
do useful work without constant supervision.

## The Repository Is The System Of Record

If an agent cannot read it in the repo, it is not part of the operating system.
Important product direction, architecture, safety rules, plans, and references
must live in versioned files.

## AGENTS.md Is A Map

Long instruction files rot quickly. Keep `AGENTS.md` short and route agents to
indexed source documents.

## Plans Are Artifacts

Execution plans should be checked in, updated, completed, and audited. They are
not disposable chat summaries.

## Generated Does Not Mean Unbounded

Generated behavior must pass through schemas, validators, allowlists, policy
checks, and owner approval.

## Garbage Collection Is Continuous

Technical debt should be captured and paid down continuously through small,
reviewable changes.
