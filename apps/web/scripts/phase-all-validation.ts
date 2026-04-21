/**
 * Runs phase1 … phase7 validators sequentially (each process).
 * Run: pnpm exec tsx scripts/phase-all-validation.ts
 */
import { execSync } from "node:child_process";

const phases = [
  "phase1-validation.ts",
  "phase2-validation.ts",
  "phase3-validation.ts",
  "phase4-validation.ts",
  "phase5-validation.ts",
  "phase6-validation.ts",
  "phase7-validation.ts",
];

function main(): void {
  console.log("\n========== LECIPM phased validation (all) ==========\n");
  try {
    for (const script of phases) {
      execSync(`npx tsx scripts/${script}`, { stdio: "inherit", cwd: process.cwd(), env: process.env });
    }
    console.log("\nPASS — all phase smoke scripts completed.\n");
    process.exit(0);
  } catch {
    console.error("\nFAIL — stopped at first phase failure.\n");
    process.exit(1);
  }
}

main();
