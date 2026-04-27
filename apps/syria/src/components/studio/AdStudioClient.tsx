"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AdPreview } from "@/components/studio/AdPreview";
import {
  AD_STUDIO_STYLES,
  isAdStudioStyle,
  type AdStudioStyle,
  type AdStudioPreviewListing,
} from "@/lib/ad-studio";
import { buildWhatsAppMeShareHref, getListingPath } from "@/lib/syria/listing-share";
import { Button } from "@/components/ui/Button";

function firstImage(images: string[]): string | null {
  const u = images.find((x) => typeof x === "string" && x.length > 0);
  return u ?? null;
}

function isValidAdStyle(s: string | null | undefined): s is AdStudioStyle {
  return s != null && (AD_STUDIO_STYLES as readonly string[]).includes(s);
}

export function AdStudioClient({
  listingId,
  initialAdStyle,
  title,
  priceLine,
  city,
  images,
}: {
  listingId: string;
  initialAdStyle: string | null;
  title: string;
  priceLine: string;
  city: string;
  images: string[];
}) {
  const t = useTranslations("AdStudio");
  const locale = useLocale();
  const initial: AdStudioStyle = useMemo(() => {
    return isAdStudioStyle(initialAdStyle) ? initialAdStyle : "clean";
  }, [initialAdStyle]);
  const [style, setStyle] = useState<AdStudioStyle>(initial);
  const [saved, setSaved] = useState<AdStudioStyle | null>(() => (isAdStudioStyle(initialAdStyle) ? initialAdStyle : null));
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const img = firstImage(images);

  const listing: AdStudioPreviewListing = useMemo(
    () => ({ image: img, title, price: priceLine, city }),
    [img, title, priceLine, city],
  );

  const listingUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URL(getListingPath(locale, listingId), window.location.origin).href;
  }, [locale, listingId]);

  function pickTemplate(s: AdStudioStyle) {
    setStyle(s);
    setJustSaved(false);
  }

  async function onSave() {
    setErr(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/ad-style`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adStyle: style }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErr(t("errorSave"));
        return;
      }
      setSaved(style);
      setJustSaved(true);
    } catch {
      setErr(t("errorSave"));
    } finally {
      setSaving(false);
    }
  }

  function onShare() {
    const styleKey = (saved && saved === style ? saved : style) as AdStudioStyle;
    const text = [t("shareLine", { style: t(`template_${styleKey}`) }), title, listingUrl].join("\n");
    const href = buildWhatsAppMeShareHref(text);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4 [dir: inherit] sm:space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[color:var(--darlink-text)] sm:text-2xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">{t("subtitle")}</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[color:var(--darlink-text)]">{t("preview")}</p>
        <div className="flex justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 sm:p-6">
          <AdPreview listing={listing} style={style} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[color:var(--darlink-text)]">{t("pickTemplate")}</p>
        <div className="flex flex-wrap gap-2">
          {AD_STUDIO_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickTemplate(s)}
              className={`min-h-11 min-w-[4.5rem] rounded-lg border-2 px-3 py-2 text-sm font-semibold transition ${
                style === s
                  ? "border-[color:var(--darlink-accent)] bg-[color:var(--darlink-surface-muted)]"
                  : "border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]"
              }`}
            >
              {t(`template_${s}`)}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        className="h-12 w-full rounded-lg text-base font-semibold"
        disabled={saving}
        onClick={() => void onSave()}
      >
        {saving ? t("saving") : t("save")}
      </Button>

      {justSaved ? (
        <div className="rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/90 p-4 text-center shadow-sm">
          <p className="text-lg font-bold text-emerald-900">{t("saveSuccessTitle")}</p>
          <p className="mt-1 text-sm font-medium text-emerald-800/90">{t("saveSuccessSubtitle")}</p>
          <button
            type="button"
            className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#25D366] text-base font-bold text-white shadow-sm hover:bg-[#20bd5a]"
            disabled={!listingUrl}
            onClick={onShare}
          >
            {t("shareWhatsapp")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            className="h-12 w-full min-w-[200px] border-2 border-[#25D366] bg-[#25D366] text-white hover:bg-[#20bd5a] sm:w-auto"
            disabled={!listingUrl}
            onClick={onShare}
          >
            {t("shareWhatsapp")}
          </Button>
        </div>
      )}

      {saved != null && !justSaved ? <p className="text-sm text-emerald-800">{t("savedHint", { style: t(`template_${saved}`) })}</p> : null}
      {err ? <p className="text-sm text-red-700">{err}</p> : null}

      <Link
        href={`/listing/${listingId}`}
        className="block text-center text-sm font-medium text-[color:var(--darlink-accent)] underline sm:text-start"
      >
        {t("backToListing")}
      </Link>
    </div>
  );
}
