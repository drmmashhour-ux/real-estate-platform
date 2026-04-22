import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { registerOrUpdateInvestor } from "@/modules/amf-capital/amf-capital.service";

/**
 * POST /api/amf-capital/investors
 * Register or update AMF investor profile (ties to session user when logged in).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    const body = await request.json().catch(() => ({}));
    const legalName = typeof body.legalName === "string" ? body.legalName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!legalName || !email) {
      return Response.json({ error: "legalName and email required" }, { status: 400 });
    }

    const investor = await registerOrUpdateInvestor({
      userId: userId ?? undefined,
      legalName,
      email,
      accreditationStatus: typeof body.accreditationStatus === "string" ? body.accreditationStatus : undefined,
      kycStatus: typeof body.kycStatus === "string" ? body.kycStatus : undefined,
    });

    return Response.json({
      id: investor.id,
      email: investor.email,
      legalName: investor.legalName,
      accreditationStatus: investor.accreditationStatus,
      kycStatus: investor.kycStatus,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
