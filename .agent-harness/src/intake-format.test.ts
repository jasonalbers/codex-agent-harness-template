import test from "node:test";
import assert from "node:assert/strict";
import { formatIdeaLabelName, formatLinearIssueTitle, renderLinearIssueDescription } from "./intake-format.js";

test("formats Linear issue titles with sequence only", () => {
  assert.equal(
    formatLinearIssueTitle({
      title: "Define Operator OS Wave 1 product boundary",
      order: { index: 1, total: 14 },
    }),
    "[01/14] Define Operator OS Wave 1 product boundary",
  );
});

test("formats generic Idea Pack labels from idea ids", () => {
  assert.equal(formatIdeaLabelName("operator-os-generated-disposable-software"), "idea:operator-os-generated-disposable-software");
});

test("renders Linear issue descriptions with concise Idea Context", () => {
  const description = renderLinearIssueDescription({
    metadata: {
      idea_id: "field-service-recovery",
      idea_name: "Field Service Recovery",
    },
    sections: {
      Summary: "Recover missed revenue from missed calls and stale estimates.",
      "Core Workflows": "- Capture missed calls.\n- Follow up on stale estimates.",
      Decisions: "- Start with human-approved outbound messages.",
      Risks: "- Users may distrust automation without proof.",
      "Open Questions": "- Which CRM comes first?",
      "Deferred Ideas": "- AI voice calls.",
    },
    issue: {
      title: "Define recovery status states",
      goal: "Document status states for recovery work.",
      userValue: "Users know what needs attention.",
      acceptanceCriteria: ["- [ ] Status states are documented."],
      outOfScope: "Building the UI.",
      dependencies: "Product owner confirms workflow.",
      verification: "Run documentation validation.",
      notesForAgent: "Use business language.",
    },
    order: { index: 1, total: 3 },
  });

  assert.match(description, /## Source Idea/);
  assert.match(description, /## Agent Execution Order/);
  assert.match(description, /Sequence: 01\/03/);
  assert.match(description, /## Idea Context/);
  assert.match(description, /### Summary/);
  assert.match(description, /Recover missed revenue/);
  assert.match(description, /### Core Workflows/);
  assert.match(description, /Capture missed calls/);
  assert.match(description, /### Decisions/);
  assert.match(description, /human-approved outbound/);
  assert.match(description, /### Risks/);
  assert.match(description, /### Open Questions/);
  assert.match(description, /### Deferred Ideas/);
  assert.match(description, /## Goal/);
  assert.match(description, /## Notes For Agent/);
});
