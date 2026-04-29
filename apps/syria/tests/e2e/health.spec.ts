import { test, expect } from "@playwright/test";

test.describe("Health", () => {
  test("/api/health responds", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = (await res.json().catch(() => ({}))) as { status?: string };
    expect(json.status).toBe("ok");
  });
});
