import { requireAdminSession } from "@/lib/admin/require-admin";
import type { MarketingContentStore } from "@/modules/marketing-content/content-calendar-storage";
import { replaceServerMarketingContentStore } from "@/modules/marketing-content/content-calendar-server-store";

export const dynamic = "force-dynamic";

/** POST — push browser calendar store to server memory for mobile/API reads (same deployment). */
export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!body || typeof body.items !== "object") {
      return Response.json({ error: "invalid_payload_structure" }, { status: 400 });
    }

    // Input validation & sanitization
    const sanitizedStore: MarketingContentStore = {
      items: {},
      notifications: Array.isArray(body.notifications) ? body.notifications : [],
    };

    // Only copy valid items
    for (const [id, item] of Object.entries(body.items || {})) {
      if (item && typeof item === "object" && (item as any).id) {
        sanitizedStore.items[id] = item as any;
      }
    }

    replaceServerMarketingContentStore(sanitizedStore);
    return Response.json({ ok: true });
  } catch (e: unknown) {
    console.error("[Marketing Sync Error]", e);
    return Response.json(
      { error: "internal_server_error", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
