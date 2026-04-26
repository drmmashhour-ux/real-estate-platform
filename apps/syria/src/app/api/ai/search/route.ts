import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { inferSearchFromQuery } from "@/lib/ai/searchAssistant";

export async function POST(req: Request) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const query = typeof o.query === "string" ? o.query : "";
  const defaultLocale = typeof o.locale === "string" ? o.locale : "ar";

  const { filters, explanation } = inferSearchFromQuery(query, { defaultLocale });
  return NextResponse.json({ filters, explanation });
}
