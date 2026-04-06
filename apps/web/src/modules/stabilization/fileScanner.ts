/**
 * Single implementation: directory reads + walk apps/web for .ts / .tsx / .mts (stabilization + audits).
 */
import { existsSync, readdirSync } from "node:fs";
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

export type ChildEntryVisitor = (args: { absPath: string; name: string; isDirectory: boolean }) => void;

/** One `join(dir, name)` path — use this instead of duplicating readdir loops. */
export function forEachChildEntry(dir: string, visit: ChildEntryVisitor): void {
  if (!existsSync(dir)) return;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const name = String(entry.name);
      visit({
        absPath: join(dir, name),
        name,
        isDirectory: entry.isDirectory(),
      });
    }
  } catch {
    /* permission / race: skip this directory */
  }
}

export function walkTsFiles(root: string, out: string[] = []): string[] {
  forEachChildEntry(root, ({ absPath, name, isDirectory }) => {
    if (isDirectory) {
      if (STABILIZATION_SKIP_DIRS.has(name)) return;
      walkTsFiles(absPath, out);
    } else if (/\.(tsx?|mts)$/.test(name) && !name.endsWith(".d.ts")) {
      out.push(absPath);
    }
  });
  return out;
}
