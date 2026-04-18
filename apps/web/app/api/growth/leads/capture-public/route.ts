import { NextResponse } from "next/server";
import { handlePublicLandingCaptureJson } from "../shared-public-capture";

export const dynamic = "force-dynamic";

/** Same as POST /api/growth/leads/capture with `publicAcquisition: true` (marker added if omitted). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const merged =
    typeof body === "object" && body !== null && !("publicAcquisition" in body)
      ? { ...(body as Record<string, unknown>), publicAcquisition: true as const }
      : body;
  return handlePublicLandingCaptureJson(merged, req);
}
