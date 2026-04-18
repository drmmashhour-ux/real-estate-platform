#!/usr/bin/env npx tsx
/**
 * LECIPM safe rollback help — prints current branch, recent commits, and safe rollback options.
 * Does NOT run reset, revert, checkout, or any destructive git command.
 *
 *   cd apps/web && pnpm run safe:rollback-help
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

function main() {
  const root = gitRoot();
  if (!root) {
    console.error("Not a git repository.");
    process.exit(1);
  }

  let branch = "(detached or unknown)";
  try {
    branch = git(["branch", "--show-current"], root) || "(detached)";
  } catch {
    /* ignore */
  }

  let head = "";
  try {
    head = git(["rev-parse", "--short", "HEAD"], root);
  } catch {
    head = "?";
  }

  let log = "";
  try {
    log = git(["log", "-15", "--oneline", "--decorate"], root);
  } catch (e) {
    log = String(e);
  }

  console.log("=== LECIPM safe-rollback-help (read-only) ===\n");
  console.log(`Git root:     ${root}`);
  console.log(`Current branch: ${branch}`);
  console.log(`HEAD:         ${head}\n`);

  console.log("Recent commits:\n");
  console.log(
    log
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n")
  );

  console.log("\n--- Rollback options (run manually after reading git-safety.md) ---\n");

  console.log("1) Revert a single bad commit (keeps history; safest on shared branches):");
  console.log(`   cd "${root}"`);
  console.log("   git log -1 --oneline   # find SHA");
  console.log("   git revert <SHA> --no-edit");
  console.log("   git push");
  console.log("");

  console.log("2) Reset local branch to match remote (destructive to local commits only):");
  console.log(`   cd "${root}"`);
  console.log("   git fetch origin");
  console.log("   git checkout <your-branch>");
  console.log("   git reset --hard origin/<your-branch>");
  console.log("");

  console.log("3) Restore worktree from a backup branch you created earlier:");
  console.log(`   cd "${root}"`);
  console.log("   git branch -a | grep backup   # list backup/* branches");
  console.log("   git checkout <your-branch>");
  console.log("   git reset --hard backup/pre-change-YYYYMMDD-HHMM   # DANGER: discards current commits");
  console.log("   # Safer: cherry-pick specific commits from backup instead of hard reset.");
  console.log("");

  console.log("4) Checkout a backup tag (detached HEAD — create branch from it if you need to work):");
  console.log(`   cd "${root}"`);
  console.log("   git tag -l 'backup-*'");
  console.log("   git checkout backup-YYYYMMDD-HHMM");
  console.log("   git switch -c recover-from-backup");
  console.log("");

  console.log("5) Merged PR rollback: revert the merge commit on main:");
  console.log("   git log --merges -5 --oneline");
  console.log("   git revert -m 1 <merge_commit_sha>");
  console.log("");

  console.log("6) Prefer feature flags over git surgery for risky code:");
  console.log("   See apps/web/config/feature-flags.ts — disable flag, redeploy.");
  console.log("");

  console.log("7) Broken deploy (Vercel):");
  console.log("   Redeploy previous production deployment from Vercel dashboard, or:");
  console.log("   git revert <bad_commit> && git push");
  console.log("");

  console.log("--- Warnings ---");
  console.log("- Never `git push --force` to shared main without team agreement.");
  console.log("- `git reset --hard` and `git clean -fd` discard work — confirm twice.");
  console.log("");
}

main();
