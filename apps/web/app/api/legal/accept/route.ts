import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { recordAcceptance } from "@/lib/legal/acceptance";
import { getActiveDocument } from "@/lib/legal/documents";

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json();
    const { documentTypes } = body as {
      documentTypes?: { documentType: string; version: string }[];
    };

    if (!Array.isArray(documentTypes) || documentTypes.length === 0) {
      return Response.json(
        { error: "documentTypes array required" },
        { status: 400 }
      );
    }

    for (const { documentType, version } of documentTypes) {
      if (!documentType || !version) continue;
      const active = await getActiveDocument(documentType);
      if (active && active.version !== version) {
        return Response.json(
          { error: `Version mismatch for ${documentType}; please refresh and accept again` },
          { status: 400 }
        );
      }
      await recordAcceptance(userId, documentType, version);
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.warn("[legal] accept failed:", e);
    return Response.json(
      { error: "Failed to record acceptance" },
      { status: 500 }
    );
  }
}
