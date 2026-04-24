import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { signContractUniversal } from "@/modules/contracts/services/sign-contract";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/**
 * POST /api/contracts/sign — Record typed signature + IP; complete when all parties signed.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`contracts:sign:${ip}`, { windowMs: 60_000, max: 30 });
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

    const body = await request.json().catch(() => ({}));
    const contractId = typeof body?.contractId === "string" ? body.contractId.trim() : "";
    const typedName = typeof body?.name === "string" ? body.name.trim() : "";
    const signatureData = typeof body?.signatureData === "string" ? body.signatureData : null;

    if (!contractId) {
      return NextResponse.json({ error: "contractId required" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const result = await signContractUniversal({
      contractId,
      userId,
      userEmail: dbUser?.email ?? null,
      typedName,
      signatureData,
      ipAddress: ip === "anonymous" ? null : ip,
    });

    if (!result.ok) {
      const st = result.error === "Forbidden" ? 403 : result.error.includes("not found") ? 404 : 400;
      if (result.error === "CONTRACT_BRAIN_NOTICE_REQUIRED") {
        return NextResponse.json(
          {
            error: result.error,
            missingNotices: result.missingNotices ?? [],
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: result.error }, { status: st });
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (e) {
    console.error("[contracts/sign]", e);
    return NextResponse.json({ error: "Sign failed" }, { status: 500 });
  }
}
