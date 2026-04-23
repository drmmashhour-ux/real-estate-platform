import { requireAdminSession } from "@/lib/admin/require-admin";
import type { MarketingContentStore } from "@/modules/marketing-content/content-calendar-storage";
import { replaceServerMarketingContentStore } from "@/modules/marketing-content/content-calendar-server-store";

export const dynamic = "force-dynamic";

/** POST — push browser calendar store to server memory for mobile/API reads (same deployment). */
export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as MarketingContentStore;
    if (!body || typeof body.items !== "object") {
      return Response.json({ error: "invalid_payload" }, { status: 400 });
    }
    replaceServerMarketingContentStore({
      items: body.items,
      notifications: Array.isArray(body.notifications) ? body.notifications : [],
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
}
