import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { acceptLegalAgreement } from "@/lib/hubs/agreements";
import { assertOaciqClientDisclosureAck, oaciqClientDisclosureEnforcementEnabled } from "@/lib/compliance/oaciq/client-disclosure";

/**
 * POST /api/legal/accept-agreement – Record LegalAgreement acceptance (hub + type).
 * Body: { hub: string, type: string, transactionId?: string } — optional transaction links OACIQ client disclosure (AGREEMENT flow).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({})) as {
      hub?: string;
      type?: string;
      transactionId?: string;
    };
    const hub = typeof body.hub === "string" ? body.hub.trim().toLowerCase() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "";
    if (!hub || !type) return Response.json({ error: "hub and type required" }, { status: 400 });

    const allowed = ["hosting_terms", "broker_terms", "developer_terms", "platform_terms"];
    if (!allowed.includes(type)) return Response.json({ error: "Invalid type" }, { status: 400 });

    const transactionId =
      typeof body.transactionId === "string" && body.transactionId.trim() ? body.transactionId.trim() : "";
    if (transactionId && oaciqClientDisclosureEnforcementEnabled()) {
      try {
        await assertOaciqClientDisclosureAck({
          transactionId,
          userId,
          flow: "AGREEMENT",
        });
      } catch (e) {
        return Response.json(
          {
            error: e instanceof Error ? e.message : "OACIQ disclosure required",
            code: "OACIQ_CLIENT_DISCLOSURE_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    await acceptLegalAgreement(userId, hub, type);
    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to record acceptance" }, { status: 500 });
  }
}
