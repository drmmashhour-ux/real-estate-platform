import { prisma } from "../../lib/db";
import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { statusForThrown } from "../utils/infra";
import { bnhubBookingDates } from "./_http";
import { bnhubLoginAs } from "./_session";

const SEED_LISTING = "seed-listing-001";

export async function scenario8Cancel(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 8 — guest cancellation";

  try {
    e2eScenarioStart(8, name);
    await ctx.page.context().clearCookies();
    e2eStep("s8_guest_login");
    await bnhubLoginAs(ctx.page, "guest@demo.com");

    const { startDate, endDate } = bnhubBookingDates(340);
    const br = await ctx.page.request.post(`${ctx.origin}/api/bnhub/booking/create`, {
      data: { listingId: SEED_LISTING, startDate, endDate },
      headers: { "Content-Type": "application/json" },
    });
    if (!br.ok()) {
      return {
        id: 8,
        name,
        status: "FAIL",
        detail: await br.text(),
        failedSteps: ["create"],
        criticalBugs: [],
      };
    }
    const bj = (await br.json()) as { booking?: { id?: string } };
    const bookingId = bj.booking?.id;
    if (!bookingId) {
      return { id: 8, name, status: "FAIL", detail: "no id", failedSteps: ["create"], criticalBugs: [] };
    }

    e2eStep("s8_cancel_api");
    const cx = await ctx.page.request.post(`${ctx.origin}/api/bnhub/bookings/${bookingId}/cancel`, {
      data: { by: "guest" },
      headers: { "Content-Type": "application/json" },
    });
    if (!cx.ok()) {
      failed.push(`cancel ${cx.status()}: ${await cx.text()}`);
    }

    const row = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });
    e2eStep("s8_db_status", row ?? {});
    if (row?.status !== "CANCELLED_BY_GUEST" && row?.status !== "CANCELLED") {
      failed.push(`expected cancelled got ${row?.status}`);
    }

    const ev = await prisma.bnhubBookingEvent.findFirst({
      where: { bookingId, eventType: "cancelled" },
      orderBy: { createdAt: "desc" },
    });
    if (!ev) failed.push("missing bnhub cancelled event");

    return {
      id: 8,
      name,
      status: failed.length ? "FAIL" : "PASS",
      detail: "guest cancelled booking",
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 8, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  }
}
