import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import type { ContentItem } from "@/modules/marketing-content/content-calendar.types";
import { getServerMarketingContentStore, replaceServerMarketingContentStore } from "@/modules/marketing-content/content-calendar-server-store";

export const dynamic = "force-dynamic";

/** PATCH quick-edit one item in the server-synced store (same deployment). */
export async function PATCH(request: Request) {
  try {
    const auth = await getMobileAuthUser(request);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (auth.role !== PlatformRole.ADMIN) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!body?.id || typeof body.id !== "string") {
      return Response.json({ error: "missing_id" }, { status: 400 });
    }

    const store = getServerMarketingContentStore();
    const cur = store.items[body.id];
    if (!cur) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const p = body.patch ?? {};
    const perf =
      p.performance !== undefined
        ? { ...cur.performance, ...p.performance }
        : cur.performance;
    const { performance: _x, ...rest } = p;

    // Build next item safely
    const next: ContentItem = {
      ...cur,
      ...rest,
      performance: perf,
      updatedAtIso: new Date().toISOString(),
    };

    store.items[body.id] = next;
    replaceServerMarketingContentStore(store);

    return Response.json({ ok: true, item: next });
  } catch (e: unknown) {
    console.error("[Marketing Patch Error]", e);
    return Response.json(
      { error: "internal_server_error", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
