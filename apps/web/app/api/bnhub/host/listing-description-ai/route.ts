import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { geminiGenerateText, isGeminiConfigured } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

type Body = {
  title?: string;
  city?: string;
  country?: string;
  address?: string;
  nightPriceCents?: number;
  maxGuests?: number;
  beds?: number;
  baths?: number;
  tone?: "warm" | "professional" | "luxury";
};

/**
 * Host-signed-in: Gemini-assisted listing description draft for BNHUB quick-add / editor flows.
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  if (!title || !city) {
    return Response.json({ error: "title and city are required" }, { status: 400 });
  }

  if (!isGeminiConfigured()) {
    return Response.json(
      {
        error: "AI drafting is not configured (set GEMINI_API_KEY on the server).",
        configured: false,
      },
      { status: 503 }
    );
  }

  const country = typeof body.country === "string" ? body.country.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const tone = body.tone === "professional" || body.tone === "luxury" ? body.tone : "warm";
  const night = typeof body.nightPriceCents === "number" && body.nightPriceCents > 0
    ? `$${(body.nightPriceCents / 100).toFixed(0)}`
    : null;
  const guests =
    typeof body.maxGuests === "number" && body.maxGuests > 0 ? String(body.maxGuests) : null;
  const beds = typeof body.beds === "number" ? String(body.beds) : null;
  const baths = typeof body.baths === "number" ? String(body.baths) : null;

  const facts = [
    `Property title: ${title}`,
    `City: ${city}`,
    country ? `Country/region: ${country}` : null,
    address ? `Address hint: ${address}` : null,
    night ? `Nightly rate (for context only, do not guarantee price): ${night}` : null,
    guests ? `Sleeps up to: ${guests} guests` : null,
    beds ? `Beds: ${beds}` : null,
    baths ? `Baths: ${baths}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `Write a short-term rental listing description for a BNHUB host.

Facts:
${facts}

Requirements:
- Tone: ${tone}.
- 2–4 short paragraphs, plain text, no markdown headings.
- Highlight space, neighborhood vibe, and who it is ideal for.
- Do not invent amenities not implied by the facts; you may mention "contact host" for specifics.
- End with one line inviting guests to book.
- Avoid discriminatory language; be welcoming to all lawful guests.`;

  const result = await geminiGenerateText(userPrompt, {
    system:
      "You write concise, accurate vacation rental copy for a regulated marketplace. Never fabricate square footage, permits, or amenities.",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  return Response.json({ description: result.text, configured: true });
}
