import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { createGrant } from "@/src/modules/equity/grants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as {
    holderId?: string;
    totalShares?: number;
    vestingStart?: string;
    vestingDuration?: number;
    cliffMonths?: number;
  };

  try {
    const row = await createGrant({
      holderId: b.holderId ?? "",
      totalShares: Number(b.totalShares),
      vestingStart: b.vestingStart ? new Date(b.vestingStart) : new Date(),
      vestingDuration: Number(b.vestingDuration ?? 48),
      cliffMonths: Number(b.cliffMonths ?? 12),
    });
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
