import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { parseListingAssistInput } from "@/lib/listing-assistant.service";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  assertDarlinkRuntimeEnv();
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const rawText = typeof raw.rawText === "string" ? raw.rawText : "";
  const extraImageLines = typeof raw.extraImageLines === "string" ? raw.extraImageLines : "";
  const facebookUrl =
    typeof raw.facebookUrl === "string" && raw.facebookUrl.trim() ? raw.facebookUrl.trim() : null;

  const result = parseListingAssistInput({
    rawText,
    extraImageLines,
    facebookUrl,
  });

  return NextResponse.json({ ok: true, result });
}
