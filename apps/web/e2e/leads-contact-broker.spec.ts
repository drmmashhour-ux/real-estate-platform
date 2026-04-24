/**
 * End-to-end: public lead form API → DB row + CONTACT_BROKER in launch_events.
 */
import { expect, test } from "@playwright/test";
import { prisma } from "../lib/db";

const SEED_PROJECT_ID = "seed-project-001";

test("POST /api/lecipm/leads (project) creates lead and CONTACT_BROKER launch event", async ({ request }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
  const leadEmail = `e2e-contact-${Date.now()}@example.com`;

  const res = await request.post(`${base}/api/lecipm/leads`, {
    data: {
      projectId: SEED_PROJECT_ID,
      name: "Contact E2E",
      email: leadEmail,
      phone: "5145550199",
      message: "Interested in validation run",
    },
    headers: { "Content-Type": "application/json" },
  });

  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { id?: string };
  expect(body.id).toBeTruthy();

  const lead = await prisma.lead.findUnique({ where: { id: body.id! } });
  expect(lead?.email).toBe(leadEmail);

  const events = await prisma.launchEvent.findMany({
    where: { event: "CONTACT_BROKER" },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  expect(events.some((e) => (e.payload as { leadId?: string }).leadId === body.id)).toBe(true);
});
