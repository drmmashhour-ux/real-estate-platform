import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { updateShareLocation } from "@/lib/share-my-stay/update-location";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  let body: { lat?: unknown; lng?: unknown; accuracyMeters?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lat = typeof body.lat === "number" ? body.lat : Number(body.lat);
  const lng = typeof body.lng === "number" ? body.lng : Number(body.lng);
  const accuracyMeters =
    body.accuracyMeters != null
      ? typeof body.accuracyMeters === "number"
        ? body.accuracyMeters
        : Number(body.accuracyMeters)
      : null;

  const result = await updateShareLocation({
    sessionId: id,
    guestUserId: userId,
    lat,
    lng,
    accuracyMeters,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
