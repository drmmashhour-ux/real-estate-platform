import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { createAcquisitionInvite, inviteLandingPath } from "@/modules/acquisition/invite.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json()) as { contactId?: string | null; inviteeEmail?: string | null };
  const inv = await createAcquisitionInvite({
    contactId: body.contactId ?? undefined,
    inviterUserId: auth.userId ?? undefined,
    inviteeEmail: body.inviteeEmail ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    code: inv.code,
    token: inv.token,
    path: inviteLandingPath(inv.code),
  });
}
