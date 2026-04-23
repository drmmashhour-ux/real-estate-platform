import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { createPropertyListing } from "@/actions/listings";
import { SYRIA_PRICING } from "@/lib/pricing";
import { SyriaSellLocationFields } from "@/components/sell/SyriaSellLocationFields";
import { MapRequiredSellForm } from "@/components/sell/MapRequiredSellForm";

export default async function SellPage() {
  const t = await getTranslations("Sell");
  const user = await getSessionUser();

  const listingFeeStr = `${SYRIA_PRICING.currency} ${SYRIA_PRICING.listingFeeAmount.toLocaleString()}`;
  const featuredFeeStr = `${SYRIA_PRICING.currency} ${SYRIA_PRICING.featuredBoostAmount.toLocaleString()}`;

  if (!user) {
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

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-stone-600">
          {t("feeIntro", { listingFee: listingFeeStr, featuredFee: featuredFeeStr })}
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
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="featured" className="size-4 rounded border-stone-300" />
          {t("featuredCheckbox")}
        </label>
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
