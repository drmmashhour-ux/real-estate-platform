export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight liveness — no DB side effects. */
export async function GET() {
  return Response.json({
    ok: true,
    status: "ok",
    service: "sybnb",
    timestamp: new Date().toISOString(),
  });
}
