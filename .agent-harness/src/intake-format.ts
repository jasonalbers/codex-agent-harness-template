export type LinearIssueForDescription = {
  title: string;
  goal: string;
  userValue: string;
  acceptanceCriteria: string[];
  outOfScope: string;
  dependencies: string;
  verification: string;
  notesForAgent: string;
};

export type LinearIssueDescriptionInput = {
  metadata: Record<string, string>;
  sections: Record<string, string>;
  issue: LinearIssueForDescription;
};

const CONTEXT_SECTIONS = [
  "Summary",
  "Core Workflows",
  "Decisions",
  "Risks",
  "Open Questions",
  "Deferred Ideas",
];

function sectionText(sections: Record<string, string>, name: string): string {
  return (sections[name] || "").trim();
}

function renderIdeaContext(sections: Record<string, string>): string[] {
  const lines = ["## Idea Context", ""];
  for (const section of CONTEXT_SECTIONS) {
    const text = sectionText(sections, section);
    if (!text) continue;
    lines.push(`### ${section}`, "", text, "");
  }
  if (lines.length === 2) {
    lines.push("No broader Idea Pack context was provided.", "");
  }
  return lines;
}

export function renderLinearIssueDescription(input: LinearIssueDescriptionInput): string {
  const { metadata, sections, issue } = input;
  return [
    "## Source Idea", "",
    `- Idea: ${metadata.idea_name}`,
    `- Idea ID: ${metadata.idea_id}`,
    "",
    ...renderIdeaContext(sections),
    "## Goal", "", issue.goal, "",
    "## User Value", "", issue.userValue, "",
    "## Acceptance Criteria", "", ...issue.acceptanceCriteria, "",
    "## Out Of Scope", "", issue.outOfScope, "",
    "## Dependencies", "", issue.dependencies, "",
    "## Verification", "", issue.verification, "",
    "## Notes For Agent", "", issue.notesForAgent,
  ].join("\n");
}
