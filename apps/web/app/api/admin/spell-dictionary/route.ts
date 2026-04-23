import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminResponse } from "@/lib/admin/assert-admin";
import { prisma } from "@repo/db";
import { SPELL_DICTIONARY_CACHE_TAG } from "@/lib/spell/allow-words";

type LocaleCell = "en" | "fr" | "both";
type KindCell = "allow" | "ignore";

function normLocale(v: unknown): LocaleCell | null {
  if (v === "en" || v === "fr" || v === "both") return v;
  return null;
}

function normKind(v: unknown): KindCell {
  return v === "ignore" ? "ignore" : "allow";
}

export async function GET() {
  const err = await assertAdminResponse();
  if (err) return err;
  const rows = await prisma.spellDictionaryEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ entries: rows });
}

export async function POST(req: Request) {
  const err = await assertAdminResponse();
  if (err) return err;
  let body: { word?: unknown; locale?: unknown; kind?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = typeof body.word === "string" ? body.word.trim() : "";
  if (!raw || raw.length > 120) {
    return NextResponse.json({ error: "Invalid word" }, { status: 400 });
  }
  const word = raw.toLowerCase();
  const locale = normLocale(body.locale);
  if (!locale) {
    return NextResponse.json({ error: "locale must be en, fr, or both" }, { status: 400 });
  }
  const kind = normKind(body.kind);

  try {
    const row = await prisma.spellDictionaryEntry.upsert({
      where: {
        word_locale_kind: { word, locale, kind },
      },
      create: { word, locale, kind },
      update: {},
    });
    revalidateTag(SPELL_DICTIONARY_CACHE_TAG, "default");
    return NextResponse.json({ entry: row });
  } catch {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const err = await assertAdminResponse();
  if (err) return err;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.spellDictionaryEntry.deleteMany({ where: { id } });
  revalidateTag(SPELL_DICTIONARY_CACHE_TAG, "default");
  return NextResponse.json({ ok: true });
}
