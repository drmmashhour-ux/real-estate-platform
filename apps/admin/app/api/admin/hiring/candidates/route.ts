import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { createCandidate } from "@/src/modules/hiring/pipeline";

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
  const b = body as { name?: string; email?: string; role?: string; stage?: string; notes?: string };

  try {
    const row = await createCandidate({
      name: b.name ?? "",
      email: b.email ?? "",
      role: b.role ?? "sales",
      stage: b.stage as never,
      notes: b.notes,
    });
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
