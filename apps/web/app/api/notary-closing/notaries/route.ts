import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listNotaries, createNotary } from "@/lib/notary-closing";

/**
 * GET /api/notary-closing/notaries
 * Query: jurisdiction (optional)
 *
 * POST /api/notary-closing/notaries
 * Body: { notaryName, notaryEmail, notaryOffice?, jurisdiction? }
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const { searchParams } = new URL(request.url);
    const jurisdiction = searchParams.get("jurisdiction") ?? undefined;
    const notaries = await listNotaries({ jurisdiction });
    return Response.json({ notaries });
  } catch (e) {
    return Response.json({ error: "Failed to list notaries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { notaryName, notaryEmail, notaryOffice, jurisdiction } = body;
    if (!notaryName || !notaryEmail) {
      return Response.json({ error: "notaryName and notaryEmail required" }, { status: 400 });
    }

    const notary = await createNotary({
      notaryName,
      notaryEmail,
      notaryOffice: notaryOffice ?? null,
      jurisdiction: jurisdiction ?? null,
    });
    return Response.json(notary);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create notary";
    return Response.json({ error: message }, { status: 400 });
  }
}
