import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Resolve a file under `public/` for server-side readers (e.g. @react-pdf/renderer).
 * Tries `cwd` as app root (Vercel / `pnpm --filter @lecipm/web`) and monorepo root.
 */
export function resolvePublicAssetPath(filename: string): string {
  const rel = join("public", filename);
  const candidates = [join(process.cwd(), rel), join(process.cwd(), "apps", "web", rel)];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}
