import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { logError } from "@/lib/logger";
import {
  isPartyIdDocumentUrlTrusted,
  resolveFsboDocFetchUrl,
  verifyPartyIdAgainstForm,
} from "@/lib/fsbo/verify-party-id-ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  partyId: z.string().min(1).max(120),
  idDocumentUrl: z.string().min(1).max(2048),
  idType: z.enum(["PASSPORT", "DRIVERS_LICENSE", "NATIONAL_ID", "OTHER"]),
  idNumber: z.string().max(120),
  fullName: z.string().max(200),
  dateOfBirth: z.string().max(32),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: listingId } = await ctx.params;
    const listing = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true, status: true },
    });

    if (!listing || listing.ownerId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (listing.status === "SOLD" || listing.status === "PENDING_VERIFICATION") {
      return NextResponse.json({ error: "Listing cannot be edited" }, { status: 409 });
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { partyId, idDocumentUrl, idType, idNumber, fullName, dateOfBirth } = parsed.data;

    if (!isPartyIdDocumentUrlTrusted(idDocumentUrl, listingId)) {
      return NextResponse.json({ error: "Invalid document URL" }, { status: 400 });
    }

    const checkedAt = new Date().toISOString();

    let buf: Buffer;
    let contentType: string;
    try {
      const fetchUrl = resolveFsboDocFetchUrl(idDocumentUrl);
      const docRes = await fetch(fetchUrl, { redirect: "follow" });
      if (!docRes.ok) {
        return NextResponse.json({
          partyId,
          idAiCheck: {
            checkedAt,
            status: "inconclusive" as const,
            message:
              "We couldn’t load this file from storage. Try uploading your ID photo again (clear JPG or PNG of your document).",
          },
        });
      }
      contentType = docRes.headers.get("content-type") || "application/octet-stream";
      buf = Buffer.from(await docRes.arrayBuffer());
    } catch (e) {
      logError("[party-id-ai-verify] fetch document", e);
      return NextResponse.json({
        partyId,
        idAiCheck: {
          checkedAt,
          status: "inconclusive" as const,
          message:
            "We couldn’t read your upload. Please upload a clear photo of your government-issued ID—not unrelated images.",
        },
      });
    }

    const result = await verifyPartyIdAgainstForm({
      buffer: buf,
      contentType,
      idType,
      idNumber: idNumber.trim(),
      fullName: fullName.trim(),
      dateOfBirth: dateOfBirth.trim(),
    });

    return NextResponse.json({
      partyId,
      idAiCheck: {
        checkedAt,
        status: result.status,
        message: result.message,
      },
    });
  } catch (e) {
    logError("[party-id-ai-verify] POST", e);
    return NextResponse.json(
      {
        error: "Something went wrong. Please try again, or confirm your ID details manually below.",
      },
      { status: 500 },
    );
  }
}
