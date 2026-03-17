import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { upsertBrokerVerification } from "@/lib/verification/broker";

/**
 * POST /api/broker-verification
 * Fields: user_id (optional, defaults to session), license_number, brokerage_company.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUserId = await getGuestId();
    if (!sessionUserId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userIdParam = (body.user_id as string)?.trim();
    const userId = userIdParam && userIdParam === sessionUserId ? userIdParam : sessionUserId;
    if (userId !== sessionUserId) {
      return Response.json({ error: "Can only submit broker verification for yourself" }, { status: 403 });
    }

    const licenseNumber = (body.license_number as string)?.trim();
    const brokerageCompany = (body.brokerage_company as string)?.trim();

    if (!licenseNumber || !brokerageCompany) {
      return Response.json(
        { error: "license_number and brokerage_company required" },
        { status: 400 }
      );
    }

    const record = await upsertBrokerVerification({
      userId,
      licenseNumber,
      brokerageCompany,
    });

    return Response.json({
      user_id: record.userId,
      license_number: record.licenseNumber,
      brokerage_company: record.brokerageCompany,
      verification_status: record.verificationStatus.toLowerCase(),
      verified_at: record.verifiedAt,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Broker verification failed" },
      { status: 400 }
    );
  }
}
