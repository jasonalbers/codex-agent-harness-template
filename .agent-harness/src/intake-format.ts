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
  order?: {
    index: number;
    total: number;
  };
};

export type LinearIssueTitleInput = {
  title: string;
  order: {
    index: number;
    total: number;
  };
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

function padOrder(value: number, total: number): string {
  return String(value).padStart(Math.max(2, String(total).length), "0");
}

export function formatLinearIssueTitle(input: LinearIssueTitleInput): string {
  const sequence = `${padOrder(input.order.index, input.order.total)}/${padOrder(input.order.total, input.order.total)}`;
  return `[${sequence}] ${input.title}`;
}

export function formatIdeaLabelName(ideaId: string): string {
  return `idea:${ideaId}`;
}

function renderAgentExecutionOrder(order: { index: number; total: number } | undefined): string[] {
  if (!order) return [];
  return [
    "## Agent Execution Order",
    "",
    `- Sequence: ${padOrder(order.index, order.total)}/${padOrder(order.total, order.total)}`,
    "- Rule: Run lower sequence issues first. If multiple sequenced issues are Ready for Agent, start the lowest sequence first.",
    "",
  ];
}

export function renderLinearIssueDescription(input: LinearIssueDescriptionInput): string {
  const { metadata, sections, issue, order } = input;
  return [
    "## Source Idea", "",
    `- Idea: ${metadata.idea_name}`,
    `- Idea ID: ${metadata.idea_id}`,
    "",
    ...renderAgentExecutionOrder(order),
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
