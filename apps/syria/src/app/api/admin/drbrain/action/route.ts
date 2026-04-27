import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import {
  runDrBrainMaintenanceAction,
  type DrBrainMaintenanceAction,
} from "@/lib/drbrain/actions";

const ALLOWED: readonly DrBrainMaintenanceAction[] = [
  "CLEAR_CACHE",
  "RESTART_JOBS",
  "ENABLE_STRICT_FRAUD",
  "DISABLE_PAYMENTS",
  "RECHECK_SYSTEM",
];

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const action =
    typeof body === "object" && body !== null && "action" in body && typeof (body as { action: unknown }).action === "string"
      ? ((body as { action: string }).action as DrBrainMaintenanceAction)
      : null;

  if (!action || !ALLOWED.includes(action)) {
    return NextResponse.json({ ok: false, message: "Unknown or missing action" }, { status: 400 });
  }

  const result = await runDrBrainMaintenanceAction({ action, actorId: admin.id });
  return NextResponse.json(result);
}
