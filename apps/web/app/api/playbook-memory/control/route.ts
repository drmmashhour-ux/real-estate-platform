import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { playbookMemoryControlService } from "@/modules/playbook-memory/services/playbook-memory-control.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" as const }, { status: 401 });
  }
  const userId = (await getGuestId().catch(() => null)) ?? undefined;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" as const });
  }
  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  if (!b || typeof b.action !== "string") {
    return NextResponse.json({ ok: false, error: "action_required" as const });
  }
  const action = b.action;
  const reason = typeof b.reason === "string" ? b.reason : undefined;

  try {
    switch (action) {
      case "pause_playbook": {
        const id = String(b.playbookId ?? "");
        if (!id) return NextResponse.json({ ok: false, error: "playbookId_required" });
        const r = await playbookMemoryControlService.pausePlaybook(id, reason, userId);
        return NextResponse.json({ ok: r.ok, action, result: r, error: r.ok ? undefined : r.error });
      }
      case "resume_playbook": {
        const id = String(b.playbookId ?? "");
        if (!id) return NextResponse.json({ ok: false, error: "playbookId_required" });
        const r = await playbookMemoryControlService.resumePlaybook(id, reason, userId);
        return NextResponse.json({ ok: r.ok, action, result: r, error: r.ok ? undefined : r.error });
      }
      case "promote_playbook_version": {
        const pid = String(b.playbookId ?? "");
        const vid = String(b.playbookVersionId ?? "");
        if (!pid || !vid) {
          return NextResponse.json({ ok: false, error: "playbookId_and_version_required" });
        }
        const r = await playbookMemoryControlService.promotePlaybookVersion(pid, vid, reason, userId);
        return NextResponse.json({ ok: r.ok, action, result: r, error: r.ok ? undefined : r.error });
      }
      case "set_exploration_cap": {
        const scopeType = String(b.scopeType ?? "global");
        const scopeKey = String(b.scopeKey ?? "default");
        const cap = typeof b.cap === "number" && Number.isFinite(b.cap) ? b.cap : Number(b.cap);
        if (!Number.isFinite(cap)) return NextResponse.json({ ok: false, error: "cap_invalid" });
        const r = await playbookMemoryControlService.setExplorationCap({ scopeType, scopeKey, cap, userId, reason });
        return NextResponse.json({ ok: r.ok, action, result: r, error: r.ok ? undefined : r.error });
      }
      case "set_domain_force_mode": {
        const domainKey = String(b.domainKey ?? b.scopeKey ?? "");
        const forceMode = String(b.forceMode ?? b.mode ?? "");
        if (!domainKey || !forceMode) {
          return NextResponse.json({ ok: false, error: "domain_and_mode_required" });
        }
        const r = await playbookMemoryControlService.setDomainForceMode({ domainKey, forceMode, userId, reason });
        return NextResponse.json({ ok: r.ok, action, result: r, error: r.ok ? undefined : r.error });
      }
      case "set_emergency_freeze": {
        const freeze = b.freeze === true || b.freeze === "true" || b.freeze === 1;
        const r = await playbookMemoryControlService.setEmergencyFreeze({ freeze, userId, reason });
        return NextResponse.json({ ok: r.ok, action, result: r, error: r.ok ? undefined : r.error });
      }
      default:
        return NextResponse.json({ ok: false, error: "unknown_action" as const, action });
    }
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "control_failed",
    });
  }
}
