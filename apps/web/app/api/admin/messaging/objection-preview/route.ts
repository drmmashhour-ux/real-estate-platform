import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { resolveObjectionTemplateType } from "@/src/modules/messaging/objections";
import { getTemplate, personalize } from "@/src/services/messaging";

export const dynamic = "force-dynamic";

/** POST /api/admin/messaging/objection-preview — resolve objection copy (no send). */
export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: { text?: string; name?: string; city?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text : "";
  const type = resolveObjectionTemplateType(text);
  if (!type) return Response.json({ templateType: null, subject: null, body: null });

  const tpl = await getTemplate("warm", type);
  if (!tpl) return Response.json({ templateType: type, subject: null, body: null, error: "Template missing — run seed" });

  const vars = {
    name: typeof body.name === "string" ? body.name : "there",
    city: typeof body.city === "string" ? body.city : "your area",
  };
  return Response.json({
    templateType: type,
    subject: tpl.subject ? personalize(tpl.subject, vars) : null,
    body: personalize(tpl.content, vars),
  });
}
