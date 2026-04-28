"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MAX_LISTING_IMAGES, processListingImageFiles } from "@/lib/syria/photo-upload";
import { formatSyriaCurrency } from "@/lib/format";
import { SYRIA_PRICING } from "@/lib/pricing";
import { ListingShareActions } from "@/components/listing/ListingShareActions";
import { ListingPostSuccessNudge } from "@/components/listing/ListingPostSuccessNudge";

export function HotelOnboardForm() {
  const t = useTranslations("SybnbHotelOnboard");
  const tPhoto = useTranslations("SybnbPhotoSafety");
  const tQ = useTranslations("QuickPost");
  const tList = useTranslations("Listing");
  const locale = useLocale();
  const isAr = locale.startsWith("ar");

  const [hotelName, setHotelName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [parsingImages, setParsingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [shareMeta, setShareMeta] = useState<{
    title: string;
    city: string;
    pricePerNight: number;
  } | null>(null);

  async function onPickPhotos(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_LISTING_IMAGES - imageUrls.length;
    if (remaining <= 0) return;
    const arr = Array.from(files);
    let batch = arr;
    if (arr.length > remaining) {
      setError(tQ("photoRejectExtra", { max: MAX_LISTING_IMAGES }));
      batch = arr.slice(0, remaining);
    } else {
      setError(null);
    }
    setParsingImages(true);
    try {
      const toAdd = await processListingImageFiles(batch, remaining);
      setImageUrls((prev) => [...prev, ...toAdd].slice(0, MAX_LISTING_IMAGES));
    } catch {
      setError(t("errorServer"));
    } finally {
      setParsingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hotelName.trim() || !city.trim() || !phone.trim()) {
      setError(t("errorRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sybnb/hotel-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName: hotelName.trim(),
          city: city.trim(),
          phone: phone.trim(),
          ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        listingId?: string;
        pricePerNight?: number;
        error?: string;
      };

      if (res.status === 409 && data.error === "duplicate") {
        setError(t("errorDuplicate"));
        return;
      }
      if (res.status === 429 && data.error === "daily_limit") {
        setError(t("errorDailyLimit"));
        return;
      }
      if (!res.ok || !data.ok || typeof data.listingId !== "string") {
        setError(t("errorServer"));
        return;
      }

      const nightly = typeof data.pricePerNight === "number" && Number.isFinite(data.pricePerNight) ? data.pricePerNight : 0;
      setCreatedId(data.listingId);
      setShareMeta({
        title: hotelName.trim(),
        city: city.trim(),
        pricePerNight: nightly,
      });
      setSuccess(true);
      setHotelName("");
      setCity("");
      setPhone("");
      setImageUrls([]);
    } catch {
      setError(t("errorServer"));
    } finally {
      setSubmitting(false);
    }
  }

  if (success && createdId) {
    return (
      <div className="rounded-[var(--darlink-radius-2xl)] border border-emerald-200 bg-emerald-50/60 p-6 text-center shadow-[var(--darlink-shadow-sm)]">
        <p className="font-semibold text-emerald-950">{t("successTitle")}</p>
        <p className="mt-2 text-sm text-emerald-900/90">{t("successBody")}</p>
        <Link
          href={`/listing/${createdId}?posted=1`}
          className="mt-4 inline-flex min-h-11 w-full min-w-0 max-w-sm items-center justify-center rounded-[var(--darlink-radius-xl)] bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 sm:mx-auto"
        >
          {t("viewListing")}
        </Link>
        {shareMeta ? (
          <div className="mt-5 sm:mx-auto sm:max-w-md">
            <ListingPostSuccessNudge>
              <ListingShareActions
                variant="growth"
                whatsappLabel={tList("shareViaWhatsappCta")}
                copyButtonLabel={tList("copyLink")}
                listingId={createdId}
                shareTitle={shareMeta.title}
                sharePriceLine={formatSyriaCurrency(shareMeta.pricePerNight, SYRIA_PRICING.currency, locale)}
                shareCity={shareMeta.city}
                sharePriceAmount={shareMeta.pricePerNight}
              />
            </ListingPostSuccessNudge>
          </div>
        ) : null}
        <button
          type="button"
          className="mt-4 block w-full text-sm text-emerald-800 underline"
          onClick={() => {
            setSuccess(false);
            setCreatedId(null);
            setShareMeta(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          {t("onboardAnother")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="space-y-4 rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)]"
    >
      {error ? (
        <p className="rounded-[var(--darlink-radius-lg)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldHotelName")} <span className="text-red-600">*</span>
        <Input
          required
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          className="mt-1"
          name="hotelName"
          autoComplete="organization"
        />
      </label>

      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldCity")} <span className="text-red-600">*</span>
        <Input
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-1"
          name="city"
          autoComplete="address-level2"
        />
      </label>

      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldPhone")} <span className="text-red-600">*</span>
        <Input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("fieldPhotos")}</p>
        <p className="text-xs text-[color:var(--darlink-text-muted)]">{t("photoLimitHint")}</p>
        <p className="text-xs font-medium text-emerald-800/90 [dir=rtl]:text-right">{tPhoto("photoTipContactBoost")}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-sm text-[color:var(--darlink-text)] file:me-3 file:rounded-[var(--darlink-radius-lg)] file:border-0 file:bg-[color:var(--darlink-surface-muted)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[color:var(--darlink-text)]"
          disabled={parsingImages || imageUrls.length >= MAX_LISTING_IMAGES}
          onChange={(e) => void onPickPhotos(e.target.files)}
        />
        <ul className="list-inside list-disc space-y-0.5 text-xs text-[color:var(--darlink-text-muted)]" dir={isAr ? "rtl" : "ltr"}>
          <li>{t("photoTipMain")}</li>
          <li>{t("photoTipDaylight")}</li>
        </ul>
        {imageUrls.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={`ho-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)]">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute end-0.5 top-0.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white md:opacity-0 md:transition md:group-hover:opacity-100"
                  onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                >
                  {t("removePhoto")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Button type="submit" className="w-full min-h-11" disabled={submitting || parsingImages}>
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
