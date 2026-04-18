import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getExecutiveSession, logExecutiveOfficeAudit } from "./executive-visibility.service";
import type { ExecutiveSession } from "./owner-access.types";

export type ExecutiveAuthResult = ExecutiveSession | { response: Response };

export async function requireExecutiveSession(): Promise<ExecutiveAuthResult> {
  const userId = await getGuestId();
  if (!userId) {
    return { response: Response.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const session = await getExecutiveSession(user.id, user.role);
  if (!session) {
    return { response: Response.json({ error: "Executive access only" }, { status: 403 }) };
  }
  return session;
}

export async function auditExecutiveAction(input: {
  session: ExecutiveSession;
  actionKey: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (input.session.scope.kind === "office" && input.session.scope.officeIds[0]) {
    await logExecutiveOfficeAudit({
      officeId: input.session.scope.officeIds[0],
      actorUserId: input.session.userId,
      actionKey: input.actionKey,
      payload: {
        ...input.payload,
        scope: input.session.scope.kind,
        officeIds: input.session.scope.kind === "office" ? input.session.scope.officeIds : undefined,
      },
    });
  }
}

export { getExecutiveSession, logExecutiveOfficeAudit };
