/**
 * Job: refresh market valuations (sale, long-term rent).
 * Call platform API to trigger valuations for recently updated properties.
 * Run daily via cron.
 */

const PLATFORM_API_BASE = process.env.PLATFORM_API_BASE || "http://localhost:3000";

async function main(): Promise<void> {
  const res = await fetch(`${PLATFORM_API_BASE}/api/valuation/jobs/refresh-market`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    console.error("Refresh market job failed:", await res.text());
    process.exit(1);
  }
  const data = await res.json();
  console.log("Refresh market job completed:", data);
}

main();
