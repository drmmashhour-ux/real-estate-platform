import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { createSignedEnforceableContract } from "@/lib/legal/enforceable-contract";
import type { EnforceableContractType } from "@/lib/legal/enforceable-contract-types";
import { getEnforceableTemplate, type EnforceableTemplateKind } from "@/lib/legal/enforceable-contract-templates";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const KINDS = new Set<string>(["buyer", "seller", "rental", "shortTerm", "host", "broker"]);

function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || null;
}

/**
 * POST — create signed enforceable contract + signature + audit (immutable contract row; append-only audit).
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`enforceable-sign:${ip}`, { windowMs: 60_000, max: 8 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    kind?: unknown;
    agree?: unknown;
    signerName?: unknown;
    signatureData?: unknown;
    fsboListingId?: unknown;
    listingId?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (body.agree !== true) {
    return NextResponse.json({ error: "You must accept the agreement" }, { status: 400 });
  }
  const signerName = typeof body.signerName === "string" ? body.signerName.trim() : "";
  if (signerName.length < 2) {
    return NextResponse.json({ error: "Enter your full legal name" }, { status: 400 });
  }

  const fsboListingId = typeof body.fsboListingId === "string" ? body.fsboListingId.trim() : "";
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  const tpl = getEnforceableTemplate(kind as EnforceableTemplateKind);
  const h = await headers();
  const ipAddr = clientIp(h);

  const signatureData = typeof body.signatureData === "string" ? body.signatureData.slice(0, 200_000) : undefined;

  try {
    const { id } = await createSignedEnforceableContract({
      userId,
      email: user.email,
      name: signerName || user.name || user.email,
      contractType: tpl.type as EnforceableContractType,
      version: tpl.version,
      contentText: tpl.body,
      title: tpl.title,
      fsboListingId: fsboListingId || null,
      listingId: listingId || null,
      ipAddress: ipAddr,
      signatureData,
    });
    return NextResponse.json({ ok: true, contractId: id }, { headers: getRateLimitHeaders(rl) });
  } catch (e) {
    console.error("[enforceable-contract/sign]", e);
    return NextResponse.json({ error: "Could not save contract" }, { status: 500 });
  }
}
