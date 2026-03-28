/**
 * Self-check: CI wiring, scripts, and workflow gates exist.
 * Run: pnpm --filter @lecipm/web exec tsx scripts/validate-ci-system.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

const WORKFLOW = join(REPO_ROOT, ".github/workflows/ci.yml");
const WEB_PKG = join(WEB_ROOT, "package.json");
const ROOT_PKG = join(REPO_ROOT, "package.json");
const POLICY = join(REPO_ROOT, "docs/ci-policy.md");

const REQUIRED_SCRIPTS_WEB = [
  "ci:integrity",
  "ci:typecheck",
  "ci:build",
  "ci:validate:platform",
  "ci:all",
  "prepush:check",
  "validate:ci-system",
] as const;

const REQUIRED_FILES = [
  "scripts/check-repo-integrity.ts",
  "scripts/ci-runner.ts",
  "scripts/ci-platform-validations.ts",
  "scripts/prepush-check.ts",
  "scripts/validate-ci-system.ts",
] as const;

function readJson(path: string): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(path, "utf8")) as { scripts?: Record<string, string> };
}

function main(): void {
  const issues: string[] = [];

  if (!existsSync(WORKFLOW)) issues.push(`missing workflow: ${WORKFLOW}`);
  if (!existsSync(POLICY)) issues.push(`missing policy doc: ${POLICY}`);

  for (const f of REQUIRED_FILES) {
    const p = join(WEB_ROOT, f);
    if (!existsSync(p)) issues.push(`missing ${p}`);
  }

  const webPkg = readJson(WEB_PKG);
  for (const s of REQUIRED_SCRIPTS_WEB) {
    if (!webPkg.scripts?.[s]) issues.push(`apps/web package.json missing script: ${s}`);
  }

  const rootPkg = readJson(ROOT_PKG);
  for (const s of [
    "ci:integrity",
    "ci:typecheck",
    "ci:build",
    "ci:validate:platform",
    "ci:all",
    "prepush:check",
    "validate:ci-system",
  ]) {
    if (!rootPkg.scripts?.[s]) issues.push(`root package.json missing script: ${s}`);
  }

  let wf = "";
  if (existsSync(WORKFLOW)) {
    wf = readFileSync(WORKFLOW, "utf8");
    if (!wf.includes("ci:integrity")) issues.push("workflow should run ci:integrity step");
    if (!wf.includes("ci:typecheck")) issues.push("workflow should run ci:typecheck step");
    if (!wf.includes("ci:build")) issues.push("workflow should run ci:build step");
    const idxIntegrity = wf.indexOf("pnpm run ci:integrity");
    const idxBuild = wf.indexOf("pnpm run ci:build");
    if (idxIntegrity !== -1 && idxBuild !== -1 && idxIntegrity > idxBuild) {
      issues.push("workflow: integrity must run before build (ci:integrity after ci:build)");
    }
    const hasArtifact = wf.includes("actions/upload-artifact");
    if (!hasArtifact) {
      issues.push("workflow: no actions/upload-artifact — add failure artifacts or document in ci-policy.md");
    }
  }

  console.log("--- LECIPM CI system validation ---");
  console.log("Workflow:", WORKFLOW, existsSync(WORKFLOW) ? "OK" : "MISSING");
  console.log("Policy:", POLICY, existsSync(POLICY) ? "OK" : "MISSING");
  console.log("Web scripts:", REQUIRED_SCRIPTS_WEB.join(", "));
  console.log("Gates in workflow (integrity/typecheck/build):", wf.includes("ci:integrity") && wf.includes("ci:typecheck") && wf.includes("ci:build"));

  if (issues.length) {
    console.error("\nISSUES:");
    for (const i of issues) console.error(" -", i);
    process.exit(1);
  }

  console.log("\nLECIPM CI SYSTEM ACTIVE");
}

main();
