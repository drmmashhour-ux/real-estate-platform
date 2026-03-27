import { NextRequest } from "next/server";

/**
 * Fraud risk score stub. In production: integrate with trust-safety service,
 * ML model, or rules (suspicious patterns, device fingerprint, dispute rate).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const bookingId = searchParams.get("bookingId");
    const listingId = searchParams.get("listingId");
    if (!userId && !bookingId && !listingId) {
      return Response.json(
        { error: "At least one of userId, bookingId, listingId required" },
        { status: 400 }
      );
    }
    // Stub: return low risk; replace with real scoring
    const riskScore = 0.1;
    const level = riskScore >= 0.7 ? "high" : riskScore >= 0.4 ? "medium" : "low";
    return Response.json({
      riskScore,
      level,
      signals: [] as string[],
      message: "Risk assessment stub; connect to trust & safety service for production.",
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get risk assessment" }, { status: 500 });
  }
}
