"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ListingAssistResult } from "@/lib/listing-assistant.service";

function copyText(text: string) {
  void navigator.clipboard.writeText(text).catch(() => window.alert("Copy failed"));
}

export function ListingAssistantClient() {
  const t = useTranslations("Admin");
  const [rawText, setRawText] = useState("");
  const [extraImages, setExtraImages] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ListingAssistResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const parse = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/listing-assistant/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          rawText,
          extraImageLines: extraImages,
          facebookUrl: facebookUrl.trim() || undefined,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; result?: ListingAssistResult; error?: string };
      if (!res.ok || !j.ok || !j.result) {
        throw new Error(j.error ?? "parse_failed");
      }
      setResult(j.result);
    } catch {
      setErr(t("listingAssistantErr"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const bundleCopy =
    result &&
    [
      `title_ar: ${result.titleArSuggestion}`,
      `description_ar: ${result.descriptionCleanAr}`,
      result.price ? `price: ${result.price}` : "",
      `type: ${result.listingType}`,
      result.governorateEn ? `governorate: ${result.governorateEn}` : "",
      result.cityEn ? `city: ${result.cityEn}` : "",
      result.areaAr ? `area: ${result.areaAr}` : "",
      result.imageUrls.length ? `images:\n${result.imageUrls.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{t("listingAssistantTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{t("listingAssistantIntro")}</p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t("listingAssistantLegal")}
        </p>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("listingAssistantDailyTitle")}</h2>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">
          {t("listingAssistantDailyBody")}
        </pre>
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-stone-800">
          {t("listingAssistantRawLabel")}
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={12}
            className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-sm outline-none focus:border-stone-400"
            placeholder={t("listingAssistantRawPlaceholder")}
          />
        </label>

        <label className="block text-sm font-medium text-stone-800">
          {t("listingAssistantImagesLabel")}
          <textarea
            value={extraImages}
            onChange={(e) => setExtraImages(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-xs outline-none focus:border-stone-400"
            placeholder="https://…"
          />
        </label>

        <label className="block text-sm font-medium text-stone-800">
          {t("listingAssistantFbLabel")}
          <span className="mt-1 block text-xs font-normal text-stone-500">{t("listingAssistantFbHint")}</span>
          <input
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            type="url"
            className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
            placeholder="https://www.facebook.com/..."
          />
        </label>

        <button
          type="button"
          disabled={loading || !rawText.trim()}
          onClick={() => void parse()}
          className="rounded-xl bg-[color:var(--color-syria-olive)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t("listingAssistantParsing") : t("listingAssistantParse")}
        </button>

        {err ? <p className="text-sm text-red-600">{err}</p> : null}
      </section>

      {result ? (
        <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">{t("listingAssistantOutputTitle")}</h2>

          {result.facebookUrlNote ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {result.facebookUrlNote}
            </p>
          ) : null}

          <ul className="list-inside list-disc text-sm text-stone-700">
            {result.confidenceNotes.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("listingAssistantFieldTitle")} value={result.titleArSuggestion} />
            <Field label={t("listingAssistantFieldPrice")} value={result.price ?? "—"} />
            <Field label={t("listingAssistantFieldType")} value={result.listingType} />
            <Field
              label={t("listingAssistantFieldLocation")}
              value={[result.governorateEn, result.cityEn, result.areaAr].filter(Boolean).join(" · ") || "—"}
            />
          </div>

          <label className="block text-sm font-medium text-stone-800">
            {t("listingAssistantFieldDescription")}
            <textarea
              readOnly
              value={result.descriptionCleanAr}
              rows={8}
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          {result.imageUrls.length > 0 ? (
            <label className="block text-sm font-medium text-stone-800">
              {t("listingAssistantFieldImages")}
              <textarea
                readOnly
                value={result.imageUrls.join("\n")}
                rows={4}
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
              onClick={() => result && copyText(result.titleArSuggestion)}
            >
              {t("listingAssistantCopyTitle")}
            </button>
            <button
              type="button"
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
              onClick={() => result && copyText(result.descriptionCleanAr)}
            >
              {t("listingAssistantCopyDescription")}
            </button>
            <button
              type="button"
              className="rounded-lg border border-emerald-600 bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
              onClick={() => bundleCopy && copyText(bundleCopy)}
            >
              {t("listingAssistantCopyBundle")}
            </button>
            <Link
              href="/sell"
              className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              {t("listingAssistantGoSell")}
            </Link>
          </div>

          <p className="text-xs text-stone-500">{t("listingAssistantMapHint")}</p>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-sm text-stone-900">{value}</p>
      <button
        type="button"
        className="mt-1 text-xs font-semibold text-emerald-700 hover:underline"
        onClick={() => copyText(value)}
      >
        Copy
      </button>
    </div>
  );
}
