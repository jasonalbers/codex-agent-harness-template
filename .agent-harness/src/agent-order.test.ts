import test from "node:test";
import assert from "node:assert/strict";
import { planAgentLifecycleUpdates, planOrderedAgentRun } from "./cli.js";

test("selects the lowest sequenced Ready for Agent issue and holds later ready issues", () => {
  const plan = planOrderedAgentRun([
    {
      id: "issue-3",
      identifier: "JAS-18",
      title: "Third",
      state: { name: "Ready for Agent" },
      description: "## Agent Execution Order\n\n- Sequence: 03/03",
    },
    {
      id: "issue-1",
      identifier: "JAS-16",
      title: "First",
      state: { name: "Ready for Agent" },
      description: "## Agent Execution Order\n\n- Sequence: 01/03",
    },
    {
      id: "issue-2",
      identifier: "JAS-17",
      title: "Second",
      state: { name: "Ready for Agent" },
      description: "## Agent Execution Order\n\n- Sequence: 02/03",
    },
  ]);

  assert.equal(plan.selected?.identifier, "JAS-16");
  assert.deepEqual(plan.holdIssues.map((issue) => issue.identifier), ["JAS-17", "JAS-18"]);
});

test("falls back to identifier order for unsequenced Ready for Agent issues", () => {
  const plan = planOrderedAgentRun([
    { id: "issue-9", identifier: "JAS-9", title: "Nine", state: { name: "Ready for Agent" }, description: "" },
    { id: "issue-5", identifier: "JAS-5", title: "Five", state: { name: "Ready for Agent" }, description: "" },
  ]);

  assert.equal(plan.selected?.identifier, "JAS-5");
  assert.deepEqual(plan.holdIssues.map((issue) => issue.identifier), ["JAS-9"]);
});

test("claims the selected Ready for Agent issue as In Progress before runner start", () => {
  const plan = planOrderedAgentRun([
    { id: "issue-2", identifier: "JAS-2", title: "Second", state: { name: "Ready for Agent" }, description: "## Agent Execution Order\n\n- Sequence: 02/02" },
    { id: "issue-1", identifier: "JAS-1", title: "First", state: { name: "Ready for Agent" }, description: "## Agent Execution Order\n\n- Sequence: 01/02" },
  ]);
  const updates = planAgentLifecycleUpdates(plan, new Map([
    ["Todo", "todo-state"],
    ["In Progress", "in-progress-state"],
  ]), { holdStateName: "Todo", inProgressStateName: "In Progress" });

  assert.deepEqual(updates.errors, []);
  assert.deepEqual(updates.updates, [
    { issue: plan.holdIssues[0], stateId: "todo-state", stateName: "Todo", reason: "hold-later-ready" },
    { issue: plan.selected, stateId: "in-progress-state", stateName: "In Progress", reason: "claim-selected" },
  ]);
});
