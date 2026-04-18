import { expect, test } from "@playwright/test";
import { e2ePath } from "./utils/constants";

test.describe("Edge UX and resilience", () => {
  test("booking API without session returns 401", async ({ request }) => {
    const res = await request.post("/api/bnhub/bookings", {
      data: { listingId: "x", checkIn: "2099-01-01", checkOut: "2099-01-03" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(401);
  });

  test("invalid create payload returns 4xx", async ({ request }) => {
    const res = await request.post("/api/bookings/create", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401]).toContain(res.status());
  });

  test("stays page survives slow document", async ({ page }) => {
    await page.route("**/*", async (route, req) => {
      if (req.resourceType() === "document") await new Promise((r) => setTimeout(r, 200));
      await route.continue();
    });
    await page.goto(e2ePath("/bnhub/stays"));
    await expect(page.locator("body")).toBeVisible();
  });

  test("retry reload on stays", async ({ page }) => {
    await page.goto(e2ePath("/bnhub/stays"));
    await page.reload();
    await expect(page.locator("body")).toBeVisible();
  });
});
