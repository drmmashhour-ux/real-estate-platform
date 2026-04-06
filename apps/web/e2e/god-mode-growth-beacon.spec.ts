import { expect, test } from "@playwright/test";

test.describe("Growth manager beacon", () => {
  test("public landing_page_viewed accepted without session", async ({ request }) => {
    const res = await request.post("/api/growth/manager-track", {
      data: {
        event: "landing_page_viewed",
        path: "/",
        locale: "en",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const json = await res.json();
    expect(json).toMatchObject({ ok: true });
  });
});
