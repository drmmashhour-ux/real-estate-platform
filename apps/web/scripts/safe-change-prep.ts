#!/usr/bin/env npx tsx
/**
 * LECIPM safe change prep — read-only git inspection + suggested backup commands.
 * Does NOT run checkout, commit, reset, or tag (you copy/paste commands manually).
 *
 *   cd apps/web && pnpm run safe:change-prep
 *   pnpm run safe:change-prep -- --feature my-feature-name
 */
import { execSync } from "node:child_process";

function git(args: string[], cwd?: string): string {
  return execSync(`git ${args.join(" ")}`, {
    encoding: "utf8",
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function gitRoot(): string | null {
  try {
    return git(["rev-parse", "--show-toplevel"]);
  } catch {
    return null;
  }
}

function pad(s: string): string {
  return s
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
}

function main() {
  const featureArg = process.argv.find((a) => a.startsWith("--feature="))?.split("=", 2)[1];
  const featureIdx = process.argv.indexOf("--feature");
  const feature =
    featureArg ??
    (featureIdx >= 0 && process.argv[featureIdx + 1] ? process.argv[featureIdx + 1] : null);

  const root = gitRoot();
  if (!root) {
    console.error("Not a git repository (git rev-parse --show-toplevel failed).");
    process.exit(1);
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const slug = (feature ?? "pre-change").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 48) || "pre-change";
  const backupBranch = `backup/${slug}-${stamp}`;
  const tagName = `backup-${stamp}`;

  let branch = "(unknown)";
  try {
    branch = git(["branch", "--show-current"], root);
  } catch {
    /* detached */
  }

  let status = "";
  try {
    status = git(["status", "--porcelain=v1", "-u"], root);
  } catch (e) {
    status = `git status failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  let shortStat = "";
  try {
    shortStat = git(["status", "-sb"], root);
  } catch {
    shortStat = "";
  }

  console.log("=== LECIPM safe-change-prep (read-only) ===\n");
  console.log(`Git root: ${root}`);
  console.log(`Current branch: ${branch}\n`);

  if (shortStat) {
    console.log("Branch / tracking:\n" + pad(shortStat) + "\n");
  }

  console.log("Working tree (porcelain):\n");
  if (!status.trim()) {
    console.log(pad("(clean — no unstaged/untracked changes reported)"));
  } else {
    console.log(pad(status));
  }

  console.log("\n--- Suggested backup branch ---\n");
  console.log(`  ${backupBranch}\n`);

  console.log("--- Commands to run manually (review before executing) ---\n");
  console.log("# From repo root:");
  console.log(`cd "${root}"`);
  console.log(`git checkout -b ${backupBranch}`);
  console.log("git add -A");
  console.log(`git commit -m "backup before change: ${slug}"`);
  console.log("");
  console.log("# Optional lightweight tag (same commit as backup branch tip after commit):");
  console.log(`git tag -a ${tagName} -m "backup checkpoint ${stamp}"`);
  console.log("");
  console.log("# Push backup to remote (optional):");
  console.log(`git push -u origin ${backupBranch}`);
  console.log(`git push origin ${tagName}`);
  console.log("");
  console.log("--- Notes ---");
  console.log("- Commit only after reviewing `git diff` and excluding secrets.");
  console.log("- If you already committed on main, create backup from current HEAD:");
  console.log(`  git branch ${backupBranch} HEAD`);
  console.log("");
}

main();
