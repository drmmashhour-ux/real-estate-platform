import { geocodeAddressLine } from "@/lib/geo/geocode-nominatim";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST { street, unit?, city, postalCode?, country?: string }
 * Optional geocoding check (Nominatim). Does not persist. Rate-limit friendly use only.
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { street?: string; unit?: string; city?: string; postalCode?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const street = typeof body.street === "string" ? body.street.trim() : "";
  const unit = typeof body.unit === "string" ? body.unit.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  if (!street || !city) {
    return Response.json({ ok: false, message: "Street and city are required." }, { status: 400 });
  }

  const line = [unit, street, city, body.postalCode].filter(Boolean).join(", ");
  const coords = await geocodeAddressLine(line);

  return Response.json({
    ok: true,
    geocoded: coords !== null,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    message:
      coords === null
        ? "Address could not be verified with the geocoder — double-check civic details."
        : "Address resolved on the map (approximate — not a legal survey).",
  });
}
