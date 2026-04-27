export const dynamic = "force-dynamic";

/** Lightweight liveness — no DB side effects. */
export async function GET() {
  return Response.json({ status: "ok" });
}
