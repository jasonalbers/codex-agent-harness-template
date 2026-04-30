#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { formatIdeaLabelName, formatLinearIssueTitle, renderLinearIssueDescription } from "./intake-format.js";
import { handleTemplateCommand } from "./template-sync.js";

type ParsedArgs = {
  group: string;
  action: string;
  positionals: string[];
  flags: Record<string, string | boolean>;
};

type ProjectConfig = {
  version: number;
  projects: Project[];
};

type Project = {
  name: string;
  repo: string;
  linear_project_slug: string;
  default_branch: string;
  agent_enabled: boolean;
  validation_command?: string;
  notes?: string;
};

type IdeaPack = {
  path: string;
  raw: string;
  metadata: Record<string, string>;
  sections: Record<string, string>;
  issues: LinearIssue[];
};

type LinearIssue = {
  title: string;
  goal: string;
  userValue: string;
  acceptanceCriteria: string[];
  outOfScope: string;
  dependencies: string;
  verification: string;
  notesForAgent: string;
};

type CreatedLinearIssue = {
  id?: string;
  identifier?: string;
  title?: string;
  url?: string;
  archivedAt?: string | null;
  description?: string | null;
  project?: {
    id?: string;
    slugId?: string;
  } | null;
  labels?: {
    nodes?: Array<{ name?: string | null }>;
  } | null;
};

export type AgentOrderIssue = {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
  state?: {
    name?: string | null;
  } | null;
};

export type OrderedAgentRunPlan = {
  selected?: AgentOrderIssue;
  holdIssues: AgentOrderIssue[];
  readyIssues: AgentOrderIssue[];
};

export type AgentLifecycleUpdate = {
  issue: AgentOrderIssue | undefined;
  stateId: string;
  stateName: string;
  reason: "hold-later-ready" | "claim-selected";
};

type AgentClaimResult = {
  code: number;
  selected?: AgentOrderIssue;
  stateIds?: Map<string, string>;
};

type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  pack: IdeaPack;
};

const HARNESS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_ROOT = resolve(HARNESS_ROOT, "..");
const SYMPHONY_UNATTENDED_GUARDRAIL_ACK = "--i-understand-that-this-will-be-running-without-the-usual-guardrails";
const REQUIRED_FILES = [
  "README.md",
  "AGENTS.md",
  ".gitignore",
  ".github/pull_request_template.md",
  ".github/workflows/validate.yml",
  ".agent-harness/ARCHITECTURE.md",
  ".agent-harness/WORKFLOW.md",
  ".agent-harness/package.json",
  ".agent-harness/package-lock.json",
  ".agent-harness/tsconfig.json",
  ".agent-harness/src/cli.ts",
  ".agent-harness/roles/README.md",
  ".agent-harness/roles/chatgpt-web.md",
  ".agent-harness/roles/codex.md",
  ".agent-harness/roles/shared-rules.md",
  ".agent-harness/config/template-sync.json",
  ".agent-harness/config/template-sync.example.json",
  ".agent-harness/docs/README.md",
  ".agent-harness/docs/UI_UX.md",
  ".agent-harness/docs/FRONTEND.md",
  ".agent-harness/docs/intake/chatgpt-workshop.md",
  ".agent-harness/docs/intake/idea-pack-format.md",
  ".agent-harness/docs/intake/refinement-stages.md",
  ".agent-harness/docs/intake/linear-promotion-rules.md",
  ".agent-harness/docs/templates/idea-pack.template.md",
  ".agent-harness/docs/templates/idea-passport.template.md",
  ".agent-harness/docs/templates/conversation-ledger.template.md",
  ".agent-harness/docs/templates/linear-issue-bundle.template.md",
  ".agent-harness/docs/runbooks/chatgpt-to-linear.md",
  ".agent-harness/docs/runbooks/template-sync.md",
  ".agent-harness/intake/README.md",
  ".agent-harness/config/projects.example.json",
  ".agent-harness/config/linear.example.json",
  ".agent-harness/config/agents.example.json",
  ".agent-harness/config/workflow.example.json",
];
const REQUIRED_DIRS = [
  ".agent-harness/roles",
  ".agent-harness/docs/setup",
  ".agent-harness/docs/agents",
  ".agent-harness/docs/linear",
  ".agent-harness/docs/github",
  ".agent-harness/docs/intake",
  ".agent-harness/docs/templates",
  ".agent-harness/docs/runbooks",
  ".agent-harness/docs/decisions",
  ".agent-harness/config",
  ".agent-harness/intake/inbox",
  ".agent-harness/intake/compiled",
  ".github/ISSUE_TEMPLATE",
];
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /lin_api_[A-Za-z0-9_]{20,}/,
];
const PUBLIC_FORBIDDEN = [
  { pattern: /\/home\/[A-Za-z0-9._-]+/, label: "local Unix home path" },
  { pattern: /\/Users\/[A-Za-z0-9._-]+/, label: "local macOS home path" },
  { pattern: /[A-Za-z]:\\Users\\[^\\\s]+/, label: "local Windows home path" },
  { pattern: /\\\\wsl\.localhost\\[^\\]+\\home\\[^\\]+/i, label: "local WSL network path" },
  { pattern: /[A-Za-z0-9._%+-]+@users\.noreply\.github\.com/i, label: "GitHub generated email" },
];
const REQUIRED_METADATA = ["IDEA_PACK_VERSION", "idea_id", "idea_name", "stage", "source"];
const REQUIRED_IDEA_SECTIONS = [
  "Summary",
  "Target Users",
  "Problem",
  "Business Outcome",
  "Core Workflows",
  "Idea Ledger",
  "Deferred Ideas",
  "Rejected Ideas",
  "Open Questions",
  "Decisions",
  "Risks",
  "Epics",
  "Linear Issues",
];
const ISSUE_FIELDS = [
  "Goal",
  "User Value",
  "Acceptance Criteria",
  "Out Of Scope",
  "Dependencies",
  "Verification",
  "Notes For Agent",
];

function usage(): string {
  return [
    "agent-harness CLI",
    "",
    "Setup:",
    "  node .agent-harness/dist/cli.js validate env [--strict] [--dry-run]",
    "  node .agent-harness/dist/cli.js validate repo",
    "  node .agent-harness/dist/cli.js project bootstrap --name <name> --repo <owner/repo> --linear-slug <slug> [--enable-agent] [--dry-run] [--force]",
    "  node .agent-harness/dist/cli.js project summary",
    "",
    "Template sync:",
    "  node .agent-harness/dist/cli.js template init --repo <owner/repo|git-url> [--ref main] [--sha <template-sha>] [--force]",
    "  node .agent-harness/dist/cli.js template status [--repo <owner/repo|git-url>] [--ref main]",
    "  node .agent-harness/dist/cli.js template diff [--from <sha>] [--to <sha|ref>] [--include-readme] [--include-gitignore]",
    "  node .agent-harness/dist/cli.js template sync [--dry-run] [--apply] [--from <sha>] [--to <sha|ref>] [--include-readme] [--include-gitignore] [--force]",
    "",
    "ChatGPT web idea intake:",
    "  node .agent-harness/dist/cli.js intake new --idea-id <id> [--name <name>]",
    "  node .agent-harness/dist/cli.js intake validate <idea-pack.md>",
    "  node .agent-harness/dist/cli.js intake compile <idea-pack.md> [--out <compiled-dir>]",
    "  node .agent-harness/dist/cli.js intake promote <compiled-dir> [--dry-run] [--project-slug <slug>]",
    "",
    "Linear:",
    "  node .agent-harness/dist/cli.js linear create <plan.md|issues.json> [--dry-run] [--project-slug <slug>]",
    "  node .agent-harness/dist/cli.js linear sync [--dry-run] [--project-slug <slug>]",
    "",
    "Agent/Symphony:",
    "  node .agent-harness/dist/cli.js agent start --project <name> [--issue <id>] [--hold-state Todo] [--in-progress-state \"In Progress\"] [--dry-run]",
    "  node .agent-harness/dist/cli.js agent publish --project <name> --issue <identifier> [--dry-run]",
    "  node .agent-harness/dist/cli.js symphony bootstrap",
    "  node .agent-harness/dist/cli.js symphony preflight",
    "  node .agent-harness/dist/cli.js symphony run",
  ].join("\n");
}

function parseArgs(argv: string[]): ParsedArgs {
  const [group = "help", action = "", ...rest] = argv;
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value.startsWith("--")) {
      const key = value.slice(2);
      const next = rest[index + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        index += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(value);
    }
  }
  return { group, action, positionals, flags };
}

function rel(path: string): string {
  return relative(PROJECT_ROOT, path).replaceAll("\\", "/");
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function loadDotenv(): Record<string, string> {
  const candidates = [join(HARNESS_ROOT, ".env"), join(PROJECT_ROOT, ".env")];
  const values: Record<string, string> = {};
  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...parts] = trimmed.split("=");
      values[key.trim()] = parts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
  return values;
}

function env(name: string, dotenv: Record<string, string>): string {
  return process.env[name] ?? dotenv[name] ?? "";
}

function boolValue(value: string | boolean | undefined, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (!value) {
    return fallback;
  }
  return ["1", "true", "yes", "y", "on"].includes(value.toLowerCase());
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) {
    return true;
  }
  return value.toUpperCase() === "PLACEHOLDER" || value.toUpperCase() === "UNSET" || value.includes("replace-with");
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "idea";
}

function run(command: string, args: string[], cwd = PROJECT_ROOT, extraEnv: Record<string, string> = {}): number {
  const childEnv = { ...process.env, ...extraEnv };
  delete childEnv.GITHUB_TOKEN;
  delete childEnv.GH_TOKEN;
  const result = spawnSync(command, args, {
    cwd,
    env: childEnv,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

function capture(command: string, args: string[], cwd = PROJECT_ROOT): { code: number; output: string } {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return { code: result.status ?? 1, output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim() };
}

function printCheck(ok: boolean, message: string): void {
  console.log(`${ok ? "OK" : "ERROR"}: ${message}`);
}

function projectsPath(): string {
  const privatePath = join(HARNESS_ROOT, "config", "projects.json");
  return existsSync(privatePath) ? privatePath : join(HARNESS_ROOT, "config", "projects.example.json");
}

function loadProjects(): ProjectConfig {
  return readJson<ProjectConfig>(projectsPath());
}

function projectByName(name: string): Project | undefined {
  return loadProjects().projects.find((project) => project.name === name);
}

export function codexAuthStatus(values: Record<string, string>, fileExists: (path: string) => boolean = existsSync): { ok: boolean; source: string } {
  const configuredPath = values.CODEX_AUTH_FILE || join(homedir(), ".codex", "auth.json");
  const source = values.CODEX_AUTH_FILE || "~/.codex/auth.json";
  return { ok: fileExists(configuredPath), source };
}

export function githubAuthStatus(
  _values: Record<string, string>,
  runner: () => { code: number; output: string } = () => {
    const result = runQuiet("gh", ["auth", "status", "--hostname", "github.com"]);
    return { code: result.ok ? 0 : 1, output: result.output };
  },
): { ok: boolean; source: string } {
  const result = runner();
  if (result.code === 0) {
    return { ok: true, source: "gh auth status" };
  }
  return { ok: false, source: "gh auth status" };
}

type PublishPreflightResult = {
  ok: boolean;
  checked: string[];
  blockers: string[];
  workspace?: string;
};

type ParentPublishResult = {
  ok: boolean;
  skipped?: boolean;
  branch?: string;
  prUrl?: string;
  message: string;
};

function repoCloneUrl(repo: string): string {
  if (/^(https?:\/\/|git@|ssh:\/\/)/.test(repo)) {
    return repo;
  }
  return `git@github.com:${repo}.git`;
}

function resolveWorkspaceRoot(workspaceRoot: string): string {
  return isAbsolute(workspaceRoot) ? workspaceRoot : resolve(PROJECT_ROOT, workspaceRoot);
}

function runQuiet(command: string, args: string[], cwd = PROJECT_ROOT, extraEnv: Record<string, string> = {}): { ok: boolean; output: string } {
  const childEnv = { ...process.env, ...extraEnv };
  delete childEnv.GITHUB_TOKEN;
  delete childEnv.GH_TOKEN;
  const result = spawnSync(command, args, {
    cwd,
    env: childEnv,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return {
    ok: (result.status ?? 1) === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

export function publishPreflight(repo: string, workspaceRoot: string, envValues: Record<string, string> = {}): PublishPreflightResult {
  const checked: string[] = [];
  const blockers: string[] = [];
  if (!repo || isPlaceholder(repo)) {
    return { ok: false, checked, blockers: ["project repo is missing or a placeholder"] };
  }
  if (!workspaceRoot) {
    return { ok: false, checked, blockers: ["AGENT_WORKSPACE_ROOT is not set"] };
  }
  const resolvedWorkspaceRoot = resolveWorkspaceRoot(workspaceRoot);
  try {
    mkdirSync(resolvedWorkspaceRoot, { recursive: true });
  } catch {
    return { ok: false, checked, blockers: [`AGENT_WORKSPACE_ROOT cannot be created: ${resolvedWorkspaceRoot}`] };
  }
  if (!statSync(resolvedWorkspaceRoot).isDirectory()) {
    return { ok: false, checked, blockers: [`AGENT_WORKSPACE_ROOT is not a directory: ${resolvedWorkspaceRoot}`] };
  }

  const gitVersion = runQuiet("git", ["--version"], PROJECT_ROOT, envValues);
  if (!gitVersion.ok) blockers.push("git is not available to the local runner environment");
  else checked.push("git is available");

  const ghStatus = runQuiet("gh", ["auth", "status", "--hostname", "github.com"], PROJECT_ROOT, envValues);
  if (!ghStatus.ok) blockers.push("GitHub CLI auth is not available to the local runner environment");
  else checked.push("gh auth is available");

  const ghRepo = runQuiet("gh", ["repo", "view", repo, "--json", "nameWithOwner"], PROJECT_ROOT, envValues);
  if (!ghRepo.ok) blockers.push(`GitHub CLI cannot read repo ${repo}`);
  else checked.push(`gh can read ${repo}`);

  if (blockers.length > 0) {
    return { ok: false, checked, blockers };
  }

  const probeDir = mkdtempSync(join(resolvedWorkspaceRoot, ".publish-preflight-"));
  const branchName = `codex/preflight-${Date.now()}`;
  try {
    const clone = runQuiet("git", ["clone", "--depth", "1", repoCloneUrl(repo), "."], probeDir, envValues);
    if (!clone.ok) blockers.push(`git clone failed for ${repo}`);
    else checked.push("workspace clone succeeded");

    if (clone.ok) {
      const gitDir = join(probeDir, ".git");
      const gitWritableProbe = join(gitDir, "agent-harness-write-test");
      try {
        writeFileSync(gitWritableProbe, "ok\n", "utf8");
        rmSync(gitWritableProbe, { force: true });
        checked.push(".git metadata is writable");
      } catch {
        blockers.push("local .git metadata is not writable in the agent workspace");
      }
    }

    if (clone.ok) {
      const branch = runQuiet("git", ["switch", "-c", branchName], probeDir, envValues);
      if (!branch.ok) blockers.push("git cannot create a local publish branch in the agent workspace");
      else checked.push("local publish branch can be created");
    }

    if (clone.ok) {
      const dryPush = runQuiet("git", ["push", "--dry-run", "origin", `HEAD:refs/heads/${branchName}`], probeDir, envValues);
      if (!dryPush.ok) blockers.push("git cannot push a publish branch to the target repo in dry-run mode");
      else checked.push("remote publish branch dry-run succeeded");
    }
  } finally {
    rmSync(probeDir, { recursive: true, force: true });
  }

  return { ok: blockers.length === 0, checked, blockers, workspace: resolvedWorkspaceRoot };
}

export function agentBranchName(issue: AgentOrderIssue): string {
  return `agent/${issue.identifier.toLowerCase()}-${slugify(issue.title).slice(0, 48)}`;
}

function workspaceForIssue(workspaceRoot: string, issue: AgentOrderIssue): string {
  return join(resolveWorkspaceRoot(workspaceRoot), issue.identifier);
}

function publishableStatusLines(workspace: string): string[] {
  const status = runQuiet("git", ["status", "--porcelain=v1"], workspace);
  if (!status.ok || !status.output) return [];
  return status.output.split(/\r?\n/).filter((line) => {
    const path = line.slice(3).trim();
    return path !== ".codex" && !path.startsWith(".codex/");
  });
}

export function hasPublishableChanges(workspace: string): boolean {
  return publishableStatusLines(workspace).length > 0;
}

function parentPublishBody(issue: AgentOrderIssue, project: Project, branch: string): string {
  return [
    "## Summary",
    "",
    `Automated parent CLI publish for Linear issue ${issue.identifier}.`,
    "",
    "## Source",
    "",
    `- Linear issue: ${issue.identifier}`,
    `- Project: ${project.name}`,
    `- Branch: ${branch}`,
    "",
    "## Verification",
    "",
    "Verification was run by the agent worker before parent publish. See the Linear issue and runner logs for command output.",
  ].join("\n");
}

function parentPublishWorkspace(project: Project, issue: AgentOrderIssue, workspaceRoot: string): ParentPublishResult {
  const workspace = workspaceForIssue(workspaceRoot, issue);
  if (!existsSync(workspace)) {
    return { ok: false, message: `agent workspace does not exist: ${workspace}` };
  }
  if (!existsSync(join(workspace, ".git"))) {
    return { ok: false, message: `agent workspace is not a git repository: ${workspace}` };
  }
  if (!hasPublishableChanges(workspace)) {
    return { ok: true, skipped: true, message: "no publishable workspace changes found" };
  }

  const branch = agentBranchName(issue);
  const checkout = runQuiet("git", ["checkout", "-B", branch], workspace);
  if (!checkout.ok) return { ok: false, branch, message: `failed to create publish branch ${branch}: ${checkout.output}` };

  const add = runQuiet("git", ["add", "-A", "--", "."], workspace);
  if (!add.ok) return { ok: false, branch, message: `failed to stage workspace changes: ${add.output}` };
  runQuiet("git", ["reset", "--", ".codex"], workspace);

  if (!hasPublishableChanges(workspace)) {
    return { ok: true, skipped: true, branch, message: "only ignored worker runtime files changed" };
  }

  const commit = runQuiet("git", ["commit", "-m", `[${issue.identifier}] ${issue.title}`], workspace);
  if (!commit.ok) return { ok: false, branch, message: `failed to commit workspace changes: ${commit.output}` };

  const push = runQuiet("git", ["push", "-u", "origin", `HEAD:${branch}`], workspace);
  if (!push.ok) return { ok: false, branch, message: `failed to push publish branch ${branch}: ${push.output}` };

  const title = `[${issue.identifier}] ${issue.title}`;
  const body = parentPublishBody(issue, project, branch);
  const prCreate = runQuiet("gh", ["pr", "create", "--repo", project.repo, "--base", project.default_branch, "--head", branch, "--title", title, "--body", body], workspace);
  if (prCreate.ok) {
    const prUrl = prCreate.output.split(/\r?\n/).find((line) => line.startsWith("https://github.com/"))?.trim();
    return { ok: true, branch, prUrl, message: "published workspace changes and opened pull request" };
  }

  const prView = runQuiet("gh", ["pr", "view", branch, "--repo", project.repo, "--json", "url", "--jq", ".url"], workspace);
  if (prView.ok && prView.output.trim()) {
    return { ok: true, branch, prUrl: prView.output.trim(), message: "published workspace changes and found existing pull request" };
  }
  return { ok: false, branch, message: `failed to open pull request for ${branch}: ${prCreate.output}` };
}

function validateEnv(flags: Record<string, string | boolean>): number {
  const dotenv = loadDotenv();
  const softDefaults = {
    CODEX_MODEL: "gpt-5.5",
    CODEX_APPROVAL_POLICY: "never",
    AGENT_DRY_RUN: "true",
    SYMPHONY_REPO: "https://github.com/openai/symphony.git",
    SYMPHONY_REF: "58cf97da06d556c019ccea20c67f4f77da124bf3",
  };
  const liveRequired = ["LINEAR_API_KEY", "LINEAR_PROJECT_SLUG", "GITHUB_REPO", "AGENT_WORKSPACE_ROOT"];
  const dryRun = Boolean(flags["dry-run"]) || boolValue(env("AGENT_DRY_RUN", dotenv), true);
  const strict = Boolean(flags.strict) || !dryRun;
  const missing: string[] = [];
  const merged = { ...process.env, ...dotenv } as Record<string, string>;

  for (const [name, defaultValue] of Object.entries(softDefaults)) {
    printCheck(true, `${name} is ${env(name, dotenv) ? "set" : `defaulting to ${defaultValue}`}`);
  }
  for (const name of liveRequired) {
    const value = env(name, dotenv);
    if (strict && !value) {
      missing.push(name);
      printCheck(false, `${name} is required for live runs`);
    } else {
      printCheck(true, `${name} is ${value ? "set" : "not set; acceptable in dry-run mode"}`);
    }
  }
  const codexAuth = codexAuthStatus(merged);
  if (strict && !codexAuth.ok) {
    missing.push("CODEX_AUTH_FILE");
    printCheck(false, `Codex auth file is required at ${codexAuth.source}`);
  } else {
    printCheck(true, `Codex auth file ${codexAuth.ok ? `found at ${codexAuth.source}` : `not found at ${codexAuth.source}; acceptable in dry-run mode`}`);
  }
  const githubAuth = githubAuthStatus(merged);
  if (strict && !githubAuth.ok) {
    missing.push("GH_AUTH");
    printCheck(false, "GitHub auth is required from gh auth status");
  } else {
    printCheck(true, `GitHub auth ${githubAuth.ok ? `available from ${githubAuth.source}` : "not available from gh auth status; acceptable in dry-run mode"}`);
  }

  if (missing.length > 0) {
    console.log(`Missing variables: ${[...new Set(missing)].sort().join(", ")}`);
    return 1;
  }
  console.log(`Environment validation completed in ${strict ? "strict/live" : "dry-run"} mode. Secret values were not printed.`);
  return 0;
}

const VALIDATION_IGNORED_RELATIVE_FILES = [
  ".agent-harness/.env",
];

const VALIDATION_IGNORED_RELATIVE_FILE_PATTERNS = [
  /^\.agent-harness\/\.env\..+/,
  /^\.agent-harness\/config\/.+\.local\.json$/,
  /^\.agent-harness\/config\/.+\.private\.json$/,
];

export function textFilesForValidation(relativePath: string): boolean {
  return !VALIDATION_IGNORED_RELATIVE_FILES.includes(relativePath) && !VALIDATION_IGNORED_RELATIVE_FILE_PATTERNS.some((pattern) => pattern.test(relativePath));
}

function textFiles(root: string): string[] {
  const ignoredNames = new Set([".git", "node_modules", "dist", "__pycache__", ".runtime", ".symphony", "openai-symphony"]);
  const ignoredRelativePrefixes = [
    ".agent-harness/intake/inbox/",
    ".agent-harness/intake/compiled/",
    ".agent-harness/intake/promoted/",
    ".agent-harness/intake/archive/",
  ];
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of readdirSync(directory)) {
      if (ignoredNames.has(entry)) continue;
      const fullPath = join(directory, entry);
      const relativePath = rel(fullPath);
      if (!textFilesForValidation(relativePath)) {
        continue;
      }
      if (ignoredRelativePrefixes.some((prefix) => relativePath.startsWith(prefix)) && !relativePath.endsWith(".gitkeep")) {
        continue;
      }
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!stat.isFile()) continue;
      try {
        readFileSync(fullPath, "utf8");
        files.push(fullPath);
      } catch {
        // Binary files are ignored by the text hygiene scan.
      }
    }
  }

  walk(root);
  return files;
}

function validateRepo(): number {
  const errors: string[] = [];
  for (const file of REQUIRED_FILES) {
    const ok = existsSync(join(PROJECT_ROOT, file));
    printCheck(ok, `required file ${file}`);
    if (!ok) errors.push(`missing file ${file}`);
  }
  for (const dir of REQUIRED_DIRS) {
    const ok = existsSync(join(PROJECT_ROOT, dir));
    printCheck(ok, `required directory ${dir}`);
    if (!ok) errors.push(`missing directory ${dir}`);
  }
  for (const jsonFile of [
    ...["agents.example.json", "linear.example.json", "projects.example.json", "template-sync.example.json", "template-sync.json", "workflow.example.json"].map((name) => join(HARNESS_ROOT, "config", name)),
    join(HARNESS_ROOT, "package.json"),
    join(HARNESS_ROOT, "tsconfig.json"),
  ]) {
    try {
      readJson(jsonFile);
      printCheck(true, `valid JSON ${rel(jsonFile)}`);
    } catch (error) {
      printCheck(false, `invalid JSON ${rel(jsonFile)}`);
      errors.push(`${rel(jsonFile)}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const build = capture("npm", ["run", "build", "--silent"], HARNESS_ROOT);
  printCheck(build.code === 0, "TypeScript build");
  if (build.code !== 0) errors.push(build.output || "TypeScript build failed");

  const files = textFiles(PROJECT_ROOT);
  const secretErrors: string[] = [];
  const publicErrors: string[] = [];
  for (const file of files) {
    const relativePath = rel(file);
    const text = readFileSync(file, "utf8");
    if (relativePath !== ".agent-harness/.env.example") {
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(text)) secretErrors.push(`possible secret in ${relativePath}`);
      }
    }
    for (const item of PUBLIC_FORBIDDEN) {
      const match = item.pattern.exec(text);
      if (match) publicErrors.push(`${item.label} in ${relativePath}: ${match[0]}`);
    }
  }
  printCheck(secretErrors.length === 0, "no obvious committed secrets");
  printCheck(publicErrors.length === 0, "no known personal or project-specific markers");
  errors.push(...secretErrors, ...publicErrors);

  if (errors.length > 0) {
    console.log("Validation failed:");
    errors.forEach((error) => console.log(`- ${error}`));
    return 1;
  }
  console.log("Repository validation passed.");
  return 0;
}

function bootstrapProject(flags: Record<string, string | boolean>): number {
  const name = typeof flags.name === "string" ? flags.name : "";
  const repo = typeof flags.repo === "string" ? flags.repo : "";
  const linearSlug = typeof flags["linear-slug"] === "string" ? flags["linear-slug"] : "";
  const defaultBranch = typeof flags["default-branch"] === "string" ? flags["default-branch"] : "main";
  if (!name || !repo || !linearSlug) {
    console.error("--name, --repo, and --linear-slug are required.");
    return 1;
  }

  const path = join(HARNESS_ROOT, "config", "projects.json");
  const config = existsSync(path) ? readJson<ProjectConfig>(path) : readJson<ProjectConfig>(join(HARNESS_ROOT, "config", "projects.example.json"));
  const entry: Project = {
    name,
    repo,
    linear_project_slug: linearSlug,
    default_branch: defaultBranch,
    agent_enabled: Boolean(flags["enable-agent"]) && !isPlaceholder(linearSlug),
    validation_command: "node .agent-harness/dist/cli.js validate repo",
    notes: "Generated by agent-harness project bootstrap.",
  };
  const existing = config.projects.find((project) => project.name === name);

  const docPath = join(HARNESS_ROOT, "docs", "projects", `${slugify(name)}.md`);
  if (flags["dry-run"]) {
    console.log(`Dry run: would update ${rel(path)}`);
    console.log(`Dry run: would write ${rel(docPath)}`);
    console.log(`Project: ${entry.name}`);
    console.log(`Repo: ${entry.repo}`);
    console.log(`Linear slug: ${entry.linear_project_slug}`);
    console.log(`Agent enabled: ${entry.agent_enabled}`);
    return 0;
  }
  if (existing && !flags.force) {
    console.error(`Project ${name} already exists. Re-run with --force to update it.`);
    return 1;
  }
  if (existsSync(docPath) && !flags.force) {
    console.error(`${rel(docPath)} already exists. Re-run with --force to overwrite it.`);
    return 1;
  }
  if (existing) Object.assign(existing, entry);
  else config.projects.push(entry);
  writeJson(path, config);
  mkdirSync(dirname(docPath), { recursive: true });
  writeFileSync(docPath, [
    `# ${name}`,
    "",
    "## GitHub",
    "",
    `- Repo: \`${repo}\``,
    `- Default branch: \`${defaultBranch}\``,
    "",
    "## Linear",
    "",
    `- Project slug: \`${linearSlug}\``,
    `- Agent enabled: \`${entry.agent_enabled}\``,
    "",
  ].join("\n"), "utf8");
  console.log(`Updated ${rel(path)}`);
  console.log(`Wrote ${rel(docPath)}`);
  return 0;
}

function summarizeProjects(): number {
  const dotenv = loadDotenv();
  const config = loadProjects();
  const envRequirements = ["LINEAR_API_KEY", "AGENT_WORKSPACE_ROOT"];
  const githubAuth = githubAuthStatus({ ...process.env, ...dotenv } as Record<string, string>);
  console.log(`Configured projects: ${config.projects.length}`);
  for (const project of config.projects) {
    const missing: string[] = [];
    if (isPlaceholder(project.linear_project_slug)) missing.push("linear_project_slug");
    if (!project.agent_enabled) missing.push("agent_enabled");
    for (const name of envRequirements) {
      if (!env(name, dotenv)) missing.push(name);
    }
    if (!githubAuth.ok) missing.push("gh auth status");
    console.log("");
    console.log(`${project.name}:`);
    console.log(`  repo: ${project.repo}`);
    console.log(`  linear_project_slug: ${project.linear_project_slug}`);
    console.log(`  agent_enabled: ${project.agent_enabled}`);
    console.log(`  ready: ${missing.length === 0}`);
    if (missing.length > 0) console.log(`  missing: ${missing.join(", ")}`);
  }
  return 0;
}

type IssueBundleItem = {
  title: string;
  description: string;
  labels?: string[];
};

function parseMarkdownIssues(path: string): IssueBundleItem[] {
  const text = readFileSync(path, "utf8");
  const issues: IssueBundleItem[] = [];
  const chunks = text.split(/^##\s+/m).slice(1);
  for (const chunk of chunks) {
    const [title = "", ...rest] = chunk.trim().split(/\r?\n/);
    if (title) issues.push({ title: title.trim(), description: rest.join("\n").trim() });
  }
  return issues;
}

function loadIssueBundle(path: string): IssueBundleItem[] {
  if (path.endsWith(".json")) {
    const data = readJson<any>(path);
    return Array.isArray(data) ? data : data.issues ?? [];
  }
  return parseMarkdownIssues(path);
}

export function linearIssueLabelsInput(labels: string[] | undefined): string[] | undefined {
  const names = (labels ?? []).map((label) => label.trim()).filter(Boolean);
  return names.length > 0 ? names : undefined;
}

async function resolveLinearIssueLabelIds(apiKey: string, teamId: string, labelNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of labelNames) {
    const existing = await linearGraphql(apiKey, `
      query IssueLabelByName($name: String!, $teamId: ID!) {
        issueLabels(first: 1, filter: { name: { eq: $name }, team: { id: { eq: $teamId } } }) {
          nodes { id name }
        }
      }
    `, { name, teamId });
    const existingId = existing.data?.issueLabels?.nodes?.[0]?.id;
    if (existingId) {
      ids.push(existingId);
      continue;
    }
    const created = await linearGraphql(apiKey, `
      mutation IssueLabelCreate($input: IssueLabelCreateInput!) {
        issueLabelCreate(input: $input) { success issueLabel { id name } }
      }
    `, { input: { name, teamId } });
    const createdId = created.data?.issueLabelCreate?.issueLabel?.id;
    if (!created.data?.issueLabelCreate?.success || !createdId) {
      throw new Error(`Failed to create Linear issue label: ${name}`);
    }
    ids.push(createdId);
  }
  return ids;
}

function issueNumber(identifier: string): number {
  const match = identifier.match(/-(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function issueSequence(description: string | null | undefined): number {
  const match = (description || "").match(/^\s*-\s*Sequence:\s*(\d+)\s*\/\s*\d+\s*$/m);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function compareAgentOrder(a: AgentOrderIssue, b: AgentOrderIssue): number {
  const sequenceDiff = issueSequence(a.description) - issueSequence(b.description);
  if (sequenceDiff !== 0) return sequenceDiff;
  const numberDiff = issueNumber(a.identifier) - issueNumber(b.identifier);
  if (numberDiff !== 0) return numberDiff;
  return a.identifier.localeCompare(b.identifier);
}

export function planOrderedAgentRun(issues: AgentOrderIssue[]): OrderedAgentRunPlan {
  const readyIssues = issues
    .filter((issue) => issue.state?.name === "Ready for Agent")
    .sort(compareAgentOrder);
  const [selected, ...holdIssues] = readyIssues;
  return { selected, holdIssues, readyIssues };
}

export function planAgentLifecycleUpdates(
  plan: OrderedAgentRunPlan,
  stateIds: Map<string, string>,
  options: { holdStateName: string; inProgressStateName: string },
): { updates: AgentLifecycleUpdate[]; errors: string[] } {
  const updates: AgentLifecycleUpdate[] = [];
  const errors: string[] = [];
  if (plan.holdIssues.length > 0) {
    const holdStateId = stateIds.get(options.holdStateName);
    if (!holdStateId) {
      errors.push(`Cannot hold later Ready for Agent issues because Linear state ${options.holdStateName} was not found.`);
    } else {
      updates.push(...plan.holdIssues.map((issue) => ({
        issue,
        stateId: holdStateId,
        stateName: options.holdStateName,
        reason: "hold-later-ready" as const,
      })));
    }
  }
  if (plan.selected) {
    const inProgressStateId = stateIds.get(options.inProgressStateName);
    if (!inProgressStateId) {
      errors.push(`Cannot claim selected issue because Linear state ${options.inProgressStateName} was not found.`);
    } else {
      updates.push({
        issue: plan.selected,
        stateId: inProgressStateId,
        stateName: options.inProgressStateName,
        reason: "claim-selected",
      });
    }
  }
  return { updates, errors };
}

async function linearGraphql(apiKey: string, query: string, variables: Record<string, unknown>): Promise<Record<string, any>> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Linear request failed: ${response.status} ${response.statusText}`);
  const body = (await response.json()) as Record<string, any>;
  if (body.errors?.length) {
    const messages = body.errors.map((error: { message?: string }) => error.message || "Unknown Linear error").join("; ");
    throw new Error(`Linear GraphQL error: ${messages}`);
  }
  return body;
}

function descriptionMarkers(description: string): string[] {
  const headings = [...description.matchAll(/^##\s+.+$/gm)].map((match) => match[0].trim());
  if (headings.length > 0) return headings;
  const firstLine = description.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ? [firstLine] : [];
}

export function verifyCreatedLinearIssue(issue: CreatedLinearIssue, expected: { projectId: string; description: string; labels?: string[] }): string[] {
  const label = issue.identifier || issue.title || issue.id || "unknown issue";
  const errors: string[] = [];
  if (!issue.id) errors.push(`${label}: missing Linear issue id`);
  if (issue.archivedAt) errors.push(`${label}: issue is archived at ${issue.archivedAt}`);
  if (issue.project?.id !== expected.projectId) {
    errors.push(`${label}: project id is ${issue.project?.id || "missing"}, expected ${expected.projectId}`);
  }
  const actualDescription = issue.description || "";
  for (const marker of descriptionMarkers(expected.description)) {
    if (!actualDescription.includes(marker)) errors.push(`${label}: description is missing marker ${marker}`);
  }
  const actualLabels = new Set((issue.labels?.nodes ?? []).map((node) => node.name).filter(Boolean));
  for (const expectedLabel of expected.labels ?? []) {
    if (!actualLabels.has(expectedLabel)) errors.push(`${label}: missing label ${expectedLabel}`);
  }
  return errors;
}

async function fetchProjectIssueIds(apiKey: string, projectId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let after: string | null = null;
  do {
    const result = await linearGraphql(apiKey, `
      query ProjectIssueIds($id: String!, $after: String) {
        project(id: $id) {
          issues(first: 100, after: $after) {
            nodes { id }
            pageInfo { hasNextPage endCursor }
          }
        }
      }
    `, { id: projectId, after });
    const page = result.data?.project?.issues;
    for (const issue of page?.nodes ?? []) ids.add(issue.id);
    after = page?.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return ids;
}

async function verifyLinearPromotion(apiKey: string, projectId: string, projectSlug: string, created: Array<{ id: string; expectedDescription: string; expectedLabels?: string[] }>): Promise<string[]> {
  const errors: string[] = [];
  const projectIssueIds = await fetchProjectIssueIds(apiKey, projectId);
  for (const createdIssue of created) {
    const result = await linearGraphql(apiKey, `
      query CreatedIssueVerification($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          archivedAt
          description
          project { id slugId }
          labels(first: 20) { nodes { name } }
        }
      }
    `, { id: createdIssue.id });
    const issue = result.data?.issue as CreatedLinearIssue | undefined;
    errors.push(...verifyCreatedLinearIssue(issue ?? {}, { projectId, description: createdIssue.expectedDescription, labels: createdIssue.expectedLabels }));
    if (!projectIssueIds.has(createdIssue.id)) {
      errors.push(`${issue?.identifier || createdIssue.id}: issue does not appear in the target project's normal issue list`);
    }
  }
  return errors;
}

async function fetchOrderedAgentIssues(apiKey: string, projectSlug: string): Promise<{ projectId: string; readyIssues: AgentOrderIssue[]; stateIds: Map<string, string> } | undefined> {
  const result = await linearGraphql(apiKey, `
    query AgentOrderProject($slug: String!) {
      projects(filter: { slugId: { eq: $slug } }, first: 1) {
        nodes {
          id
          teams(first: 10) {
            nodes {
              states(first: 100) { nodes { id name } }
            }
          }
          issues(first: 100) {
            nodes {
              id
              identifier
              title
              description
              state { name }
            }
          }
        }
      }
    }
  `, { slug: projectSlug });
  const project = result.data?.projects?.nodes?.[0];
  if (!project?.id) return undefined;
  const stateIds = new Map<string, string>();
  for (const team of project.teams?.nodes ?? []) {
    for (const state of team.states?.nodes ?? []) {
      if (state.name && state.id && !stateIds.has(state.name)) stateIds.set(state.name, state.id);
    }
  }
  return {
    projectId: project.id,
    readyIssues: (project.issues?.nodes ?? []) as AgentOrderIssue[],
    stateIds,
  };
}

async function fetchAgentIssueByIdentifier(apiKey: string, projectSlug: string, identifier: string): Promise<{ issue: AgentOrderIssue; stateIds: Map<string, string> } | undefined> {
  const context = await fetchOrderedAgentIssues(apiKey, projectSlug);
  const issue = context?.readyIssues.find((candidate) => candidate.identifier.toLowerCase() === identifier.toLowerCase());
  if (!context || !issue) return undefined;
  return { issue, stateIds: context.stateIds };
}

async function updateLinearIssueState(apiKey: string, issue: AgentOrderIssue, stateId: string, stateName: string): Promise<void> {
  await linearGraphql(apiKey, `
    mutation UpdateAgentIssueState($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) { success issue { identifier state { name } } }
    }
  `, { id: issue.id, input: { stateId } });
  console.log(`Updated issue state: ${issue.identifier} -> ${stateName}`);
}

async function addLinearIssueComment(apiKey: string, issue: AgentOrderIssue, body: string): Promise<void> {
  await linearGraphql(apiKey, `
    mutation AddAgentIssueComment($input: CommentCreateInput!) {
      commentCreate(input: $input) { success comment { id } }
    }
  `, { input: { issueId: issue.id, body } });
  console.log(`Added comment to ${issue.identifier}`);
}

export function agentBlockedCommentBody(result: { command: string; exitCode: number }): string {
  return [
    "Agent runner exited before completing work.",
    "",
    `Command: \`${result.command}\``,
    `Exit code: \`${result.exitCode}\``,
    "",
    "The issue was moved to `Blocked` so a human can inspect the local runner logs, fix the setup or command failure, and move the issue back to `Changes Requested` or `Ready for Agent` when it is safe to retry.",
  ].join("\n");
}

function parentPublishCommentBody(result: ParentPublishResult): string {
  return [
    "Parent CLI publish completed after the agent worker finished implementation and verification.",
    "",
    `Branch: \`${result.branch || "not created"}\``,
    `Pull request: ${result.prUrl || "not available"}`,
    "",
    result.message,
  ].join("\n");
}

async function markIssueReadyToMerge(apiKey: string, issue: AgentOrderIssue, stateIds: Map<string, string>, body: string): Promise<void> {
  const readyStateId = stateIds.get("Ready to Merge");
  if (!readyStateId) {
    console.error("Parent publish succeeded, but Linear state Ready to Merge was not found.");
    return;
  }
  await updateLinearIssueState(apiKey, issue, readyStateId, "Ready to Merge");
  await addLinearIssueComment(apiKey, issue, body);
}

async function markIssueBlocked(apiKey: string, issue: AgentOrderIssue, stateIds: Map<string, string>, body: string): Promise<void> {
  const blockedStateId = stateIds.get("Blocked");
  if (!blockedStateId) {
    console.error("Runner failed, but Linear state Blocked was not found.");
    return;
  }
  await updateLinearIssueState(apiKey, issue, blockedStateId, "Blocked");
  await addLinearIssueComment(apiKey, issue, body);
}

async function enforceAgentIssueOrder(apiKey: string, projectSlug: string, holdStateName: string, inProgressStateName: string): Promise<AgentClaimResult> {
  const context = await fetchOrderedAgentIssues(apiKey, projectSlug);
  if (!context) {
    console.error(`No Linear project found for slug ${projectSlug}.`);
    return { code: 1 };
  }
  const plan = planOrderedAgentRun(context.readyIssues);
  if (!plan.selected) {
    console.error(`No Ready for Agent issues found in project ${projectSlug}.`);
    return { code: 1 };
  }
  console.log(`Next Ready for Agent issue: ${plan.selected.identifier} ${plan.selected.title}`);
  const lifecycle = planAgentLifecycleUpdates(plan, context.stateIds, { holdStateName, inProgressStateName });
  if (lifecycle.errors.length > 0) {
    lifecycle.errors.forEach((error) => console.error(error));
    return { code: 1 };
  }
  for (const update of lifecycle.updates) {
    if (!update.issue) continue;
    await updateLinearIssueState(apiKey, update.issue, update.stateId, update.stateName);
  }
  return { code: 0, selected: plan.selected, stateIds: context.stateIds };
}

async function createLinearIssues(path: string, flags: Record<string, string | boolean>): Promise<number> {
  if (!path || !existsSync(path)) {
    console.error("A markdown or JSON issue plan path is required.");
    return 1;
  }
  const dotenv = loadDotenv();
  const dryRun = Boolean(flags["dry-run"]) || boolValue(env("AGENT_DRY_RUN", dotenv), true);
  const apiKey = env("LINEAR_API_KEY", dotenv);
  const projectSlug = String(flags["project-slug"] || env("LINEAR_PROJECT_SLUG", dotenv));
  const issues = loadIssueBundle(path);
  if (issues.length === 0) {
    console.error("No issues found.");
    return 1;
  }
  console.log(`Loaded ${issues.length} issue(s).`);
  issues.forEach((issue) => console.log(`- ${issue.title}`));
  if (dryRun) {
    console.log("Dry run: no Linear issues created.");
    return 0;
  }
  return createLinearIssuesLive(issues, apiKey, projectSlug);
}

async function createLinearIssuesLive(issues: IssueBundleItem[], apiKey: string, projectSlug: string): Promise<number> {
  if (!apiKey || !projectSlug) {
    console.error("LINEAR_API_KEY and LINEAR_PROJECT_SLUG are required for live issue creation.");
    return 1;
  }
  const lookup = await linearGraphql(apiKey, `
    query ProjectBySlug($slug: String!) {
      projects(filter: { slugId: { eq: $slug } }, first: 1) {
        nodes { id teams { nodes { id } } }
      }
    }
  `, { slug: projectSlug });
  const node = lookup.data?.projects?.nodes?.[0];
  const projectId = node?.id;
  const teamId = node?.teams?.nodes?.[0]?.id;
  if (!projectId || !teamId) {
    console.error(`No Linear project/team found for slug ${projectSlug}.`);
    return 1;
  }
  const labelIdsByName = new Map<string, string>();
  for (const labelName of [...new Set(issues.flatMap((issue) => issue.labels ?? []))]) {
    const [labelId] = await resolveLinearIssueLabelIds(apiKey, teamId, [labelName]);
    labelIdsByName.set(labelName, labelId);
  }
  const createdIssues: Array<{ id: string; expectedDescription: string; expectedLabels?: string[] }> = [];
  for (const issue of issues) {
    const labelNames = linearIssueLabelsInput(issue.labels) ?? [];
    const labelIds = labelNames.map((label) => labelIdsByName.get(label)).filter((id): id is string => Boolean(id));
    const result = await linearGraphql(apiKey, `
      mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) { success issue { id identifier title url } }
      }
    `, { input: { teamId, projectId, title: issue.title, description: issue.description, labelIds } });
    const created = result.data?.issueCreate?.issue;
    if (!result.data?.issueCreate?.success || !created?.id) {
      console.error(`Failed to create Linear issue: ${issue.title}`);
      return 1;
    }
    createdIssues.push({ id: created.id, expectedDescription: issue.description, expectedLabels: labelNames });
    console.log(`Created ${created?.identifier}: ${created?.url}`);
  }
  const verificationErrors = await verifyLinearPromotion(apiKey, projectId, projectSlug, createdIssues);
  if (verificationErrors.length > 0) {
    console.error("Linear promotion verification failed:");
    verificationErrors.forEach((error) => console.error(`- ${error}`));
    return 1;
  }
  console.log(`Verified ${createdIssues.length} Linear issue(s) are unarchived, in project ${projectSlug}, and have expected description content.`);
  return 0;
}

async function syncLinear(flags: Record<string, string | boolean>): Promise<number> {
  const dotenv = loadDotenv();
  const dryRun = Boolean(flags["dry-run"]) || boolValue(env("AGENT_DRY_RUN", dotenv), true);
  const apiKey = env("LINEAR_API_KEY", dotenv);
  const projectSlug = String(flags["project-slug"] || env("LINEAR_PROJECT_SLUG", dotenv));
  if (dryRun || !apiKey || !projectSlug) {
    console.log("Dry run or missing Linear credentials. No API request made.");
    console.log(`Project slug: ${projectSlug || "not set"}`);
    return 0;
  }
  const result = await linearGraphql(apiKey, `
    query ProjectSummary($slug: String!) {
      projects(filter: { slugId: { eq: $slug } }, first: 1) {
        nodes {
          name
          slugId
          issues(first: 20) { nodes { identifier title state { name } url } }
        }
      }
    }
  `, { slug: projectSlug });
  const out = join(HARNESS_ROOT, "docs", "generated", "linear-summary.json");
  writeJson(out, result.data ?? result);
  console.log(`Wrote ${rel(out)}`);
  return 0;
}

function sectionName(value: string): string {
  return value.trim().replace(/:$/, "");
}

function parseIdeaPack(path: string): IdeaPack {
  const raw = readFileSync(path, "utf8");
  const metadata: Record<string, string> = {};
  const sections: Record<string, string> = {};
  let currentSection = "";
  let body: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const meta = line.match(/^([A-Z_]+|[a-z_]+):\s*(.*)$/);
    if (!currentSection && meta) {
      metadata[meta[1]] = meta[2].trim();
      continue;
    }
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      if (currentSection) sections[currentSection] = body.join("\n").trim();
      currentSection = sectionName(heading[1]);
      body = [];
      continue;
    }
    if (currentSection) body.push(line);
  }
  if (currentSection) sections[currentSection] = body.join("\n").trim();
  return { path, raw, metadata, sections, issues: parseIntakeIssues(sections["Linear Issues"] ?? "") };
}

function parseIssueField(text: string, field: string): string {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`(?:^|\\r?\\n)####\\s+${escaped}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n####\\s+|$)`));
  return match ? match[1].trim() : "";
}

function parseIntakeIssues(text: string): LinearIssue[] {
  return text.split(/^###\s+Issue:\s+/m).slice(1).map((chunk) => {
    const [titleLine = "", ...rest] = chunk.split(/\r?\n/);
    const body = rest.join("\n");
    return {
      title: titleLine.trim(),
      goal: parseIssueField(body, "Goal"),
      userValue: parseIssueField(body, "User Value"),
      acceptanceCriteria: parseIssueField(body, "Acceptance Criteria").split(/\r?\n/).map((line) => line.trim()).filter((line) => /^-\s+\[[ xX]\]\s+/.test(line)),
      outOfScope: parseIssueField(body, "Out Of Scope"),
      dependencies: parseIssueField(body, "Dependencies"),
      verification: parseIssueField(body, "Verification"),
      notesForAgent: parseIssueField(body, "Notes For Agent"),
    };
  });
}

function fieldToKey(field: string): keyof LinearIssue {
  return {
    Goal: "goal",
    "User Value": "userValue",
    "Acceptance Criteria": "acceptanceCriteria",
    "Out Of Scope": "outOfScope",
    Dependencies: "dependencies",
    Verification: "verification",
    "Notes For Agent": "notesForAgent",
  }[field] as keyof LinearIssue;
}

function validateIdeaPack(path: string): ValidationResult {
  const pack = parseIdeaPack(path);
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const key of REQUIRED_METADATA) if (!pack.metadata[key]) errors.push(`Missing metadata: ${key}`);
  if (pack.metadata.IDEA_PACK_VERSION && pack.metadata.IDEA_PACK_VERSION !== "1") errors.push("IDEA_PACK_VERSION must be 1");
  if (pack.metadata.idea_id && pack.metadata.idea_id !== slugify(pack.metadata.idea_id)) errors.push("idea_id must be kebab-case");
  if (pack.metadata.stage !== "ready-for-linear") warnings.push("stage is not ready-for-linear; promotion should stay in dry-run until reviewed.");
  for (const section of REQUIRED_IDEA_SECTIONS) if (!pack.sections[section]) errors.push(`Missing section: ## ${section}`);
  if (pack.issues.length === 0) errors.push("No Linear issues found. Add issues under ## Linear Issues using ### Issue: <title>.");
  pack.issues.forEach((issue, index) => {
    const label = `Issue ${index + 1}${issue.title ? ` (${issue.title})` : ""}`;
    if (!issue.title) errors.push(`${label}: missing title`);
    for (const field of ISSUE_FIELDS) {
      const value = issue[fieldToKey(field)];
      if (Array.isArray(value) ? value.length === 0 : !value.trim()) errors.push(`${label}: missing ${field}`);
    }
  });
  return { ok: errors.length === 0, errors, warnings, pack };
}

function printIdeaValidation(result: ValidationResult): void {
  console.log(`Idea Pack: ${result.pack.path}`);
  console.log(`Idea: ${result.pack.metadata.idea_name || "unknown"} (${result.pack.metadata.idea_id || "missing id"})`);
  console.log(`Issues: ${result.pack.issues.length}`);
  result.warnings.forEach((warning) => console.log(`WARN: ${warning}`));
  result.errors.forEach((error) => console.log(`ERROR: ${error}`));
  console.log(result.ok ? "Idea Pack validation passed." : "Idea Pack validation failed.");
}

function issueDescription(issue: LinearIssue, pack: IdeaPack, order?: { index: number; total: number }): string {
  return renderLinearIssueDescription({ metadata: pack.metadata, sections: pack.sections, issue, order });
}

function writeCompiledPack(pack: IdeaPack, outDir: string): void {
  mkdirSync(outDir, { recursive: true });
  const issues = pack.issues.map((issue, index) => ({
    title: formatLinearIssueTitle({
      title: issue.title,
      order: { index: index + 1, total: pack.issues.length },
    }),
    labels: [formatIdeaLabelName(pack.metadata.idea_id)],
    description: issueDescription(issue, pack, { index: index + 1, total: pack.issues.length }),
  }));
  writeFileSync(join(outDir, "source-idea-pack.md"), pack.raw, "utf8");
  writeFileSync(join(outDir, "idea-passport.md"), renderIdeaPassport(pack), "utf8");
  writeFileSync(join(outDir, "conversation-ledger.md"), renderConversationLedger(pack), "utf8");
  writeFileSync(join(outDir, "linear-issues.json"), `${JSON.stringify({ issues }, null, 2)}\n`, "utf8");
  writeFileSync(join(outDir, "linear-issues.md"), ["# Linear Issue Bundle", "", `Source idea: ${pack.metadata.idea_name}`, "", ...pack.issues.flatMap((issue, index) => {
    const order = { index: index + 1, total: pack.issues.length };
    return [`## Issue: ${formatLinearIssueTitle({ title: issue.title, order })}`, "", `Labels: ${formatIdeaLabelName(pack.metadata.idea_id)}`, "", issueDescription(issue, pack, order), ""];
  })].join("\n"), "utf8");
  writeFileSync(join(outDir, "promotion-report.md"), ["# Promotion Report", "", `- Idea ID: ${pack.metadata.idea_id}`, `- Idea name: ${pack.metadata.idea_name}`, `- Issues ready for Linear: ${pack.issues.length}`, "", "## Approval Checklist", "", "- [ ] Idea Pack validation passed.", "- [ ] Open questions are answered or explicitly deferred.", "- [ ] Deferred ideas are preserved.", "- [ ] Each issue is small enough for one pull request.", "- [ ] Created Linear issues should not be moved to Ready for Agent until reviewed."].join("\n"), "utf8");
}

function renderIdeaPassport(pack: IdeaPack): string {
  return ["# Idea Passport", "", `- Idea ID: ${pack.metadata.idea_id}`, `- Idea name: ${pack.metadata.idea_name}`, `- Stage: ${pack.metadata.stage}`, `- Source: ${pack.metadata.source}`, "", "## Summary", "", pack.sections.Summary, "", "## Target Users", "", pack.sections["Target Users"], "", "## Problem", "", pack.sections.Problem, "", "## Business Outcome", "", pack.sections["Business Outcome"], "", "## Core Workflows", "", pack.sections["Core Workflows"]].join("\n");
}

function renderConversationLedger(pack: IdeaPack): string {
  return ["# Conversation Ledger", "", "## Idea Ledger", "", pack.sections["Idea Ledger"], "", "## Decisions", "", pack.sections.Decisions, "", "## Deferred Ideas", "", pack.sections["Deferred Ideas"], "", "## Rejected Ideas", "", pack.sections["Rejected Ideas"], "", "## Open Questions", "", pack.sections["Open Questions"], "", "## Risks", "", pack.sections.Risks].join("\n");
}

function intakeNew(flags: Record<string, string | boolean>): number {
  const ideaId = typeof flags["idea-id"] === "string" ? slugify(flags["idea-id"]) : "";
  if (!ideaId) {
    console.error("--idea-id is required.");
    return 1;
  }
  const name = typeof flags.name === "string" ? flags.name : ideaId.replace(/-/g, " ");
  const template = readFileSync(join(HARNESS_ROOT, "docs", "templates", "idea-pack.template.md"), "utf8").replace(/^idea_id: .+$/m, `idea_id: ${ideaId}`).replace(/^idea_name: .+$/m, `idea_name: ${name}`);
  const target = join(HARNESS_ROOT, "intake", "inbox", `${ideaId}.md`);
  if (existsSync(target)) {
    console.error(`Refusing to overwrite existing file: ${rel(target)}`);
    return 1;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, template, "utf8");
  console.log(`Created ${rel(target)}`);
  return 0;
}

function intakeValidate(path: string): number {
  const result = validateIdeaPack(resolve(PROJECT_ROOT, path));
  printIdeaValidation(result);
  return result.ok ? 0 : 1;
}

function intakeCompile(path: string, flags: Record<string, string | boolean>): number {
  const result = validateIdeaPack(resolve(PROJECT_ROOT, path));
  printIdeaValidation(result);
  if (!result.ok) return 1;
  const ideaId = result.pack.metadata.idea_id || slugify(basename(path, ".md"));
  const outDir = typeof flags.out === "string" ? resolve(PROJECT_ROOT, flags.out) : join(HARNESS_ROOT, "intake", "compiled", ideaId);
  writeCompiledPack(result.pack, outDir);
  console.log(`Compiled Idea Pack to ${rel(outDir)}`);
  return 0;
}

async function intakePromote(compiledDir: string, flags: Record<string, string | boolean>): Promise<number> {
  const bundlePath = join(resolve(PROJECT_ROOT, compiledDir), "linear-issues.json");
  if (!existsSync(bundlePath)) {
    console.error(`Missing ${rel(bundlePath)}. Run intake compile first.`);
    return 1;
  }
  return createLinearIssues(bundlePath, flags);
}

function symphonyRoot(): string {
  return join(HARNESS_ROOT, ".symphony");
}

const SYMPHONY_MCP_ELICITATION_PATCH_MARKER = "mcpServer/elicitation/request";

const SYMPHONY_MCP_ELICITATION_PATCH = `  defp maybe_handle_approval_request(
         port,
         "mcpServer/elicitation/request",
         %{"id" => id} = payload,
         payload_string,
         on_message,
         metadata,
         _tool_executor,
         _auto_approve_requests
       ) do
    send_message(port, %{
      "id" => id,
      "result" => %{
        "action" => "decline",
        "content" => nil
      }
    })

    emit_message(
      on_message,
      :tool_input_auto_answered,
      %{payload: payload, raw: payload_string, answer: @non_interactive_tool_input_answer},
      metadata
    )

    :approved
  end

`;

export function patchSymphonyAppServerSource(source: string): { text: string; changed: boolean } {
  if (source.includes(SYMPHONY_MCP_ELICITATION_PATCH_MARKER)) {
    return { text: source, changed: false };
  }

  const anchor = "  defp maybe_handle_approval_request(\n         _port,\n         _method,";
  if (!source.includes(anchor)) {
    throw new Error("Could not find Symphony app-server approval fallback anchor.");
  }

  return {
    text: source.replace(anchor, SYMPHONY_MCP_ELICITATION_PATCH + anchor),
    changed: true,
  };
}

function applySymphonyCompatibilityPatches(upstream: string): { ok: boolean; changed: boolean } {
  const appServerPath = join(upstream, "elixir", "lib", "symphony_elixir", "codex", "app_server.ex");
  if (!existsSync(appServerPath)) {
    console.error(`Missing Symphony app-server source: ${appServerPath}`);
    return { ok: false, changed: false };
  }

  try {
    const source = readFileSync(appServerPath, "utf8");
    const patched = patchSymphonyAppServerSource(source);
    if (patched.changed) {
      writeFileSync(appServerPath, patched.text, "utf8");
      console.log("Applied Symphony compatibility patch: decline unattended MCP elicitation requests.");
    }
    return { ok: true, changed: patched.changed };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to apply Symphony compatibility patch: ${message}`);
    return { ok: false, changed: false };
  }
}

function symphonyBootstrap(): number {
  const dotenv = loadDotenv();
  const repo = env("SYMPHONY_REPO", dotenv) || "https://github.com/openai/symphony.git";
  const ref = env("SYMPHONY_REF", dotenv) || "58cf97da06d556c019ccea20c67f4f77da124bf3";
  const upstream = join(symphonyRoot(), "openai-symphony");
  mkdirSync(symphonyRoot(), { recursive: true });
  if (!existsSync(join(upstream, ".git"))) {
    const cloneCode = run("git", ["clone", repo, upstream]);
    if (cloneCode !== 0) return cloneCode;
  } else {
    const remoteCode = run("git", ["remote", "set-url", "origin", repo], upstream);
    if (remoteCode !== 0) return remoteCode;
  }
  const fetchCode = run("git", ["fetch", "--tags", "--prune", "origin"], upstream);
  if (fetchCode !== 0) return fetchCode;
  const checkoutCode = run("git", ["checkout", "--detach", ref], upstream);
  if (checkoutCode !== 0) return checkoutCode;
  const patchResult = applySymphonyCompatibilityPatches(upstream);
  if (!patchResult.ok) return 1;
  if (capture("mise", ["--version"]).code !== 0) {
    console.log("Symphony source is present, but mise is not installed. Install mise before building upstream Symphony.");
    return 0;
  }
  const elixirDir = join(upstream, "elixir");
  for (const args of [["trust"], ["install"], ["exec", "--", "mix", "setup"], ["exec", "--", "mix", "build"]]) {
    const code = run("mise", args, elixirDir);
    if (code !== 0) return code;
  }
  console.log(`Symphony reference implementation is built at ${upstream}`);
  return 0;
}

function symphonyPreflight(): number {
  const checks: Array<[string, () => boolean]> = [
    ["repo has root AGENTS.md", () => existsSync(join(PROJECT_ROOT, "AGENTS.md"))],
    ["harness has WORKFLOW.md", () => existsSync(join(HARNESS_ROOT, "WORKFLOW.md"))],
    ["harness has docs", () => existsSync(join(HARNESS_ROOT, "docs"))],
    ["harness runtime is ignored", () => capture("git", ["check-ignore", ".agent-harness/.symphony"], PROJECT_ROOT).code === 0],
    ["repo validation passes", () => validateRepo() === 0],
  ];
  let failures = 0;
  for (const [label, check] of checks) {
    const ok = check();
    console.log(`${ok ? "ok" : "not ok"} - ${label}`);
    if (!ok) failures += 1;
  }
  if (failures > 0) {
    console.log(`${failures} preflight check(s) failed.`);
    return 1;
  }
  console.log("Base harness preflight passed.");
  return 0;
}

export function renderWorkflow(envValues: Record<string, string>): string {
  let text = readFileSync(join(HARNESS_ROOT, "WORKFLOW.md"), "utf8");
  for (const [key, value] of Object.entries({
    "__LINEAR_PROJECT_SLUG__": envValues.LINEAR_PROJECT_SLUG,
    "__GITHUB_REPO__": envValues.GITHUB_REPO,
    "__CODEX_MODEL__": envValues.CODEX_MODEL || "gpt-5.5",
    "__CODEX_APPROVAL_POLICY__": envValues.CODEX_APPROVAL_POLICY || "never",
    "__AGENT_MAX_PARALLEL_RUNS__": envValues.AGENT_MAX_PARALLEL_RUNS || "1",
  })) {
    text = text.replaceAll(key, value);
  }
  return text;
}

function generateWorkflow(envValues: Record<string, string>): string {
  const runtimeDir = join(HARNESS_ROOT, ".runtime");
  mkdirSync(runtimeDir, { recursive: true });
  const text = renderWorkflow(envValues);
  const out = join(runtimeDir, "WORKFLOW.generated.md");
  writeFileSync(out, text, "utf8");
  return out;
}

export function symphonyRunArgs(workflow: string, logsRoot: string, port: string): string[] {
  return [workflow, "--logs-root", logsRoot, "--port", port, SYMPHONY_UNATTENDED_GUARDRAIL_ACK];
}

function symphonyRun(extraEnv: Record<string, string> = {}): number {
  const dotenv = loadDotenv();
  const merged = { ...dotenv, ...process.env, ...extraEnv } as Record<string, string>;
  delete merged.GITHUB_TOKEN;
  delete merged.GH_TOKEN;
  for (const name of ["LINEAR_API_KEY", "LINEAR_PROJECT_SLUG", "GITHUB_REPO"]) {
    if (!merged[name]) {
      console.error(`${name} is required.`);
      return 1;
    }
  }
  const upstream = join(symphonyRoot(), "openai-symphony", "elixir");
  const binary = join(upstream, "bin", process.platform === "win32" ? "symphony.bat" : "symphony");
  if (!existsSync(upstream)) {
    console.error("Symphony reference implementation is not bootstrapped. Run symphony bootstrap first.");
    return 1;
  }
  const patchResult = applySymphonyCompatibilityPatches(join(symphonyRoot(), "openai-symphony"));
  if (!patchResult.ok) return 1;
  if (patchResult.changed) {
    if (capture("mise", ["--version"]).code !== 0) {
      console.error("Symphony compatibility patch changed source, but mise is not installed to rebuild the Symphony binary.");
      return 1;
    }
    const rebuildCode = run("mise", ["exec", "--", "mix", "build"], upstream, merged);
    if (rebuildCode !== 0) return rebuildCode;
  }
  const workflow = generateWorkflow(merged);
  const logsRoot = merged.SYMPHONY_LOGS_ROOT || join(symphonyRoot(), "logs");
  const port = merged.SYMPHONY_PORT || "4007";
  const args = symphonyRunArgs(workflow, logsRoot, port);
  if (capture("mise", ["--version"]).code === 0) {
    return run("mise", ["exec", "--", binary, ...args], upstream, merged);
  }
  return run(binary, args, upstream, merged);
}

async function agentStart(flags: Record<string, string | boolean>): Promise<number> {
  const projectName = typeof flags.project === "string" ? flags.project : "";
  if (!projectName) {
    console.error("--project is required.");
    return 1;
  }
  const dotenv = loadDotenv();
  const dryRun = Boolean(flags["dry-run"]) || boolValue(env("AGENT_DRY_RUN", dotenv), true);
  const holdStateName = typeof flags["hold-state"] === "string" ? flags["hold-state"] : env("AGENT_READY_HOLD_STATE", dotenv) || "Todo";
  const inProgressStateName = typeof flags["in-progress-state"] === "string" ? flags["in-progress-state"] : env("AGENT_IN_PROGRESS_STATE", dotenv) || "In Progress";
  const project = projectByName(projectName);
  if (!project) {
    console.error(`Unknown project: ${projectName}`);
    return 1;
  }
  const blockers: string[] = [];
  if (!project.agent_enabled) blockers.push("project agent_enabled is false");
  if (isPlaceholder(project.linear_project_slug)) blockers.push("project Linear slug is a placeholder");
  for (const name of ["LINEAR_API_KEY", "AGENT_WORKSPACE_ROOT"]) {
    if (!env(name, dotenv)) blockers.push(`${name} is not set`);
  }
  const mergedEnv = { ...process.env, ...dotenv } as Record<string, string>;
  const codexAuth = codexAuthStatus(mergedEnv);
  if (!codexAuth.ok) blockers.push(`Codex auth file is not available at ${codexAuth.source}`);
  const githubAuth = githubAuthStatus(mergedEnv);
  if (!githubAuth.ok) blockers.push("GitHub auth is not available from gh auth status");
  const workspaceRoot = env("AGENT_WORKSPACE_ROOT", dotenv);
  const resolvedWorkspaceRoot = workspaceRoot ? resolveWorkspaceRoot(workspaceRoot) : "";
  const publishCheck = blockers.length === 0 || workspaceRoot
    ? publishPreflight(project.repo, resolvedWorkspaceRoot, mergedEnv)
    : { ok: false, checked: [], blockers: [] };
  for (const blocker of publishCheck.blockers) {
    blockers.push(`publish preflight: ${blocker}`);
  }
  const runEnv = {
    LINEAR_PROJECT_SLUG: project.linear_project_slug,
    GITHUB_REPO: project.repo,
    AGENT_WORKSPACE_ROOT: resolvedWorkspaceRoot,
    CODEX_MODEL: env("CODEX_MODEL", dotenv) || "gpt-5.5",
    CODEX_APPROVAL_POLICY: env("CODEX_APPROVAL_POLICY", dotenv) || "never",
    AGENT_MAX_PARALLEL_RUNS: env("AGENT_MAX_PARALLEL_RUNS", dotenv) || "1",
  };
  console.log(`Project: ${project.name}`);
  console.log(`GitHub repo: ${project.repo}`);
  console.log(`Linear slug: ${project.linear_project_slug}`);
  console.log(`Agent enabled: ${project.agent_enabled}`);
  console.log(`Ready ordering hold state: ${holdStateName}`);
  console.log(`Claim state: ${inProgressStateName}`);
  if (dryRun) {
    console.log("Dry run: no Symphony or Codex process started.");
    console.log("Resolved live runner inputs:");
    console.log(`- LINEAR_PROJECT_SLUG: ${runEnv.LINEAR_PROJECT_SLUG}`);
    console.log(`- GITHUB_REPO: ${runEnv.GITHUB_REPO}`);
    console.log(`- AGENT_WORKSPACE_ROOT: ${runEnv.AGENT_WORKSPACE_ROOT}`);
    console.log(`- CODEX_MODEL: ${runEnv.CODEX_MODEL}`);
    console.log(`- CODEX_APPROVAL_POLICY: ${runEnv.CODEX_APPROVAL_POLICY}`);
    console.log(`- AGENT_MAX_PARALLEL_RUNS: ${runEnv.AGENT_MAX_PARALLEL_RUNS}`);
    console.log(`- Publish preflight: ${publishCheck.ok ? "passed" : "failed"}`);
    publishCheck.checked.forEach((check) => console.log(`  - ${check}`));
    console.log("- Secrets: not printed");
    if (blockers.length > 0) {
      console.log("Readiness blockers:");
      blockers.forEach((blocker) => console.log(`- ${blocker}`));
    }
    console.log("Would run: symphony run");
    return 0;
  }
  if (blockers.length > 0) {
    console.log("Cannot start live run:");
    blockers.forEach((blocker) => console.log(`- ${blocker}`));
    return 1;
  }
  const apiKey = env("LINEAR_API_KEY", dotenv);
  const claim = await enforceAgentIssueOrder(apiKey, project.linear_project_slug, holdStateName, inProgressStateName);
  if (claim.code !== 0) return claim.code;
  const runCode = symphonyRun(runEnv);
  if (claim.selected && claim.stateIds) {
    const publishResult = parentPublishWorkspace(project, claim.selected, runEnv.AGENT_WORKSPACE_ROOT);
    if (publishResult.ok && !publishResult.skipped) {
      await markIssueReadyToMerge(apiKey, claim.selected, claim.stateIds, parentPublishCommentBody(publishResult));
      return 0;
    }
    if (runCode !== 0) {
      const body = publishResult.ok
        ? agentBlockedCommentBody({ command: "symphony run", exitCode: runCode })
        : [
          agentBlockedCommentBody({ command: "symphony run", exitCode: runCode }),
          "",
          "Parent CLI publish also failed:",
          "",
          publishResult.message,
        ].join("\n");
      await markIssueBlocked(apiKey, claim.selected, claim.stateIds, body);
    }
  }
  return runCode;
}

async function agentPublish(flags: Record<string, string | boolean>): Promise<number> {
  const projectName = typeof flags.project === "string" ? flags.project : "";
  const issueIdentifier = typeof flags.issue === "string" ? flags.issue : "";
  if (!projectName || !issueIdentifier) {
    console.error("--project and --issue are required.");
    return 1;
  }
  const dotenv = loadDotenv();
  const apiKey = env("LINEAR_API_KEY", dotenv);
  if (!apiKey) {
    console.error("LINEAR_API_KEY is required.");
    return 1;
  }
  const project = projectByName(projectName);
  if (!project) {
    console.error(`Unknown project: ${projectName}`);
    return 1;
  }
  const workspaceRoot = env("AGENT_WORKSPACE_ROOT", dotenv);
  if (!workspaceRoot) {
    console.error("AGENT_WORKSPACE_ROOT is required.");
    return 1;
  }
  const issueResult = await fetchAgentIssueByIdentifier(apiKey, project.linear_project_slug, issueIdentifier);
  if (!issueResult) {
    console.error(`Issue ${issueIdentifier} was not found in project ${project.linear_project_slug}.`);
    return 1;
  }
  const dryRun = Boolean(flags["dry-run"]);
  const workspace = workspaceForIssue(workspaceRoot, issueResult.issue);
  if (dryRun) {
    console.log(`Project: ${project.name}`);
    console.log(`Issue: ${issueResult.issue.identifier}`);
    console.log(`Workspace: ${workspace}`);
    console.log(`Publishable changes: ${hasPublishableChanges(workspace)}`);
    console.log(`Branch: ${agentBranchName(issueResult.issue)}`);
    console.log("Dry run: no branch, commit, PR, or Linear update was created.");
    return 0;
  }
  const publishResult = parentPublishWorkspace(project, issueResult.issue, workspaceRoot);
  if (!publishResult.ok) {
    console.error(`Parent publish failed: ${publishResult.message}`);
    return 1;
  }
  if (publishResult.skipped) {
    console.log(`Parent publish skipped: ${publishResult.message}`);
    return 0;
  }
  console.log(`Published ${issueResult.issue.identifier} on ${publishResult.branch}`);
  if (publishResult.prUrl) console.log(`Pull request: ${publishResult.prUrl}`);
  await markIssueReadyToMerge(apiKey, issueResult.issue, issueResult.stateIds, parentPublishCommentBody(publishResult));
  return 0;
}

async function main(): Promise<number> {
  const { group, action, positionals, flags } = parseArgs(process.argv.slice(2));
  if (group === "help" || group === "--help" || !group) {
    console.log(usage());
    return 0;
  }
  if (group === "validate" && action === "env") return validateEnv(flags);
  if (group === "validate" && action === "repo") return validateRepo();
  if (group === "project" && action === "bootstrap") return bootstrapProject(flags);
  if (group === "project" && action === "summary") return summarizeProjects();
  if (group === "template") return handleTemplateCommand(action, positionals, flags, PROJECT_ROOT);
  if (group === "linear" && action === "create") return createLinearIssues(resolve(PROJECT_ROOT, positionals[0] || ""), flags);
  if (group === "linear" && action === "sync") return syncLinear(flags);
  if (group === "intake" && action === "new") return intakeNew(flags);
  if (group === "intake" && action === "validate") return intakeValidate(positionals[0] || "");
  if (group === "intake" && action === "compile") return intakeCompile(positionals[0] || "", flags);
  if (group === "intake" && action === "promote") return intakePromote(positionals[0] || "", flags);
  if (group === "agent" && action === "start") return agentStart(flags);
  if (group === "agent" && action === "publish") return agentPublish(flags);
  if (group === "symphony" && action === "bootstrap") return symphonyBootstrap();
  if (group === "symphony" && action === "preflight") return symphonyPreflight();
  if (group === "symphony" && action === "run") return symphonyRun();
  console.log(usage());
  return 1;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
