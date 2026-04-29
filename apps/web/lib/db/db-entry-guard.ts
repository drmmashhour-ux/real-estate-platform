/**
 * Runs before any `@/lib/db*` or `pg` load. Import this as the FIRST side-effect import in DB barrels.
 */
if (typeof window !== "undefined") {
  throw new Error("❌ DB imported in client bundle");
}
