import test from "node:test";
import assert from "node:assert/strict";
import { renderLinearIssueDescription } from "./intake-format.js";

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
  });

  assert.match(description, /## Source Idea/);
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
