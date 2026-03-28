/**
 * Single implementation: walk apps/web for .ts / .tsx / .mts (stabilization + import audits).
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

export const STABILIZATION_SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "out",
  "coverage",
  ".turbo",
  "playwright-report",
  "test-results",
  "e2e-report",
]);

export function walkTsFiles(root: string, out: string[] = []): string[] {
  try {
    const entries = readdirSync(root, { withFileTypes: true });
    for (const entry of entries) {
      const entryName = String(entry.name);
      const absPath = join(root, entryName);
      if (entry.isDirectory()) {
        if (STABILIZATION_SKIP_DIRS.has(entryName)) continue;
        walkTsFiles(absPath, out);
      } else if (/\.(tsx?|mts)$/.test(entryName) && !entryName.endsWith(".d.ts")) {
        out.push(absPath);
      }
    }
  } catch {
    return out;
  }
  return out;
}
