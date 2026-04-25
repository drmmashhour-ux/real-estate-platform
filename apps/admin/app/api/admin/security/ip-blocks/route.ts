import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  blockSecurityIp,
  listSecurityIpBlocks,
  parseIpOrFingerprint,
  unblockSecurityIp,
} from "@/lib/security/ip-block";
import { securityLog } from "@/lib/security/security-logger";

export const dynamic = "force-dynamic";

/** GET — list recent IP blocks. */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const blocks = await listSecurityIpBlocks(80);
  return Response.json({ blocks });
}

/** POST — block fingerprint or raw IP. Body: { ip | fingerprint, reason?, hours? } */
export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const body = (await request.json()) as { ip?: string; fingerprint?: string; reason?: string; hours?: number };
    const raw = String(body.fingerprint ?? body.ip ?? "").trim();
    if (!raw) return Response.json({ error: "ip or fingerprint required" }, { status: 400 });
    const fp = parseIpOrFingerprint(raw);
    const hours = typeof body.hours === "number" && body.hours > 0 && body.hours <= 8760 ? body.hours : 168;
    await blockSecurityIp({
      ipFingerprint: fp,
      reason: String(body.reason ?? "admin_block"),
      hours,
      createdByUserId: auth.userId,
    });
    void securityLog({
      event: "admin_action",
      detail: "security_ip_block",
      persist: true,
      entityId: fp,
      subjectHint: auth.userId,
    });
    return Response.json({ ok: true, ipFingerprint: fp });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to block" }, { status: 500 });
  }
}

/** DELETE — ?fingerprint=… */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const fp = request.nextUrl.searchParams.get("fingerprint")?.trim();
  if (!fp) return Response.json({ error: "fingerprint required" }, { status: 400 });
  const ok = await unblockSecurityIp(parseIpOrFingerprint(fp));
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  void securityLog({
    event: "admin_action",
    detail: "security_ip_unblock",
    persist: true,
    entityId: fp,
    subjectHint: auth.userId,
  });
  return Response.json({ ok: true });
}
