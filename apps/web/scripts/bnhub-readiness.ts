/**
 * Single entry: runs BNHUB API smoke + DB validation, prints READY / NOT READY.
 * Does not modify underlying scripts; does not print env or secrets.
 */
import { spawnSync } from "node:child_process";

function runStep(name: string, script: string): boolean {
  const r = spawnSync("pnpm", ["run", script], {
    cwd: process.cwd(),
    stdio: "ignore",
    env: process.env,
  });
  const ok = r.status === 0 && !r.error;
  const label = ok ? "OK" : "FAIL";
  console.log(`  ${name.padEnd(22)} ${label}`);
  return ok;
}

function main() {
  console.log("");
  console.log("  BNHUB soft launch readiness");
  console.log("  ───────────────────────────");
  console.log("");

  const apiOk = runStep("API smoke (test:bnhub:api)", "test:bnhub:api");
  const dbOk = runStep("DB validate (validate:bnhub:db)", "validate:bnhub:db");
  const softOk = runStep("Soft-launch status (validate:soft-launch-status)", "validate:soft-launch-status");

  console.log("");

  const ready = apiOk && dbOk && softOk;
  if (ready) {
    console.log("  READY FOR SOFT LAUNCH");
  } else {
    console.log("  NOT READY");
  }
  console.log("");

  process.exit(ready ? 0 : 1);
}

main();
