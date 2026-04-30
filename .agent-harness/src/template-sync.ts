import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

type Flags = Record<string, string | boolean>;

export type PathClassification = "owned" | "protected" | "optional" | "excluded";
export type PlannedChangeKind = "add" | "modify" | "delete" | "already-synced" | "conflict" | "protected" | "optional" | "excluded";

type TemplateSyncState = {
  version: 1;
  template: {
    repo: string;
    ref: string;
    last_synced_sha: string;
    last_synced_at: string;
  };
};

type PlanOptions = {
  includeReadme: boolean;
  includeGitignore: boolean;
  force: boolean;
};

export type PlannedFileChange = {
  path: string;
  kind: PlannedChangeKind;
  reason: string;
};

type PlannedTemplateChange = PlannedFileChange & {
  oldContent: string | null;
  newContent: string | null;
};

type TemplateSyncPlan = {
  repo: string;
  fetchRepo: string;
  ref: string;
  fromSha: string;
  toSha: string;
  changes: PlannedTemplateChange[];
};

const STATE_RELATIVE_PATH = ".agent-harness/config/template-sync.json";
const DEFAULT_REF = "main";

const TEMPLATE_OWNED_PATTERNS = [
  "AGENTS.md",
  ".agent-harness/.env.example",
  ".agent-harness/ARCHITECTURE.md",
  ".agent-harness/WORKFLOW.md",
  ".agent-harness/package.json",
  ".agent-harness/package-lock.json",
  ".agent-harness/tsconfig.json",
  ".agent-harness/src/**",
  ".agent-harness/roles/**",
  ".agent-harness/docs/**",
  ".agent-harness/config/*.example.json",
  ".agent-harness/intake/README.md",
  ".github/pull_request_template.md",
  ".github/workflows/**",
  ".github/ISSUE_TEMPLATE/**",
];

const PROTECTED_PATTERNS = [
  ".agent-harness/config/template-sync.json",
  ".agent-harness/.env",
  ".agent-harness/.env.*",
  ".agent-harness/config/projects.json",
  ".agent-harness/config/*.local.json",
  ".agent-harness/config/*.private.json",
  ".agent-harness/intake/inbox/**",
  ".agent-harness/intake/compiled/**",
  ".agent-harness/intake/promoted/**",
  ".agent-harness/intake/archive/**",
  ".agent-harness/dist/**",
  ".agent-harness/node_modules/**",
  ".agent-harness/build/**",
  ".agent-harness/coverage/**",
  ".agent-harness/.cache/**",
  ".agent-harness/.tmp/**",
  ".agent-harness/.runtime/**",
  ".agent-harness/.symphony/**",
];

const OPTIONAL_PATHS = new Set(["README.md", ".gitignore"]);

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function matchesPattern(path: string, pattern: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedPattern = normalizePath(pattern);
  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  }
  if (normalizedPattern.includes("*")) {
    const regex = new RegExp(`^${normalizedPattern.split("*").map(escapeRegex).join("[^/]*")}$`);
    return regex.test(normalizedPath);
  }
  return normalizedPath === normalizedPattern;
}

export function normalizeTemplateRepo(repo: string): string {
  const trimmed = repo.trim();
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed)) {
    return `https://github.com/${trimmed}.git`;
  }
  return trimmed;
}

export function classifyTemplatePath(path: string, options: Partial<PlanOptions>): PathClassification {
  const normalizedPath = normalizePath(path);
  if (normalizedPath === ".agent-harness/.env.example") {
    return "owned";
  }
  if (PROTECTED_PATTERNS.some((pattern) => matchesPattern(normalizedPath, pattern))) {
    return "protected";
  }
  if (normalizedPath === "README.md") {
    return options.includeReadme ? "owned" : "optional";
  }
  if (normalizedPath === ".gitignore") {
    return options.includeGitignore ? "owned" : "optional";
  }
  if (TEMPLATE_OWNED_PATTERNS.some((pattern) => matchesPattern(normalizedPath, pattern))) {
    return "owned";
  }
  return "excluded";
}

export function planFileChange(path: string, oldContent: string | null, newContent: string | null, currentContent: string | null, options: PlanOptions): PlannedFileChange {
  const normalizedPath = normalizePath(path);
  const classification = classifyTemplatePath(normalizedPath, options);
  if (classification === "protected") {
    return { path: normalizedPath, kind: "protected", reason: "protected path is never synced" };
  }
  if (classification === "optional") {
    return { path: normalizedPath, kind: "optional", reason: "optional path requires an include flag" };
  }
  if (classification === "excluded") {
    return { path: normalizedPath, kind: "excluded", reason: "path is not template-owned" };
  }
  if (newContent === null) {
    if (currentContent === null) {
      return { path: normalizedPath, kind: "already-synced", reason: "target already matches latest template content" };
    }
    if (oldContent !== null && currentContent === oldContent) {
      return { path: normalizedPath, kind: "delete", reason: "target matches deleted template content" };
    }
    if (options.force) {
      return { path: normalizedPath, kind: "delete", reason: "force enabled; target differs from both previous and latest template content" };
    }
    return { path: normalizedPath, kind: "conflict", reason: "target differs from both previous and latest template content" };
  }
  if (currentContent === newContent) {
    return { path: normalizedPath, kind: "already-synced", reason: "target already matches latest template content" };
  }
  if (oldContent === null) {
    if (currentContent === null) {
      return { path: normalizedPath, kind: "add", reason: "target missing and template added file" };
    }
    if (options.force) {
      return { path: normalizedPath, kind: "modify", reason: "force enabled; target differs from both previous and latest template content" };
    }
    return { path: normalizedPath, kind: "conflict", reason: "target differs from both previous and latest template content" };
  }
  if (currentContent === oldContent) {
    return { path: normalizedPath, kind: "modify", reason: "target matches previous template content" };
  }
  if (options.force) {
    return { path: normalizedPath, kind: "modify", reason: "force enabled; target differs from both previous and latest template content" };
  }
  return { path: normalizedPath, kind: "conflict", reason: "target differs from both previous and latest template content" };
}

function statePath(projectRoot: string): string {
  return resolve(projectRoot, STATE_RELATIVE_PATH);
}

function readState(projectRoot: string): TemplateSyncState | null {
  const path = statePath(projectRoot);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as TemplateSyncState;
}

function writeState(projectRoot: string, state: TemplateSyncState): void {
  const path = statePath(projectRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function git(args: string[], projectRoot: string): { code: number; stdout: string; stderr: string } {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return { code: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function requireGit(args: string[], projectRoot: string, message: string): string {
  const result = git(args, projectRoot);
  if (result.code !== 0) {
    throw new Error(`${message}\n${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}

function isLikelySha(value: string): boolean {
  return /^[0-9a-f]{7,40}$/i.test(value);
}

function objectExists(projectRoot: string, sha: string): boolean {
  return git(["cat-file", "-e", `${sha}^{commit}`], projectRoot).code === 0;
}

function resolveTemplateCommit(projectRoot: string, repo: string, refOrSha: string): string {
  const fetchRepo = normalizeTemplateRepo(repo);
  if (isLikelySha(refOrSha) && objectExists(projectRoot, refOrSha)) {
    return requireGit(["rev-parse", "--verify", `${refOrSha}^{commit}`], projectRoot, `Could not resolve template commit ${refOrSha}.`).trim();
  }
  const fetch = git(["fetch", "--quiet", "--no-tags", fetchRepo, refOrSha], projectRoot);
  if (fetch.code !== 0) {
    throw new Error(`Could not fetch template ${fetchRepo} ${refOrSha}.\n${(fetch.stderr || fetch.stdout).trim()}`);
  }
  return requireGit(["rev-parse", "--verify", "FETCH_HEAD^{commit}"], projectRoot, `Could not resolve fetched template ref ${refOrSha}.`).trim();
}

function changedTemplatePaths(projectRoot: string, fromSha: string, toSha: string): string[] {
  const output = requireGit(["diff", "--name-status", "-z", fromSha, toSha, "--"], projectRoot, `Could not compare template commits ${fromSha}..${toSha}.`);
  const parts = output.split("\0").filter((part) => part.length > 0);
  const paths = new Set<string>();
  for (let index = 0; index < parts.length;) {
    const status = parts[index++];
    if (!status) break;
    if (status.startsWith("R") || status.startsWith("C")) {
      const oldPath = parts[index++];
      const newPath = parts[index++];
      if (oldPath) paths.add(normalizePath(oldPath));
      if (newPath) paths.add(normalizePath(newPath));
      continue;
    }
    const path = parts[index++];
    if (path) paths.add(normalizePath(path));
  }
  return [...paths].sort();
}

function templateContent(projectRoot: string, sha: string, path: string): string | null {
  const result = git(["show", `${sha}:${path}`], projectRoot);
  if (result.code !== 0) return null;
  return result.stdout;
}

function targetContent(projectRoot: string, path: string): string | null {
  const fullPath = resolve(projectRoot, path);
  if (!existsSync(fullPath)) return null;
  if (!statSync(fullPath).isFile()) return null;
  return readFileSync(fullPath, "utf8");
}

function assertInsideProject(projectRoot: string, path: string): string {
  const fullPath = resolve(projectRoot, path);
  const root = resolve(projectRoot);
  const relativePath = relative(root, fullPath);
  if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`) || relativePath === "") {
    throw new Error(`Refusing to write outside project root: ${path}`);
  }
  return fullPath;
}

function planTemplateSync(projectRoot: string, flags: Flags, requireFrom = true): TemplateSyncPlan {
  const state = readState(projectRoot);
  const repo = String(flags.repo || state?.template.repo || "");
  const ref = String(flags.ref || state?.template.ref || DEFAULT_REF);
  if (!repo) {
    throw new Error("--repo is required unless .agent-harness/config/template-sync.json has template.repo.");
  }
  const fromInput = String(flags.from || state?.template.last_synced_sha || "");
  if (requireFrom && !fromInput) {
    throw new Error("No previous template SHA is configured. Run `template init --repo <owner/repo> --ref main` or provide `--from <sha>`.");
  }
  const toInput = String(flags.to || ref);
  const toSha = resolveTemplateCommit(projectRoot, repo, toInput);
  const fromSha = fromInput ? resolveTemplateCommit(projectRoot, repo, fromInput) : "";
  const options = {
    includeReadme: Boolean(flags["include-readme"]),
    includeGitignore: Boolean(flags["include-gitignore"]),
    force: Boolean(flags.force),
  };
  const changes = fromSha
    ? changedTemplatePaths(projectRoot, fromSha, toSha).map((path) => {
      const oldContent = templateContent(projectRoot, fromSha, path);
      const newContent = templateContent(projectRoot, toSha, path);
      const currentContent = targetContent(projectRoot, path);
      return { ...planFileChange(path, oldContent, newContent, currentContent, options), oldContent, newContent };
    })
    : [];
  return { repo, fetchRepo: normalizeTemplateRepo(repo), ref, fromSha, toSha, changes };
}

function printList(title: string, paths: string[]): void {
  console.log(title);
  if (paths.length === 0) {
    console.log("- none");
    return;
  }
  paths.forEach((path) => console.log(`- ${path}`));
}

function printPlan(plan: TemplateSyncPlan): void {
  console.log(`Template repo: ${plan.repo}`);
  console.log(`Template ref: ${plan.ref}`);
  console.log(`Last synced SHA: ${plan.fromSha || "not configured"}`);
  console.log(`Latest template SHA: ${plan.toSha}`);
  printList("Files that would be added:", plan.changes.filter((change) => change.kind === "add").map((change) => change.path));
  printList("Files that would be modified:", plan.changes.filter((change) => change.kind === "modify").map((change) => change.path));
  printList("Files that would be deleted:", plan.changes.filter((change) => change.kind === "delete").map((change) => change.path));
  printList("Files skipped because they are protected:", plan.changes.filter((change) => change.kind === "protected").map((change) => change.path));
  printList("Optional files skipped:", plan.changes.filter((change) => change.kind === "optional").map((change) => change.path));
  printList("Non-template files skipped:", plan.changes.filter((change) => change.kind === "excluded").map((change) => change.path));
  printList("Files requiring conflict resolution:", plan.changes.filter((change) => change.kind === "conflict").map((change) => change.path));
}

function dirtyWorkingTree(projectRoot: string): string {
  const result = git(["status", "--porcelain", "--untracked-files=all"], projectRoot);
  if (result.code !== 0) {
    return (result.stderr || result.stdout).trim();
  }
  return result.stdout.split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .filter((line) => normalizePath(line.slice(3).trim()) !== STATE_RELATIVE_PATH)
    .join("\n");
}

function applyPlan(projectRoot: string, plan: TemplateSyncPlan, flags: Flags): void {
  const conflicts = plan.changes.filter((change) => change.kind === "conflict");
  if (conflicts.length > 0 && !flags.force) {
    throw new Error(`Template sync has ${conflicts.length} conflict(s). Resolve them manually or rerun with --force.`);
  }
  for (const change of plan.changes) {
    const fullPath = assertInsideProject(projectRoot, change.path);
    if (change.kind === "add" || change.kind === "modify") {
      if (change.newContent === null) throw new Error(`Missing latest template content for ${change.path}.`);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, change.newContent, "utf8");
    }
    if (change.kind === "delete") {
      rmSync(fullPath, { force: true });
    }
  }
  writeState(projectRoot, {
    version: 1,
    template: {
      repo: plan.repo,
      ref: plan.ref,
      last_synced_sha: plan.toSha,
      last_synced_at: new Date().toISOString(),
    },
  });
}

function initialized(state: TemplateSyncState | null): boolean {
  return Boolean(state?.template.last_synced_sha);
}

function templateInit(projectRoot: string, flags: Flags): number {
  const repo = String(flags.repo || "");
  const ref = String(flags.ref || DEFAULT_REF);
  if (!repo) {
    console.error("--repo is required.");
    return 1;
  }
  const state = readState(projectRoot);
  if (initialized(state) && !flags.force) {
    console.error(`${STATE_RELATIVE_PATH} is already initialized. Re-run with --force to replace it.`);
    return 1;
  }
  const sha = String(flags.sha || "") || resolveTemplateCommit(projectRoot, repo, ref);
  writeState(projectRoot, {
    version: 1,
    template: {
      repo,
      ref,
      last_synced_sha: sha,
      last_synced_at: new Date().toISOString(),
    },
  });
  console.log(`Initialized ${STATE_RELATIVE_PATH}`);
  console.log(`Template repo: ${repo}`);
  console.log(`Template ref: ${ref}`);
  console.log(`Last synced SHA: ${sha}`);
  return 0;
}

function templateStatus(projectRoot: string, flags: Flags): number {
  const state = readState(projectRoot);
  const repo = String(flags.repo || state?.template.repo || "");
  const ref = String(flags.ref || state?.template.ref || DEFAULT_REF);
  if (!repo) {
    console.error("--repo is required unless template sync is initialized.");
    return 1;
  }
  const latestSha = resolveTemplateCommit(projectRoot, repo, ref);
  const lastSyncedSha = state?.template.last_synced_sha || "";
  console.log(`Template repo: ${repo}`);
  console.log(`Template ref: ${ref}`);
  console.log(`Last synced SHA: ${lastSyncedSha || "not configured"}`);
  console.log(`Latest template SHA: ${latestSha}`);
  if (!lastSyncedSha) {
    console.log("Status: not initialized. Run `template init --repo <owner/repo> --ref main`.");
  } else if (lastSyncedSha === latestSha) {
    console.log("Status: up to date.");
  } else {
    console.log("Status: update available.");
  }
  return 0;
}

function templateDiff(projectRoot: string, flags: Flags): number {
  const plan = planTemplateSync(projectRoot, flags);
  printPlan(plan);
  return 0;
}

function templateSync(projectRoot: string, flags: Flags): number {
  const apply = Boolean(flags.apply);
  const dryRun = Boolean(flags["dry-run"]) || !apply;
  if (apply && flags["dry-run"]) {
    console.error("Use either --dry-run or --apply, not both.");
    return 1;
  }
  const dirty = dirtyWorkingTree(projectRoot);
  if (dirty && !flags.force) {
    console.error("Refusing to run template sync on a dirty working tree. Commit, stash, or rerun with --force.");
    console.error(dirty);
    return 1;
  }
  const plan = planTemplateSync(projectRoot, flags);
  printPlan(plan);
  if (dryRun) {
    console.log("Dry run: no files changed. Re-run with --apply to write safe template updates.");
    return 0;
  }
  applyPlan(projectRoot, plan, flags);
  console.log(`Updated ${STATE_RELATIVE_PATH}`);
  console.log("Recommended next commands:");
  console.log("npm --prefix .agent-harness ci");
  console.log("npm --prefix .agent-harness run build");
  console.log("node .agent-harness/dist/cli.js validate repo");
  console.log("git status --short");
  return 0;
}

export function handleTemplateCommand(action: string, _positionals: string[], flags: Flags, projectRoot: string): number {
  try {
    if (action === "init") return templateInit(projectRoot, flags);
    if (action === "status") return templateStatus(projectRoot, flags);
    if (action === "diff") return templateDiff(projectRoot, flags);
    if (action === "sync") return templateSync(projectRoot, flags);
    console.error("Unknown template command. Expected init, status, diff, or sync.");
    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
