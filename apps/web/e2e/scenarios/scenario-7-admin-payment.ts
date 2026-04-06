import { prisma } from "../../lib/db";
import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { statusForThrown } from "../utils/infra";
import { bnhubBookingDates } from "./_http";
import { getMarketSettingsAdmin, patchMarketSettingsAdmin, type MarketSettingsPayload } from "./_market-api";
import { bnhubLoginAs, lecipmLogin } from "./_session";

const SEED_LISTING = "seed-listing-001";

export async function scenario7AdminPayment(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 7 — admin manual payment";

  const adminEmail = process.env.E2E_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.E2E_ADMIN_PASSWORD?.trim();
  if (!adminEmail || !adminPassword) {
    return {
      id: 7,
      name,
      status: "BLOCKED",
      detail: "E2E_ADMIN_* required",
      failedSteps: [],
      criticalBugs: [],
    };
  }

  let previous: MarketSettingsPayload | null = null;

  try {
    e2eScenarioStart(7, name);
    await lecipmLogin(ctx.page, adminEmail, adminPassword);
    previous = await getMarketSettingsAdmin(ctx.page.request, ctx.origin);
    if (!previous) {
      return { id: 7, name, status: "FAIL", detail: "market GET", failedSteps: ["admin_market_get"], criticalBugs: [] };
    }
    await patchMarketSettingsAdmin(ctx.page.request, ctx.origin, {
      syriaModeEnabled: true,
      onlinePaymentsEnabled: false,
      manualPaymentTrackingEnabled: true,
      activeMarketCode: "syria",
    });

    await ctx.page.context().clearCookies();
    await bnhubLoginAs(ctx.page, "guest@demo.com");
    const { startDate, endDate } = bnhubBookingDates(330);
    const br = await ctx.page.request.post(`${ctx.origin}/api/bnhub/booking/create`, {
      data: { listingId: SEED_LISTING, startDate, endDate },
      headers: { "Content-Type": "application/json" },
    });
    if (!br.ok()) {
      failed.push(`booking create ${await br.text()}`);
      throw new Error(failed[0]);
    }
    const bj = (await br.json()) as { booking?: { id?: string } };
    const bookingId = bj.booking?.id;
    if (!bookingId) throw new Error("no booking id");

    await ctx.page.context().clearCookies();
    await bnhubLoginAs(ctx.page, "host@demo.com");
    const appr = await ctx.page.request.post(`${ctx.origin}/api/bnhub/bookings/${bookingId}/approve`);
    if (!appr.ok()) {
      failed.push(`approve ${await appr.text()}`);
      throw new Error(failed[0]);
    }

    await ctx.page.context().clearCookies();
    await lecipmLogin(ctx.page, adminEmail, adminPassword);
    e2eStep("s7_admin_mark_manual_received");
    const mp = await ctx.page.request.patch(`${ctx.origin}/api/bookings/manual-payment`, {
      data: { bookingId, action: "received" },
      headers: { "Content-Type": "application/json" },
    });
    if (!mp.ok()) {
      failed.push(`admin manual-payment ${mp.status()}: ${await mp.text()}`);
    }

    const row = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true, manualPaymentSettlement: true },
    });
    const audits = await prisma.bookingManualPaymentEvent.count({ where: { bookingId } });
    e2eStep("s7_db", { row, audits });

    if (row?.status !== "CONFIRMED" || row.manualPaymentSettlement !== "RECEIVED") {
      failed.push(`expected CONFIRMED/RECEIVED got ${JSON.stringify(row)}`);
    }
    if (audits < 1) failed.push("no manual payment audit rows");

    return {
      id: 7,
      name,
      status: failed.length ? "FAIL" : "PASS",
      detail: "admin marked manual payment received",
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 7, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  } finally {
    try {
      await ctx.page.context().clearCookies();
      await lecipmLogin(ctx.page, adminEmail, adminPassword);
      if (previous) {
        await patchMarketSettingsAdmin(ctx.page.request, ctx.origin, {
          syriaModeEnabled: Boolean(previous.syriaModeEnabled),
          onlinePaymentsEnabled: Boolean(previous.onlinePaymentsEnabled),
          manualPaymentTrackingEnabled: Boolean(previous.manualPaymentTrackingEnabled),
          contactFirstEmphasis: Boolean(previous.contactFirstEmphasis),
          activeMarketCode:
            typeof previous.activeMarketCode === "string" && previous.activeMarketCode.length > 0
              ? previous.activeMarketCode
              : "default",
        });
      }
    } catch (re) {
      console.warn("[E2E] s7 restore", re);
    }
  }
}
