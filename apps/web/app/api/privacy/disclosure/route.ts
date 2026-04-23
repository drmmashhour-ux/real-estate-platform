import { NextResponse } from "next/server";
import { PrivacyDisclosureService } from "@/modules/privacy/services/privacy-disclosure.service";
import { getGuestId } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId, recipient, purpose, redact } = await req.json();

    if (!documentId || !recipient || !purpose) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await PrivacyDisclosureService.discloseDocument({
      documentId,
      recipient,
      purpose,
      actorUserId: userId,
      redact: !!redact,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Disclosure error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
