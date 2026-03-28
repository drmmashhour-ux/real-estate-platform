/**
 * Growth engine smoke test (Prisma / Postgres).
 * pnpm run validate:growth-engine
 */
import { prisma } from "../lib/db";
import { trackEvent } from "../src/services/analytics";
import { createLead, addActivity } from "../src/services/crm";
import { onSignupAutomation } from "../src/services/automation";
import { getGrowthDashboardData } from "../src/modules/dashboard/getGrowthDashboardData";
import { checkGrowthAlerts } from "../src/services/alerts";

async function main() {
  const u = await prisma.user.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, email: true } });
  if (!u) {
    console.warn("[growth-engine] No user in DB — skipping signup-related steps.");
  } else {
    await trackEvent("signup", { validate: true }, { userId: u.id });
    await onSignupAutomation(u.id);
    console.info("[growth-engine] signup track + welcome queue for", u.id);
  }

  await trackEvent("listing_view", { validate: true, slug: "smoke" }, { userId: u?.id });
  console.info("[growth-engine] listing_view tracked");

  const lead = await createLead({
    userId: u?.id,
    listingId: null,
    name: "Growth Smoke",
    email: u?.email ?? `smoke-${Date.now()}@example.com`,
    phone: "",
    message: "validate-growth-engine",
    leadSource: "validate_script",
  });
  await addActivity(lead.id, "system", "validate-growth-engine script");
  console.info("[growth-engine] lead + activity", lead.id);

  const dash = await getGrowthDashboardData();
  console.info("[growth-engine] dashboard snapshot", {
    users: dash.totals.users,
    leads: dash.totals.leads,
    revenue30d: dash.totals.revenueCents30d,
  });

  const alerts = await checkGrowthAlerts();
  console.info("[growth-engine] alerts", alerts.length ? alerts : "none");

  console.info("LECIPM Growth Engine Running");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
