/**
 * Supabase guest bookings integrity (read-only).
 *
 * Run: pnpm run validate:bnhub:db
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (local .env only).
 */
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env"), override: true });

async function main() {
  const { validateGuestSupabaseBookingsIntegrity } = await import(
    "../lib/bookings/validate-bookings-integrity"
  );

  console.log("BNHUB DB validation (Supabase guest bookings)\n");
  console.log(
    "Note: Overlap prevention at booking time is enforced by create_guest_booking RPC. This scan is an audit backstop.\n"
  );

  const result = await validateGuestSupabaseBookingsIntegrity();
  const errCount = result.issues.filter((i) => i.severity === "error").length;
  const warnCount = result.issues.filter((i) => i.severity === "warn").length;

  console.log(`Scanned: ${result.scanned} row(s)`);
  console.log(`Issues: ${result.issues.length} (${errCount} error, ${warnCount} warn)\n`);

  if (result.issues.length === 0) {
    console.log("No integrity issues reported.");
  } else {
    for (const i of result.issues) {
      const sev = i.severity.toUpperCase();
      console.log(`[${sev}] ${i.code}`);
      console.log(`  ${i.detail}`);
      if (i.bookingId) console.log(`  bookingId: ${i.bookingId}`);
      if (i.listingId) console.log(`  listingId: ${i.listingId}`);
      console.log("");
    }
  }

  console.log("—");
  if (!result.ok) {
    console.log("Readiness: NOT READY — resolve ERROR-severity issues before soft launch (or document waiver).");
    process.exit(1);
  }
  if (warnCount > 0) {
    console.log(
      "Readiness: WARNINGS present — review above; may still soft-launch if warnings are accepted/known."
    );
    process.exit(0);
  }
  console.log("Readiness: DB integrity scan has no error-severity issues.");
  process.exit(0);
}

void main();
