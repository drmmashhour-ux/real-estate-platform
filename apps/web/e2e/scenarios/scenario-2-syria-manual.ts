import { prisma } from "../../lib/db";
import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { trackGrowthEvent } from "../utils/api";
import { statusForThrown } from "../utils/infra";
import { bnhubBookingDates } from "./_http";
import { getMarketSettingsAdmin, patchMarketSettingsAdmin, type MarketSettingsPayload } from "./_market-api";
import { bnhubLoginAs, lecipmLogin } from "./_session";
import { dismissCommonOverlays } from "../helpers/overlays";

const SEED_LISTING = "seed-listing-001";

export async function scenario2SyriaManual(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 2 — Syria manual booking";

  const adminEmail = process.env.E2E_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.E2E_ADMIN_PASSWORD?.trim();
  if (!adminEmail || !adminPassword) {
    return {
      id: 2,
      name,
      status: "BLOCKED",
      detail: "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD required for market API",
      failedSteps: ["admin_env_missing"],
      criticalBugs: [],
    };
  }

  let previous: MarketSettingsPayload | null = null;

  try {
    e2eScenarioStart(2, name);
    e2eStep("s2_admin_login");
    await lecipmLogin(ctx.page, adminEmail, adminPassword);

    previous = await getMarketSettingsAdmin(ctx.page.request, ctx.origin);
    if (!previous) {
      failed.push("GET /api/admin/market-settings failed");
      return { id: 2, name, status: "FAIL", detail: "admin market GET", failedSteps: failed, criticalBugs: bugs };
    }

    e2eStep("s2_patch_syria_market");
    const patched = await patchMarketSettingsAdmin(ctx.page.request, ctx.origin, {
      syriaModeEnabled: true,
      onlinePaymentsEnabled: false,
      manualPaymentTrackingEnabled: true,
      contactFirstEmphasis: true,
      activeMarketCode: "syria",
    });
    if (!patched) {
      failed.push("PATCH syria market failed");
      return { id: 2, name, status: "FAIL", detail: "market patch", failedSteps: failed, criticalBugs: bugs };
    }
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "market_mode_used",
      locale: "en",
      metadata: { source: "e2e_scenario_2", market: "syria" },
    });

    await ctx.page.context().clearCookies();
    e2eStep("s2_guest_create_booking");
    await bnhubLoginAs(ctx.page, "guest@demo.com", `/bnhub/listings/${SEED_LISTING}`);

    const { startDate, endDate } = bnhubBookingDates(310);
    const br = await ctx.page.request.post(`${ctx.origin}/api/bnhub/booking/create`, {
      data: { listingId: SEED_LISTING, startDate, endDate },
      headers: { "Content-Type": "application/json" },
    });
    if (!br.ok()) {
      failed.push(`create booking ${br.status()}: ${await br.text()}`);
      return { id: 2, name, status: "FAIL", detail: "booking create", failedSteps: failed, criticalBugs: bugs };
    }
    const body = (await br.json()) as { booking?: { id?: string } };
    const bookingId = body.booking?.id;
    if (!bookingId) {
      failed.push("no booking id");
      return { id: 2, name, status: "FAIL", detail: "no booking id", failedSteps: failed, criticalBugs: bugs };
    }
    ctx.state.lastBookingId = bookingId;

    const b1 = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true, manualPaymentSettlement: true },
    });
    e2eStep("s2_after_create_db", b1 ?? {});
    if (b1?.status !== "AWAITING_HOST_APPROVAL") {
      failed.push(`expected AWAITING_HOST_APPROVAL got ${b1?.status}`);
    }

    await ctx.page.context().clearCookies();
    e2eStep("s2_host_approve");
    await bnhubLoginAs(ctx.page, "host@demo.com");
    const appr = await ctx.page.request.post(`${ctx.origin}/api/bnhub/bookings/${bookingId}/approve`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!appr.ok()) {
      failed.push(`approve ${appr.status()}: ${await appr.text()}`);
      return { id: 2, name, status: "FAIL", detail: "approve", failedSteps: failed, criticalBugs: bugs };
    }

    const b2 = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true, manualPaymentSettlement: true },
    });
    e2eStep("s2_after_host_approve_db", b2 ?? {});
    if (b2?.status !== "PENDING" || b2.manualPaymentSettlement !== "PENDING") {
      failed.push(`expected PENDING + manual PENDING, got ${JSON.stringify(b2)}`);
    }

    e2eStep("s2_host_manual_received");
    const mp = await ctx.page.request.patch(`${ctx.origin}/api/bookings/manual-payment`, {
      data: { bookingId, action: "received" },
      headers: { "Content-Type": "application/json" },
    });
    if (!mp.ok()) {
      failed.push(`manual-payment ${mp.status()}: ${await mp.text()}`);
      return { id: 2, name, status: "FAIL", detail: "manual payment", failedSteps: failed, criticalBugs: bugs };
    }

    const b3 = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true, manualPaymentSettlement: true },
    });
    const pay = await prisma.payment.findFirst({
      where: { bookingId },
      select: { status: true },
    });
    e2eStep("s2_final_db", { booking: b3, payment: pay });
    if (b3?.status !== "CONFIRMED" || b3.manualPaymentSettlement !== "RECEIVED") {
      failed.push(`expected CONFIRMED + RECEIVED got ${JSON.stringify(b3)}`);
    }
    if (pay?.status !== "COMPLETED") {
      failed.push(`payment not COMPLETED: ${pay?.status}`);
    }

    const audit = await prisma.bookingManualPaymentEvent.count({ where: { bookingId } });
    if (audit < 1) failed.push("missing BookingManualPaymentEvent");

    await ctx.page.goto(`${ctx.origin}/bnhub/booking/${bookingId}`, { waitUntil: "domcontentloaded" });
    await dismissCommonOverlays(ctx.page);
    const txt = await ctx.page.locator("body").innerText();
    if (!/confirmed|booked| réservation|تأكيد/i.test(txt) && !/bnhub/i.test(txt)) {
      failed.push("UI may not show confirmation copy (soft)");
    }

    const status: ScenarioResult["status"] = failed.length === 0 ? "PASS" : "FAIL";
    return {
      id: 2,
      name,
      status,
      detail: status === "PASS" ? "Syria manual path CONFIRMED" : failed.join("; "),
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 2, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  } finally {
    e2eStep("s2_restore_market");
    try {
      await ctx.page.context().clearCookies();
      await lecipmLogin(ctx.page, adminEmail!, adminPassword!);
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
          defaultDisplayCurrency:
            typeof previous.defaultDisplayCurrency === "string" ? previous.defaultDisplayCurrency : undefined,
        });
      }
    } catch (re) {
      console.warn("[E2E] s2 market restore error", re);
    }
  }
}
