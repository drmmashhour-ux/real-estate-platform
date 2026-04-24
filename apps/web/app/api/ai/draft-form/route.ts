import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { requireActiveResidentialBrokerLicence } from "@/lib/compliance/oaciq/broker-licence-guard";
import { detectNotices } from "@/modules/notice-engine/noticeEngine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (auth.user.role !== PlatformRole.BROKER) {
    return NextResponse.json({ error: "ACCESS_DENIED_NOT_LICENSED" }, { status: 403 });
  }

  const licenceBlock = await requireActiveResidentialBrokerLicence(auth.user.id, {});
  if (licenceBlock) {
    const body = await licenceBlock.json().catch(() => ({}));
    return NextResponse.json(
      { error: "ACCESS_DENIED_NOT_LICENSED", detail: body },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  const type = typeof rec.type === "string" ? rec.type : "form";
  const input = typeof rec.input === "string" ? rec.input : "";

  const notices = detectNotices({
    hasWarrantyExclusion: input.toLowerCase().includes("sans garantie") || input.toLowerCase().includes("no warranty"),
    buyerRepresented: !input.toLowerCase().includes("représenté par"),
    inclusionsModified: input.toLowerCase().includes("inclusions") || input.toLowerCase().includes("exclusions"),
    containsPersonalData: true,
  });

  return NextResponse.json({
    text: `Draft for ${type}:\n\n${input}\n\n[AI-enhanced based on OACIQ guidelines — stub; replace with governed model pipeline when ready]`,
    notices,
  });
}
