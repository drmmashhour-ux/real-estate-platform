import { getLocale, getTranslations } from "next-intl/server";
import { SYRIA_STATE_OPTIONS } from "@/lib/syria/states";
import { SYRIA_AMENITIES } from "@/lib/syria/amenities";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { createMvpPropertyListing } from "@/actions/mvp-listing";
import { createPropertyListing } from "@/actions/listings";
import { SYRIA_PRICING } from "@/lib/pricing";
import { syriaFlags } from "@/lib/platform-flags";
import { SyriaSellLocationFields } from "@/components/sell/SyriaSellLocationFields";
import { MapRequiredSellForm } from "@/components/sell/MapRequiredSellForm";

export default async function SellPage() {
  const t = await getTranslations("Sell");
  const tMvp = await getTranslations("SellMvp");
  const locale = await getLocale();
  const isAr = locale.startsWith("ar");
  const user = await getSessionUser();

  if (!user && !syriaFlags.SYRIA_MVP) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">{t("needLoginTitle")}</h1>
        <p className="text-sm text-stone-600">{t("needLoginBody")}</p>
        <Link
          href="/login"
          className="inline-flex rounded-xl bg-[color:var(--color-syria-olive)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
        >
          {t("needLoginCta")}
        </Link>
      </div>
    );
  }

  if (syriaFlags.SYRIA_MVP) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--darlink-text)]">{tMvp("title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">{tMvp("subtitle")}</p>
        </div>
        <form action={createMvpPropertyListing} className="space-y-4 rounded-2xl border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-5 shadow-[var(--darlink-shadow-sm)]">
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldTitle")} <span className="text-red-600">*</span>
            <input
              required
              name="title"
              className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 text-[color:var(--darlink-text)]"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldPrice", { currency: SYRIA_PRICING.currency })} <span className="text-red-600">*</span>
            <input
              required
              name="price"
              type="number"
              min={1}
              step={1}
              className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 text-[color:var(--darlink-text)]"
            />
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldState")} <span className="text-red-600">*</span>
            <select
              name="state"
              required
              className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
            >
              <option value="">{tMvp("statePlaceholder")}</option>
              {SYRIA_STATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {isAr ? o.labelAr : o.labelEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldCity")} <span className="text-red-600">*</span>
            <input
              required
              name="city"
              className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 text-[color:var(--darlink-text)]"
              autoComplete="address-level2"
            />
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldArea")}
            <input
              name="area"
              className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 text-[color:var(--darlink-text)]"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldAddressDetails")}
            <textarea
              name="addressDetails"
              rows={3}
              className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
              autoComplete="off"
            />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[color:var(--darlink-text)]">{tMvp("sectionFeatures")}</p>
            <div className="grid gap-2 sm:grid-cols-2" dir={isAr ? "rtl" : "ltr"}>
              {SYRIA_AMENITIES.map((a) => (
                <label
                  key={a.key}
                  className="flex cursor-pointer items-center gap-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 text-sm"
                >
                  <input type="checkbox" name="amenities" value={a.key} className="size-4 rounded border-[color:var(--darlink-border)]" />
                  <span className="text-[color:var(--darlink-text)]">{isAr ? a.label_ar : a.label_en}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldPhone")} <span className="text-red-600">*</span>
            <input
              required
              name="phone"
              type="tel"
              inputMode="tel"
              className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 text-[color:var(--darlink-text)]"
              autoComplete="tel"
            />
            <span className="mt-1 block text-xs text-[color:var(--darlink-text-muted)]">{tMvp("fieldPhoneHint")}</span>
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldType")} <span className="text-red-600">*</span>
            <select
              name="type"
              required
              className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
            >
              <option value="SALE">{tMvp("typeSale")}</option>
              <option value="RENT">{tMvp("typeRent")}</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
            {tMvp("fieldImages")}
            <textarea
              name="images"
              rows={2}
              className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 font-mono text-xs text-[color:var(--darlink-text)]"
              placeholder="https://…"
            />
          </label>
          <button
            type="submit"
            className="hadiah-btn-primary w-full min-h-12 rounded-[var(--darlink-radius-xl)] py-3 text-sm font-semibold"
          >
            {tMvp("submit")}
          </button>
        </form>
      </div>
    );
  }

  const listingFeeStr = `${SYRIA_PRICING.currency} ${SYRIA_PRICING.listingFeeAmount.toLocaleString()}`;
  const featuredFeeStr = `${SYRIA_PRICING.currency} ${SYRIA_PRICING.featuredBoostAmount.toLocaleString()}`;
  const premiumFeeStr = `${SYRIA_PRICING.currency} ${SYRIA_PRICING.premiumBoostAmount.toLocaleString()}`;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-stone-600">
          {t("feeIntro", { listingFee: listingFeeStr, featuredFee: featuredFeeStr, premiumFee: premiumFeeStr })}
        </p>
      </div>

      <MapRequiredSellForm action={createPropertyListing} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldTitleAr")}
          <input
            required
            name="title_ar"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
            placeholder={t("placeholderTitleAr")}
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldTitleEn")}
          <span className="mb-1 block text-xs font-normal text-stone-500">{t("fieldTitleEnHint")}</span>
          <input
            name="title_en"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
            placeholder={t("placeholderTitleEn")}
          />
        </label>
        <SyriaSellLocationFields />
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldDescriptionAr")}
          <textarea
            required
            name="description_ar"
            rows={5}
            placeholder={t("placeholderDescriptionAr")}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldDescriptionEn")}
          <textarea
            name="description_en"
            rows={4}
            placeholder={t("placeholderDescriptionEn")}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldPrice", { currency: SYRIA_PRICING.currency })}
          <input
            required
            name="price"
            type="number"
            min={1}
            step={1}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldType")}
          <select
            name="type"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
          >
            <option value="SALE">{t("typeSale")}</option>
            <option value="RENT">{t("typeRent")}</option>
            <option value="BNHUB">{t("typeBnhub")}</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldImages")}
          <textarea
            name="images"
            rows={3}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs outline-none focus:border-stone-400"
            placeholder={t("placeholderImageUrl")}
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldAmenities")}
          <input
            name="amenities"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
            placeholder={t("placeholderAmenities")}
          />
        </label>
        <fieldset className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
          <legend className="px-1 text-sm font-medium text-stone-800">{t("planSectionTitle")}</legend>
          <div className="mt-3 space-y-3">
            <label className="flex cursor-pointer gap-3 rounded-lg border border-transparent p-2 hover:border-stone-200 hover:bg-white">
              <input type="radio" name="plan" value="free" defaultChecked className="mt-0.5 size-4 text-stone-700" />
              <span>
                <span className="block text-sm font-semibold text-stone-900">{t("planFree")}</span>
                <span className="text-xs text-stone-600">{t("planFreeDesc")}</span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-transparent p-2 hover:border-amber-200/80 hover:bg-white">
              <input type="radio" name="plan" value="featured" className="mt-0.5 size-4 text-amber-700" />
              <span>
                <span className="block text-sm font-semibold text-stone-900">
                  {t("planFeatured")} · {featuredFeeStr}
                </span>
                <span className="text-xs text-stone-600">{t("planFeaturedDesc")}</span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-amber-100 bg-gradient-to-r from-amber-50/80 to-amber-100/30 p-2 hover:border-amber-300/60">
              <input type="radio" name="plan" value="premium" className="mt-0.5 size-4" />
              <span>
                <span className="block text-sm font-semibold text-stone-900">
                  {t("planPremium")} · {premiumFeeStr}
                </span>
                <span className="text-xs text-stone-600">{t("planPremiumDesc")}</span>
              </span>
            </label>
          </div>
        </fieldset>
        <label className="block text-sm font-medium text-stone-700">
          {t("fieldPaymentMethod")}
          <select
            name="payment_method"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
            defaultValue="MANUAL_TRANSFER"
          >
            <option value="MANUAL_TRANSFER">{t("payManualTransfer")}</option>
            <option value="CASH">{t("payCash")}</option>
            <option value="LOCAL_GATEWAY_PLACEHOLDER">{t("payLocalGateway")}</option>
          </select>
          <span className="mt-1 block text-xs font-normal text-stone-500">{t("fieldPaymentMethodHint")}</span>
        </label>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">{t("manualBoxTitle")}</p>
          <p className="mt-1 text-amber-900/90">{t("manualBoxBody")}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block text-xs font-medium text-amber-950">
              {t("fieldRef")}
              <input
                name="manual_ref"
                className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-stone-900 outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-amber-950">
              {t("fieldProof")}
              <input
                name="proof_url"
                className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-stone-900 outline-none"
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[color:var(--color-syria-olive)] py-3 text-sm font-semibold text-white hover:opacity-95"
        >
          {t("submit")}
        </button>
      </MapRequiredSellForm>
    </div>
  );
}
