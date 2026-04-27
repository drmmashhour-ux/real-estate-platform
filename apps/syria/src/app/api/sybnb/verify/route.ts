import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { getAdminUser, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { firstZodIssueMessage, sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";
import { sybnbVerifyBody } from "@/lib/sybnb/sybnb-api-schemas";

/**
 * SY8-1: sync seller trust fields — phone (from `phoneVerifiedAt`) or admin manual override.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return sybnbFail("Invalid JSON", 400);
  }
  const parsed = sybnbVerifyBody.safeParse(raw);
  if (!parsed.success) {
    return sybnbFail(firstZodIssueMessage(parsed.error), 400);
  }

  const body = parsed.data;
  if (body.mode === "phone") {
    const user = await getSessionUser();
    if (!user) {
      return sybnbFail("unauthorized", 401);
    }
    try {
      const fresh = await prisma.syriaAppUser.findUnique({ where: { id: user.id } });
      if (!fresh) {
        return sybnbFail("not_found", 404);
      }
      if (fresh.phoneVerifiedAt == null) {
        return sybnbFail("phone_not_verified", 400);
      }
      if (fresh.verificationLevel === "manual") {
        return sybnbJson({ user: { id: fresh.id, verificationLevel: fresh.verificationLevel } });
      }
      const now = new Date();
      const updated = await prisma.syriaAppUser.update({
        where: { id: fresh.id },
        data: { verifiedAt: now, verificationLevel: "phone" },
      });
      return sybnbJson({
        user: { id: updated.id, verifiedAt: updated.verifiedAt, verificationLevel: updated.verificationLevel },
      });
    } catch (e) {
      console.error("[SYBNB] verify phone failed", e instanceof Error ? e.message : e);
      return sybnbFail("server_error", 500);
    }
  }

  const admin = await getAdminUser();
  if (!admin) {
    return sybnbFail("forbidden", 403);
  }
  const userId = body.userId;
  try {
    const target = await prisma.syriaAppUser.findUnique({ where: { id: userId } });
    if (!target) {
      return sybnbFail("not_found", 404);
    }
    const now = new Date();
    const updated = await prisma.syriaAppUser.update({
      where: { id: userId },
      data: { verifiedAt: now, verificationLevel: "manual" },
    });
    return sybnbJson({
      user: { id: updated.id, verifiedAt: updated.verifiedAt, verificationLevel: updated.verificationLevel },
    });
  } catch (e) {
    console.error("[SYBNB] verify manual failed", e instanceof Error ? e.message : e);
    return sybnbFail("server_error", 500);
  }
}
