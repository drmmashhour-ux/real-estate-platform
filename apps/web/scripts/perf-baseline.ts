/**
 * Captures baseline timings for critical API routes (run in CI or staging).
 */
async function main() {
  console.log("[perf-baseline] Stub — add HTTP checks against STAGING_URL.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
