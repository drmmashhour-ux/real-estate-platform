import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { LEGAL_FORM_KEYS, type LegalFormKey } from "@/modules/legal/legal-engine";
import { upsertLegalFormSignature } from "@/modules/legal/legal-signatures";
import { LEGAL_FORM_VERSION } from "@/modules/legal/form-versions";

export const dynamic = "force-dynamic";

const ALLOWED: Set<string> = new Set(Object.values(LEGAL_FORM_KEYS));

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { formKey?: unknown; contextType?: unknown; contextId?: unknown; version?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const formKey = typeof body.formKey === "string" ? body.formKey.trim() : "";
  if (!formKey || !ALLOWED.has(formKey)) {
    return NextResponse.json({ error: "Invalid formKey" }, { status: 400 });
  }

  const contextType = typeof body.contextType === "string" ? body.contextType.trim().slice(0, 120) : "";
  if (!contextType) {
    return NextResponse.json({ error: "contextType required" }, { status: 400 });
  }

  const contextId =
    typeof body.contextId === "string" ? body.contextId.trim().slice(0, 128) : "";
  const version = typeof body.version === "string" ? body.version.trim().slice(0, 40) : LEGAL_FORM_VERSION;

  await upsertLegalFormSignature({
    userId,
    formKey: formKey as LegalFormKey,
    contextType,
    contextId,
    version,
  });

  return NextResponse.json({ ok: true, version });
}
