import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { trackGrowthEvent } from "../utils/api";
import { statusForThrown } from "../utils/infra";
import { bnhubLoginAs } from "./_session";
import { prisma } from "../../lib/db";

export async function scenario5HostListing(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 5 — host creates listing";

  const runId = `e2e-s5-${Date.now()}`;

  try {
    e2eScenarioStart(5, name);
    await ctx.page.context().clearCookies();
    e2eStep("s5_host_login");
    await bnhubLoginAs(ctx.page, "host@demo.com", "/bnhub/host/listings/new");

    const payload = {
      title: `E2E Scenario 5 ${runId}`,
      address: "50 Rue E2E",
      city: "Montreal",
      region: "QC",
      country: "CA",
      nightPriceCents: 15000,
      currency: "cad",
      beds: 2,
      baths: 1,
      maxGuests: 4,
      photos: [`https://example.com/e2e-${runId}.jpg`],
      listingStatus: "DRAFT",
      cancellationPolicy: "moderate",
    };

    e2eStep("s5_create_listing_api");
    const res = await ctx.page.request.post(`${ctx.origin}/api/bnhub/listings/create`, {
      data: payload,
      headers: { "Content-Type": "application/json" },
    });
    const raw = await res.text();
    if (!res.ok()) {
      return {
        id: 5,
        name,
        status: "BLOCKED",
        detail: `create listing ${res.status()}: ${raw.slice(0, 400)}`,
        failedSteps: ["listing_create_api"],
        criticalBugs: [],
      };
    }

    const body = JSON.parse(raw) as { id?: string; error?: string };
    const listingId = body.id;
    if (!listingId) {
      failed.push(body.error ?? "missing listing id in response");
      return { id: 5, name, status: "FAIL", detail: raw.slice(0, 400), failedSteps: failed, criticalBugs: bugs };
    }
    ctx.state.lastListingId = listingId;
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "listing_created",
      locale: "en",
      listingId,
      metadata: { source: "e2e_s5" },
    });

    const row = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { id: true, listingStatus: true, title: true },
    });
    e2eStep("s5_db_listing", row ?? {});
    if (!row) failed.push("listing not in DB");

    e2eStep("s5_publish_patch");
    const pub = await ctx.page.request.patch(`${ctx.origin}/api/bnhub/listings/${listingId}`, {
      data: { listingStatus: "PUBLISHED" },
      headers: { "Content-Type": "application/json" },
    });
    if (!pub.ok()) {
      failed.push(`publish ${pub.status()}: ${await pub.text()}`);
    }

    const row2 = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { listingStatus: true },
    });
    if (row2?.listingStatus !== "PUBLISHED") {
      failed.push(`expected PUBLISHED got ${row2?.listingStatus}`);
    } else {
      await trackGrowthEvent(ctx.page, ctx.origin, {
        event: "listing_published",
        locale: "en",
        listingId,
        metadata: { source: "e2e_s5" },
      });
    }

    return {
      id: 5,
      name,
      status: failed.length ? "FAIL" : "PASS",
      detail: `listing ${listingId}`,
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 5, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  }
}
