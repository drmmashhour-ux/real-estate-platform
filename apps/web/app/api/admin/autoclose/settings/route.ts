import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getAutoCloseSettings, readAutoCloseEnv, setAutoClosePaused } from "@/src/modules/autoclose/autoCloseEngine";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const uid = await getGuestId();
  if (!uid) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const u = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (u?.role !== "ADMIN") return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { uid };
}

/** GET — env flags + pause state */
export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const settings = await getAutoCloseSettings();
  const env = readAutoCloseEnv();

  return Response.json({
    env,
    paused: settings.paused,
    effective: env.envAllowsExecution && !settings.paused,
  });
}

/** PATCH — { "paused": boolean } */
export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  let body: { paused?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.paused !== "boolean") {
    return Response.json({ error: "paused boolean required" }, { status: 400 });
  }
  await setAutoClosePaused(body.paused);
  const settings = await getAutoCloseSettings();
  const env = readAutoCloseEnv();
  return Response.json({
    ok: true,
    paused: settings.paused,
    effective: env.envAllowsExecution && !settings.paused,
  });
}
