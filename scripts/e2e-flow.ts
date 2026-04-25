/**
 * Delegates to apps/web E2EFlowValidator (requires @/ path aliases + Prisma env).
 * From monorepo root: `pnpm e2e:test` or `npx tsx scripts/e2e-flow.ts`
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync("pnpm", ["--filter", "@lecipm/web", "exec", "npx", "tsx", "scripts/e2e-flow.ts"], {
  stdio: "inherit",
  cwd: root,
  shell: false,
  env: process.env,
});
process.exit(r.status ?? 1);
