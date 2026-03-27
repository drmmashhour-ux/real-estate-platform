/**
 * One-off migration: backfill tenant identifiers on legacy rows.
 */
async function main() {
  console.log("[backfill-tenant-ids] Stub — implement with Prisma transactions.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
