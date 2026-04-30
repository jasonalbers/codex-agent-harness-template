# CI Model

The base repo CI validates:

- Required files.
- Required docs structure.
- JSON config examples.
- TypeScript CLI build.
- CLI smoke tests for repository validation and intake promotion dry-runs.
- Secret-like values are not committed.

Future product repositories should add product-specific CI after bootstrapping.
