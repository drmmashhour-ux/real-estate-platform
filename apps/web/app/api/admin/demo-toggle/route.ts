import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  getLecipmDemoRuntimeEnabled,
  isLecipmDemoEffectiveWithoutRequest,
  setLecipmDemoRuntimeEnabled,
} from "@/src/lib/demo/runtime-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ ok: false, message: admin.error }, { status: admin.status });
  }
  return Response.json({
    ok: true,
    app: "lecipm" as const,
    runtimeEnabled: getLecipmDemoRuntimeEnabled(),
    effective: isLecipmDemoEffectiveWithoutRequest(),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ ok: false, message: admin.error }, { status: admin.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const enabled =
    typeof body === "object" &&
    body !== null &&
    "enabled" in body &&
    typeof (body as { enabled: unknown }).enabled === "boolean"
      ? (body as { enabled: boolean }).enabled
      : null;

  if (enabled === null) {
    return Response.json({ ok: false, message: "Body must include enabled: boolean" }, { status: 400 });
  }

  setLecipmDemoRuntimeEnabled(enabled);
  console.warn("[DEMO MODE]", {
    action: "runtime_toggle",
    app: "lecipm",
    enabled,
    timestamp: new Date().toISOString(),
  });

  return Response.json({
    ok: true,
    app: "lecipm" as const,
    runtimeEnabled: getLecipmDemoRuntimeEnabled(),
    effective: isLecipmDemoEffectiveWithoutRequest(),
  });
}
