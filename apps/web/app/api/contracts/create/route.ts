import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createLeaseContract } from "@/modules/contracts/services/lease-service";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/**
 * POST /api/contracts/create — Generate lease HTML + Contract + signature rows.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`contracts:create:${ip}`, { windowMs: 60_000, max: 10 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }

    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId.trim() : null;
    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    if (enforceableContractsRequired()) {
      const signed = await hasActiveEnforceableContract(userId, ENFORCEABLE_CONTRACT_TYPES.RENTAL, { listingId });
      if (!signed) {
        return NextResponse.json(
          {
            error:
              "Sign the long-term rental agreement for this listing before generating the lease (ContractSign kind=rental with listing id).",
            code: "ENFORCEABLE_CONTRACT_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    const tenant =
      body?.tenant && typeof body.tenant === "object"
        ? {
            name: String(body.tenant.name ?? "").trim(),
            email: String(body.tenant.email ?? "").trim(),
          }
        : undefined;
    const landlord =
      body?.landlord && typeof body.landlord === "object"
        ? {
            name: String(body.landlord.name ?? "").trim(),
            email: String(body.landlord.email ?? "").trim(),
          }
        : undefined;
    const broker =
      body?.broker && typeof body.broker === "object" && body.broker.name
        ? {
            name: String(body.broker.name ?? "").trim(),
            email: String(body.broker.email ?? "").trim(),
          }
        : null;
    const paymentMethod = typeof body?.paymentMethod === "string" ? body.paymentMethod : undefined;

    const { contractId } = await createLeaseContract({
      actorId: userId,
      actorRole: user.role,
      listingId,
      bookingId,
      tenant,
      landlord,
      broker,
      paymentMethod,
    });

    return NextResponse.json({ ok: true, contractId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create contract";
    const status = msg.includes("Not authorized") || msg.includes("Forbidden") ? 403 : 400;
    console.error("[contracts/create]", e);
    return NextResponse.json({ error: msg }, { status });
  }
}
