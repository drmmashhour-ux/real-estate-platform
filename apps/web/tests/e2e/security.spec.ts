import { expect, test } from "@playwright/test";
import { loginAsBroker, loginAsGuest, loginAsHost } from "./utils/auth";

const foreignBookingId = "00000000-0000-0000-0000-000000000099";
const foreignDealId = "00000000-0000-0000-0000-000000000088";
const foreignListingId = "00000000-0000-0000-0000-000000000077";

test.describe("Cross-user API boundaries", () => {
  test("guest cannot read arbitrary booking id", async ({ page }) => {
    const hasPw = !!(process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim());
    test.skip(!hasPw, "Login credentials required.");

    await loginAsGuest(page);
    const res = await page.request.get(`/api/bnhub/bookings/${foreignBookingId}`);
    expect([403, 404]).toContain(res.status());
  });

  test("host cannot access arbitrary listing edit API", async ({ page }) => {
    const hasPw = !!(process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim());
    test.skip(!hasPw, "Login credentials required.");

    await loginAsHost(page);
    const res = await page.request.get(`/api/host/listings/${foreignListingId}`);
    expect([403, 404]).toContain(res.status());
  });

  test("broker cannot load arbitrary residential deal workspace", async ({ page }) => {
    const hasPw = !!(process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim());
    test.skip(!hasPw, "Login credentials required.");

    await loginAsBroker(page);
    const res = await page.request.get(`/api/broker/residential/deals/${foreignDealId}`);
    expect([403, 404]).toContain(res.status());
  });
});
