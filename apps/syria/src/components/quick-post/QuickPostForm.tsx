"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SYRIA_STATE_OPTIONS } from "@/lib/syria/states";
import { SYRIA_AMENITIES } from "@/lib/syria/amenities";
import { MAX_LISTING_IMAGES, processListingImageFiles } from "@/lib/syria/photo-upload";
import { formatSyriaCurrency } from "@/lib/format";
import { SYRIA_PRICING } from "@/lib/pricing";
import { ListingShareActions } from "@/components/listing/ListingShareActions";
import { QuickPostAiPanel } from "@/components/quick-post/QuickPostAiPanel";
import { QuickPostAiShareBlock } from "@/components/quick-post/QuickPostAiShareBlock";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_SUBCATEGORIES,
  MARKETPLACE_CATEGORY_EMOJI,
  type MarketplaceCategory,
} from "@/lib/marketplace-categories";

type FormState = {
  title: string;
  description: string;
  state: string;
  city: string;
  area: string;
  addressDetails: string;
  price: string;
  phone: string;
  isDirect: boolean;
};

export function QuickPostForm() {
  const t = useTranslations("QuickPost");
  const locale = useLocale();
  const isAr = locale.startsWith("ar");
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    state: "",
    city: "",
    area: "",
    addressDetails: "",
    price: "",
    phone: "",
    isDirect: true,
  });
  const [shareMeta, setShareMeta] = useState<{ id: string; title: string; city: string; price: string } | null>(null);
  const [amenityKeys, setAmenityKeys] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [parsingImages, setParsingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const tCat = useTranslations("Categories");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [marketCategory, setMarketCategory] = useState<MarketplaceCategory | null>(null);
  const [marketSub, setMarketSub] = useState<string | null>(null);

  async function onPickPhotos(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_LISTING_IMAGES - imageUrls.length;
    if (remaining <= 0) return;
    setParsingImages(true);
    setError(null);
    try {
      const toAdd = await processListingImageFiles(Array.from(files), remaining);
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
    if (!marketCategory || !marketSub) {
      setError(t("errorRequired"));
      return;
    }
    const priceNum = Number(form.price);
    if (!form.title.trim() || !form.state.trim() || !form.city.trim() || !form.phone.trim()) {
      setError(t("errorRequired"));
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError(t("errorPrice"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          state: form.state.trim(),
          city: form.city.trim(),
          area: form.area.trim() || undefined,
          addressDetails: form.addressDetails.trim() || undefined,
          price: priceNum,
          phone: form.phone.trim(),
          type: "SALE",
          category: marketCategory ?? undefined,
          subcategory: marketSub ?? undefined,
          amenities: amenityKeys,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(t("errorServer"));
        return;
      }
      const newId = typeof data.id === "string" ? data.id : null;
      setCreatedId(newId);
      if (newId) {
        setShareMeta({ id: newId, title: form.title.trim(), city: form.city.trim(), price: form.price });
      } else {
        setShareMeta(null);
      }
      setSuccess(true);
      setForm({
        title: "",
        description: "",
        state: "",
        city: "",
        area: "",
        addressDetails: "",
        price: "",
        phone: "",
        isDirect: true,
      });
      setAmenityKeys([]);
      setImageUrls([]);
    } catch {
      setError(t("errorServer"));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 1) {
    return (
      <div className="space-y-4 rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)]">
        <p className="text-center text-sm font-semibold text-[color:var(--darlink-text)]">{t("stepPickCategory")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MARKETPLACE_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => {
                setMarketCategory(c);
                setStep(2);
              }}
              className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-3 text-center shadow-sm transition hover:border-[color:var(--darlink-accent)]"
            >
              <span className="text-2xl leading-none" aria-hidden>
                {MARKETPLACE_CATEGORY_EMOJI[c]}
              </span>
              <span className="text-center text-xs font-semibold leading-tight sm:text-sm">{tCat(c)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2 && marketCategory) {
    const subs = [...MARKETPLACE_SUBCATEGORIES[marketCategory]];
    return (
      <div className="space-y-4 rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)]">
        <p className="text-center text-sm font-semibold text-[color:var(--darlink-text)]">{t("stepPickSub")}</p>
        <button
          type="button"
          className="text-sm font-medium text-[color:var(--darlink-accent)] underline"
          onClick={() => setStep(1)}
        >
          {t("stepBack")}
        </button>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {subs.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => {
                setMarketSub(s);
                setStep(3);
              }}
              className="min-h-11 rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-2 py-2 text-sm font-semibold text-[color:var(--darlink-text)] hover:border-[color:var(--darlink-accent)]"
            >
              {(tCat as (k: string) => string)(`sub_${s}`)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-[var(--darlink-radius-2xl)] border border-emerald-200 bg-emerald-50/60 p-6 text-center shadow-[var(--darlink-shadow-sm)]">
        <p className="font-semibold text-emerald-950">{t("successTitle")}</p>
        <p className="mt-2 text-sm text-emerald-900/90">{t("successBody")}</p>
        {createdId ? (
          <>
            <Link
              href={`/listing/${createdId}?posted=1`}
              className="mt-4 inline-flex min-h-11 w-full min-w-0 max-w-sm items-center justify-center rounded-[var(--darlink-radius-xl)] bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 sm:mx-auto"
            >
              {t("viewListing")}
            </Link>
            <p className="mt-5 text-base font-bold text-emerald-950 sm:text-lg">{t("shareAfterPost")}</p>
            <div className="mt-3 rounded-[var(--darlink-radius-xl)] border border-emerald-300/50 bg-white/80 p-4 text-start shadow-sm ring-1 ring-emerald-500/15 sm:mx-auto sm:max-w-md">
              <ListingShareActions
                variant="growth"
                whatsappLabel={t("shareWhatsAppCta")}
                listingId={createdId}
                {...(shareMeta
                  ? {
                      shareTitle: shareMeta.title,
                      sharePriceLine: formatSyriaCurrency(Number(shareMeta.price) || 0, SYRIA_PRICING.currency, locale),
                      shareCity: shareMeta.city,
                    }
                  : {})}
              />
            </div>
            {shareMeta ? (
              <QuickPostAiShareBlock
                listingId={shareMeta.id}
                title={shareMeta.title}
                city={shareMeta.city}
                price={shareMeta.price}
              />
            ) : null}
          </>
        ) : (
          <Link
            href="/"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--darlink-radius-xl)] bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {t("backHome")}
          </Link>
        )}
        <button
          type="button"
          className="mt-3 block w-full text-sm text-emerald-800 underline"
          onClick={() => {
            setSuccess(false);
            setCreatedId(null);
            setShareMeta(null);
            setStep(1);
            setMarketCategory(null);
            setMarketSub(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          {t("postAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("stepDetails")}</p>
        <button
          type="button"
          onClick={() => {
            setStep(1);
            setMarketSub(null);
          }}
          className="text-xs font-medium text-[color:var(--darlink-accent)] underline"
        >
          {t("stepBack")}
        </button>
      </div>
      {marketCategory && marketSub ? (
        <p className="text-xs text-[color:var(--darlink-text-muted)]">
          {tCat(marketCategory)} · {(tCat as (k: string) => string)(`sub_${marketSub}`)}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldTitle")} <span className="text-red-600">*</span>
        <Input
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="mt-1"
          name="title"
          autoComplete="off"
        />
      </label>
      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldDescription")}
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mt-1 w-full min-h-[88px] rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
          name="description"
          rows={3}
          autoComplete="off"
        />
      </label>
      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldState")} <span className="text-red-600">*</span>
        <select
          required
          name="state"
          value={form.state}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
        >
          <option value="">{t("statePlaceholder")}</option>
          {SYRIA_STATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {isAr ? o.labelAr : o.labelEn}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldCity")} <span className="text-red-600">*</span>
        <Input
          required
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="mt-1"
          name="city"
          autoComplete="address-level2"
        />
      </label>
      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldArea")}
        <Input
          value={form.area}
          onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
          className="mt-1"
          name="area"
          autoComplete="off"
        />
      </label>
      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldAddressDetails")}
        <textarea
          value={form.addressDetails}
          onChange={(e) => setForm((f) => ({ ...f, addressDetails: e.target.value }))}
          className="mt-1 w-full min-h-[88px] rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
          name="addressDetails"
          rows={3}
          autoComplete="off"
        />
      </label>
      <div className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("fieldPhotos")}</p>
        <p className="text-xs text-[color:var(--darlink-text-muted)]">{t("photoLimitHint")}</p>
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
          <li>{t("photoTipRoom")}</li>
        </ul>
        {imageUrls.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={`qp-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)]">
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
      <div className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("sectionFeatures")}</p>
        <div className="grid gap-2 sm:grid-cols-2" dir={isAr ? "rtl" : "ltr"}>
          {SYRIA_AMENITIES.map((a) => {
            const on = amenityKeys.includes(a.key);
            return (
              <label
                key={a.key}
                className="flex cursor-pointer items-center gap-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => {
                    setAmenityKeys((prev) => (on ? prev.filter((k) => k !== a.key) : [...prev, a.key]));
                  }}
                  className="size-4 rounded border-[color:var(--darlink-border)]"
                />
                <span className="text-[color:var(--darlink-text)]">{isAr ? a.label_ar : a.label_en}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div className="rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/50 p-3 [dir:rtl]:text-right">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={form.isDirect}
            onChange={(e) => setForm((f) => ({ ...f, isDirect: e.target.checked }))}
            className="mt-0.5 size-4 rounded border-[color:var(--darlink-border)] text-emerald-600"
          />
          <span>
            <span className="block text-sm font-medium text-[color:var(--darlink-text)]">{t("fieldIsDirect")}</span>
            <span className="mt-0.5 block text-xs text-[color:var(--darlink-text-muted)]">{t("fieldIsDirectHint")}</span>
          </span>
        </label>
      </div>
      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldPrice")} <span className="text-red-600">*</span>
        <Input
          required
          type="number"
          min={1}
          step={1}
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          className="mt-1"
          name="price"
          inputMode="numeric"
        />
      </label>
      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldPhone")} <span className="text-red-600">*</span>
        <Input
          required
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="mt-1"
          name="phone"
          autoComplete="tel"
        />
      </label>
      <QuickPostAiPanel
        title={form.title}
        description={form.description}
        state={form.state}
        city={form.city}
        area={form.area}
        addressDetails={form.addressDetails}
        price={form.price}
        phone={form.phone}
        amenities={amenityKeys}
        imageUrls={imageUrls}
        onApplyTitle={(v) => setForm((f) => ({ ...f, title: v }))}
        onApplyDescription={(v) => setForm((f) => ({ ...f, description: v }))}
        onApplyAmenities={setAmenityKeys}
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" variant="primary" className="w-full min-h-11" disabled={submitting}>
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
