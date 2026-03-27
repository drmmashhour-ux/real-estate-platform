import { NextResponse } from "next/server";
import { correctText } from "@/lib/spell/correct";
import type { SpellLocale } from "@/lib/spell/dictionary";
import { getMergedSpellAllowWords, getSpellAllowWordsForLocale } from "@/lib/spell/allow-words";

const MAX_LEN = 50_000;

type Body = {
  text?: unknown;
  locale?: unknown;
};

function parseLocale(v: unknown): SpellLocale | undefined {
  if (v === "en" || v === "fr") return v;
  return undefined;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text : "";
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: "Text too long" }, { status: 413 });
  }
  const localeHint = parseLocale(body.locale);
  const allowWords = localeHint
    ? await getSpellAllowWordsForLocale(localeHint)
    : await getMergedSpellAllowWords();
  const corrected = correctText(text, { locale: localeHint, allowWords });
  return NextResponse.json({ text: corrected });
}
