import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { signMarketplaceContract } from "@/lib/contracts/fsbo-seller-contracts";

export const dynamic = "force-dynamic";

function clientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

/**
 * POST — Simple seller acceptance for FSBO marketplace contracts (checkbox + confirm).
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { contractId?: unknown; confirm?: unknown } | null;
  const contractId = typeof body?.contractId === "string" ? body.contractId.trim() : "";
  const confirm = body?.confirm === true;

  if (!contractId) return NextResponse.json({ error: "contractId required" }, { status: 400 });
  if (!confirm) return NextResponse.json({ error: "confirm must be true" }, { status: 400 });

  const result = await signMarketplaceContract({ contractId, userId, ipAddress: clientIp(req) });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
