import { NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Assistant-only contract draft scaffold. Does not call an LLM yet — returns the structured prompt
 * for review by a licensed broker (OACIQ context in prompt text).
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const role = await getUserRole();
  if (role !== "BROKER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Broker access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const listingId = typeof o.listingId === "string" ? o.listingId.trim() : "";
  const brokerInput = typeof o.brokerInput === "string" ? o.brokerInput.trim() : "";

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  // ⚠️ Replace with real DB + declaration + clause engine reads keyed by listingId
  const listing = {
    id: listingId,
    price: 750000,
    address: "123 Example St",
    seller_name: "John Doe",
  };

  const sellerDeclaration = {
    known_defects: "None declared",
  };

  const clauses = ["Inspection clause within 7 days", "Financing condition 10 days"];

  const prompt = `
You are assisting a licensed real estate broker.

Generate a contract draft using:

Listing:
${JSON.stringify(listing, null, 2)}

Seller Declaration:
${JSON.stringify(sellerDeclaration, null, 2)}

Clauses:
${clauses.join("\n")}

Broker Notes:
${brokerInput || "(none)"}

Rules:
- Must follow OACIQ structure
- Must include clear clauses (actor, deadline, consequence)
- Must NOT finalize legal responsibility
- Output is a draft only; the broker remains responsible for accuracy and execution
`.trim();

  return NextResponse.json({ draft: prompt });
}
