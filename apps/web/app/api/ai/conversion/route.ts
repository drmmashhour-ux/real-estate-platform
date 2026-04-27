import { analyzeConversion, type ConversionListingInput } from "@/lib/ai/conversionEngine";
import { logConversionAbExposure } from "@/lib/ai/conversion-track";

export const dynamic = "force-dynamic";

/**
 * POST — server logs `ab_exposure` for `conversion_v1` + assigned `variant` (ties to `subjectId` / `listingId`).
 * Client booking flows should send the same `experiment` + `variant` on `booking_completed` when available.
 */
export async function POST(req: Request) {
  const listing = (await req.json().catch(() => ({}))) as ConversionListingInput & {
    listingId?: string;
  };
  const out = analyzeConversion(listing);
  const scopeId =
    typeof listing.listingId === "string" && listing.listingId.trim()
      ? listing.listingId.trim()
      : typeof listing.subjectId === "string" && listing.subjectId.trim()
        ? listing.subjectId.trim()
        : null;
  void logConversionAbExposure({
    experiment: out.experiment,
    variant: out.variant,
    listingId: scopeId,
  });
  return Response.json(out);
}
