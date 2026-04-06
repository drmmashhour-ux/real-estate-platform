import { describe, it, expect } from "vitest";
import { jsonSuccess, jsonFailure, jsonUnauthorized } from "../api-response";

describe("api-response", () => {
  it("jsonSuccess wraps data with success flag", async () => {
    const r = jsonSuccess({ id: "1" });
    expect(r.status).toBe(200);
    const j = (await r.json()) as { success: boolean; data: { id: string } };
    expect(j.success).toBe(true);
    expect(j.data.id).toBe("1");
  });

  it("jsonFailure includes error and optional code", async () => {
    const r = jsonFailure("bad", 422, "VALIDATION");
    expect(r.status).toBe(422);
    const j = (await r.json()) as { success: boolean; error: string; code?: string };
    expect(j.success).toBe(false);
    expect(j.error).toBe("bad");
    expect(j.code).toBe("VALIDATION");
  });

  it("jsonUnauthorized returns 401", async () => {
    const r = jsonUnauthorized();
    expect(r.status).toBe(401);
  });
});
