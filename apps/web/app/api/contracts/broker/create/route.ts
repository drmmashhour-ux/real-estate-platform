import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createBrokerContract, type BrokerContractTypeKey } from "@/modules/contracts/services/broker-contract-service";

export const dynamic = "force-dynamic";

function ip(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
}

const VALID: BrokerContractTypeKey[] = [
  "broker_agreement_seller",
  "broker_agreement_buyer",
  "referral_agreement",
  "collaboration_agreement",
];

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`contracts:broker:${ip(req)}`, { windowMs: 60_000, max: 15 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(limit) });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const contractType = body?.contractType as string;
  if (!VALID.includes(contractType as BrokerContractTypeKey)) {
    return NextResponse.json({ error: "Invalid contractType" }, { status: 400 });
  }

  try {
    const result = await createBrokerContract({
      actorId: userId,
      actorRole: user.role,
      contractType: contractType as BrokerContractTypeKey,
      body: typeof body.payload === "object" && body.payload ? body.payload : body,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const code = msg.includes("Not authorized") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
