import sharp from "sharp";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { geocodeAddressLine } from "@/lib/geo/geocode-nominatim";

export const dynamic = "force-dynamic";

const PHOTO_MISMATCH_RISK_TYPE = "FSBO_PHOTO_MISMATCH";

async function avgRgbFromBuffer(buf: Buffer): Promise<{ r: number; g: number; b: number } | null> {
  try {
    const { data, info } = await sharp(buf)
      .resize(32, 32, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const channels = info.channels ?? 3;
    if (!data || !Number.isFinite(channels) || channels < 3) return null;
    let r = 0;
    let g = 0;
    let b = 0;
    const pixels = Math.floor(data.length / channels);
    for (let i = 0; i < data.length; i += channels) {
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
    }
    return { r: r / pixels, g: g / pixels, b: b / pixels };
  } catch {
    return null;
  }
}

function rgbDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * POST /api/fsbo/listings/:id/verify-photo-match
 * Computes a basic color-similarity check between:
 * - user's tagged Exterior photo (external URL)
 * - Google Street View image at the listing address (approx)
 *
 * Not a legal/forensic verification; informational heuristic.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: {
      ownerId: true,
      address: true,
      city: true,
      latitude: true,
      longitude: true,
      photoVerificationStatus: true,
      photoTagsJson: true,
      images: true,
    },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const exteriorPhotoUrl =
    typeof (body as any)?.exteriorPhotoUrl === "string" ? ((body as any).exteriorPhotoUrl as string) : listing.images?.[0];
  const address = typeof (body as any)?.address === "string" ? ((body as any).address as string) : listing.address;
  const city = typeof (body as any)?.city === "string" ? ((body as any).city as string) : listing.city;

  if (!exteriorPhotoUrl) {
    return Response.json({ ok: false, streetViewUrl: null, mismatchDetected: false, photoVerificationStatus: "PENDING" }, { status: 400 });
  }
  if (!address?.trim() || !city?.trim()) {
    return Response.json({ ok: false, streetViewUrl: null, mismatchDetected: false, photoVerificationStatus: "PENDING", message: "Missing address." }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({
      ok: true,
      streetViewUrl: null,
      mismatchDetected: false,
      similarityScore: null,
      photoVerificationStatus: "PENDING",
      message: "Street view verification not configured (missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).",
    });
  }

  let lat = listing.latitude;
  let lng = listing.longitude;
  if (!lat || !lng) {
    const coords = await geocodeAddressLine(`${address}, ${city}`);
    if (!coords) {
      return Response.json({
        ok: true,
        streetViewUrl: null,
        mismatchDetected: false,
        similarityScore: null,
        photoVerificationStatus: "PENDING",
        message: "Could not geocode the address for Street View.",
      });
    }
    lat = coords.latitude;
    lng = coords.longitude;
  }

  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${lat},${lng}&key=${apiKey}`;

  try {
    const [extRes, svRes] = await Promise.all([fetch(exteriorPhotoUrl), fetch(streetViewUrl)]);
    if (!extRes.ok || !svRes.ok) {
      return Response.json({
        ok: true,
        streetViewUrl,
        mismatchDetected: false,
        similarityScore: null,
        photoVerificationStatus: "PENDING",
        message: "Could not fetch images for verification.",
      });
    }
    const [extBuf, svBuf] = await Promise.all([Buffer.from(await extRes.arrayBuffer()), Buffer.from(await svRes.arrayBuffer())]);

    const extAvg = await avgRgbFromBuffer(extBuf);
    const svAvg = await avgRgbFromBuffer(svBuf);
    if (!extAvg || !svAvg) {
      return Response.json({
        ok: true,
        streetViewUrl,
        mismatchDetected: false,
        similarityScore: null,
        photoVerificationStatus: "PENDING",
        message: "Could not analyze images for verification.",
      });
    }

    const dist = rgbDistance(extAvg, svAvg);
    // Heuristic threshold: larger distance => less likely to match.
    const mismatchDetected = dist > 120;
    const similarityScore = Math.max(0, Math.min(1, 1 - dist / 300));

    const nextStatus = mismatchDetected ? "FLAGGED" : "VERIFIED";

    await prisma.fsboListing.update({
      where: { id },
      data: { photoVerificationStatus: nextStatus },
    });

    await prisma.riskAlert.deleteMany({
      where: { fsboListingId: id, riskType: PHOTO_MISMATCH_RISK_TYPE },
    });

    if (mismatchDetected) {
      await prisma.riskAlert.create({
        data: {
          userId,
          fsboListingId: id,
          riskType: PHOTO_MISMATCH_RISK_TYPE,
          message: "Exterior photo may not match the property address (Street View heuristic). Please review uploaded photos and address details.",
          severity: "HIGH",
        },
      });
    }

    return Response.json({
      ok: true,
      streetViewUrl,
      mismatchDetected,
      similarityScore,
      photoVerificationStatus: nextStatus,
    });
  } catch (e) {
    return Response.json({
      ok: true,
      streetViewUrl,
      mismatchDetected: false,
      similarityScore: null,
      photoVerificationStatus: "PENDING",
      message: e instanceof Error ? e.message : "Verification failed",
    });
  }
}

