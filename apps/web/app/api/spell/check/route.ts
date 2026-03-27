import { NextResponse } from "next/server";
import { checkText, type SpellError } from "@/lib/spell/check";
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

  const { locale, errors } = checkText(text, { locale: localeHint, allowWords });

  const slim: SpellError[] = errors.map((e) => ({
    word: e.word,
    start: e.start,
    end: e.end,
    suggestions: e.suggestions.slice(0, 8),
  }));

  return NextResponse.json({ locale, errors: slim });
}
