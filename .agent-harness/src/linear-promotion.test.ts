import test from "node:test";
import assert from "node:assert/strict";
import { verifyCreatedLinearIssue } from "./cli.js";

test("verifies promoted Linear issues are unarchived and in the target project", () => {
  const errors = verifyCreatedLinearIssue({
    id: "issue-id",
    identifier: "JAS-15",
    archivedAt: null,
    description: "## Source Idea\n\n## Idea Context\n\n## Notes For Agent",
    project: { id: "project-id", slugId: "operator-os" },
  }, {
    projectSlug: "operator-os",
    description: "## Source Idea\n\n## Idea Context\n\n## Notes For Agent",
  });

  assert.deepEqual(errors, []);
});

test("rejects archived or hidden Linear promotion results", () => {
  const errors = verifyCreatedLinearIssue({
    id: "issue-id",
    identifier: "JAS-15",
    archivedAt: "2026-04-30T16:06:03.686Z",
    description: "## Source Idea\n\n## Notes For Agent",
    project: { id: "project-id", slugId: "wrong-project" },
  }, {
    projectSlug: "operator-os",
    description: "## Source Idea\n\n## Idea Context\n\n## Notes For Agent",
  });

  assert.match(errors.join("\n"), /issue is archived/);
  assert.match(errors.join("\n"), /project slug is wrong-project/);
  assert.match(errors.join("\n"), /description is missing marker ## Idea Context/);
});
