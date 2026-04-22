import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/require-api-session";
import { upsertFamilyAccess } from "@/modules/soins/soins-family.service";
import type { MobileAuthUser } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

async function sessionToMobileActor(userId: string): Promise<MobileAuthUser | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

/** Admin dashboard — cookie session — grant/update family permissions (same rules as mobile). */
export async function POST(request: Request) {
  const sess = await requireApiSession();
  if (!sess.ok) return sess.response;

  const actor = await sessionToMobileActor(sess.userId);
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as null | {
    residentId: string;
    familyUserId: string;
    canViewCamera?: boolean;
    canChat?: boolean;
    canReceiveAlerts?: boolean;
  };

  if (!body?.residentId || !body.familyUserId) {
    return Response.json({ error: "residentId and familyUserId required" }, { status: 400 });
  }

  const res = await upsertFamilyAccess({
    actingUser: actor,
    residentId: body.residentId,
    familyUserId: body.familyUserId,
    canViewCamera: body.canViewCamera,
    canChat: body.canChat,
    canReceiveAlerts: body.canReceiveAlerts,
  });

  if (!res.ok) {
    return Response.json({ error: res.error }, { status: res.error === "Forbidden" ? 403 : 400 });
  }

  return Response.json({ ok: true });
}
