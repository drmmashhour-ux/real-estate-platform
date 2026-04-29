import { randomUUID } from "node:crypto";

import { queryWithRetry } from "@/lib/db/db-safe";

export const dynamic = "force-dynamic";

type Body =
  | {
      kind?: "error";
      eventName?: string;
      data?: Record<string, unknown>;
      context?: Record<string, unknown>;
      /** Error ingestion */
      errorType?: string;
      message?: string;
      userId?: string | null;
      route?: string;
      metadata?: Record<string, unknown>;
    }
  | Record<string, unknown>;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  try {
    const kind = typeof (body as { kind?: unknown }).kind === "string" ? (body as { kind: string }).kind : "";
    const isError = kind === "error" || typeof (body as { errorType?: unknown }).errorType === "string";

    const id = randomUUID();
    let event: string;
    let dataPayload: Record<string, unknown>;

    if (isError) {
      const b = body as {
        errorType?: string;
        message?: string;
        userId?: string | null;
        route?: string;
        metadata?: Record<string, unknown>;
      };
      const et =
        typeof b.errorType === "string" && b.errorType.trim() ? b.errorType.trim().slice(0, 80) : "unknown";
      event = `error:${et}`.slice(0, 128);
      dataPayload = {
        message: b.message ?? null,
        userId: b.userId ?? null,
        route: b.route ?? null,
        metadata: b.metadata ?? {},
      };
    } else {
      const b = body as { eventName?: string; data?: Record<string, unknown>; context?: Record<string, unknown> };
      event =
        typeof b.eventName === "string" && b.eventName.trim()
          ? b.eventName.trim().slice(0, 128)
          : "unnamed_event";
      const merged: Record<string, unknown> =
        b.data && typeof b.data === "object" && !Array.isArray(b.data) ? { ...b.data } : {};
      if (b.context && typeof b.context === "object" && !Array.isArray(b.context)) {
        merged._analyticsContext = b.context;
      }
      dataPayload = merged;
    }

    try {
      await queryWithRetry(
        `
      INSERT INTO "marketplace_events" ("id", "event", "data", "created_at")
      VALUES ($1::text, $2::varchar(128), $3::jsonb, NOW())
    `,
        [id, event, JSON.stringify(dataPayload)]
      );
    } catch (persistErr) {
      console.error("track-event failed", persistErr);
      return Response.json({ ok: false }, { status: 200 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("track-event failed", err);
    return Response.json({ ok: false }, { status: 200 });
  }
}
