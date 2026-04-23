import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getServerMarketingAiStore } from "@/modules/marketing-ai/marketing-ai-server-store";
import { format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

/** GET `/api/mobile/admin/marketing-ai/daily?date=YYYY-MM-DD` — plan slice + queue summary from server-synced store. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("date")?.trim();
  const dayIso =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : format(new Date(), "yyyy-MM-dd");

  const store = getServerMarketingAiStore();
  const plan = store.weeklyPlan;
  const pending = store.queue.filter((q) => q.status === "PENDING_APPROVAL");
  const approved = store.queue.filter((q) => q.status === "APPROVED");

  let daySlots: unknown[] = [];
  if (plan) {
    daySlots = plan.slots.filter((s) => dayIsoForSlot(plan.weekStartIso, s.dayOffset) === dayIso);
  }

  return Response.json({
    date: dayIso,
    autonomyLevel: store.autonomyLevel,
    slotsForDay: daySlots,
    queuePending: pending.slice(0, 30),
    queueApprovedRecent: approved.slice(0, 15),
    alerts: store.alerts.slice(0, 12),
    note:
      store.queue.length === 0 && !plan
        ? "Sync from web Autonomous Marketing Engine after generating a plan."
        : undefined,
  });
}
