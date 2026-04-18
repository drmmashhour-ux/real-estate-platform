/**
 * Resolve monorepo root (apps/web → repo root). Used to read docs/ from governance services.
 */
import path from "path";

export function getMonorepoRoot(override?: string): string {
  if (override) return path.resolve(override);
  return path.resolve(process.cwd(), "..", "..");
}
