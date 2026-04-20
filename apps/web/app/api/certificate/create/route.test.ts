import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

import { buildDraftCertificatePayload } from "@/modules/certificates/lib/build-draft-certificate";
import { POST } from "./route";

describe("POST /api/certificate/create", () => {
  const originalLog = console.log;

  beforeEach(() => {
    console.log = vi.fn();
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("returns success and normalized certificate", async () => {
    const cert = buildDraftCertificatePayload({
      syndicateName: "Acme Syndicate",
      buildingAddress: "100 Main",
    });

    const req = {
      json: async () => cert,
    } as Pick<NextRequest, "json"> as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      success: boolean;
      certificate: { id: string; condition: { level: string } };
    };
    expect(json.success).toBe(true);
    expect(json.certificate.id).toBe(cert.id);
    expect(json.certificate.condition.level).toBe("AVERAGE");

    expect(console.log).toHaveBeenCalledWith("[certificate:create]", cert.id);
    expect(console.log).toHaveBeenCalledWith("[certificate:pdf]", cert.id);
  });
});
