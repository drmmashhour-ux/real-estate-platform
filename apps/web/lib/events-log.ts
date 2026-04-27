import { query } from "@/lib/sql";

/**
 * Best-effort persistence for in-process {@link emit} fan-out — survives until handled by a worker;
 * uses existing `event_logs` analytics table with `event_type` + `metadata` (additive to `metadata` shape).
 */
export async function logEvent(name: string, payload: unknown): Promise<void> {
  const body =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : { data: payload };
  await query(
    `INSERT INTO "event_logs" ("id", "event_type", "metadata", "created_at")
     VALUES (gen_random_uuid()::text, $1, $2::jsonb, NOW())`,
    [name, JSON.stringify({ _inProcessEmit: true, ...body })]
  );
}
