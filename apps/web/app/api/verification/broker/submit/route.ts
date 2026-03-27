import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { upsertBrokerVerification } from "@/lib/verification/broker";
import { syncBrokerTrustGraphForUser } from "@/lib/trustgraph/application/integrations/brokerProfileIntegration";

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json();
    const { licenseNumber, brokerageCompany } = body;
    if (!licenseNumber?.trim() || !brokerageCompany?.trim()) {
      return Response.json(
        { error: "licenseNumber and brokerageCompany required" },
        { status: 400 }
      );
    }

    const record = await upsertBrokerVerification({
      userId,
      licenseNumber: String(licenseNumber).trim(),
      brokerageCompany: String(brokerageCompany).trim(),
    });
    void syncBrokerTrustGraphForUser({ userId, actorUserId: userId }).catch(() => {});
    return Response.json({
      id: record.id,
      licenseNumber: record.licenseNumber,
      brokerageCompany: record.brokerageCompany,
      verificationStatus: record.verificationStatus,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Submit failed" },
      { status: 400 }
    );
  }
}
