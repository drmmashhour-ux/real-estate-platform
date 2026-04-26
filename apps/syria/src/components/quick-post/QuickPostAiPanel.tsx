"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { runListingAssistant, type ListingAssistantInput } from "@/lib/ai/listingAssistant";
import { normalizeSyriaAmenityKeys } from "@/lib/syria/amenities";

export function QuickPostAiPanel(props: {
  title: string;
  description: string;
  state: string;
  city: string;
  area: string;
  addressDetails: string;
  price: string;
  phone: string;
  amenities: string[];
  imageUrls: string[];
  onApplyTitle: (v: string) => void;
  onApplyDescription: (v: string) => void;
  onApplyAmenities: (keys: string[]) => void;
}) {
  const t = useTranslations("QuickPost");
  const locale = useLocale();
  const [suggestions, setSuggestions] = useState<ReturnType<typeof runListingAssistant> | null>(null);

  const input: ListingAssistantInput = useMemo(
    () => ({
      title: props.title,
      description: props.description || "—",
      city: props.city,
      state: props.state,
      price: props.price,
      amenities: props.amenities,
      phone: props.phone,
      imageCount: props.imageUrls.length,
      area: props.area,
      addressDetails: props.addressDetails,
    }),
    [
      props.title,
      props.description,
      props.city,
      props.state,
      props.price,
      props.amenities,
      props.phone,
      props.imageUrls.length,
      props.area,
      props.addressDetails,
    ],
  );

  const score = useMemo(() => runListingAssistant(input, locale).qualityScore, [input, locale]);

  function onImprove() {
    setSuggestions(runListingAssistant(input, locale));
  }

  return (
    <div className="rounded-[var(--darlink-radius-xl)] border border-violet-200/60 bg-violet-50/40 p-4 text-start">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[color:var(--darlink-text)]">
          {t("aiQualityLabel", { score })}
        </p>
        <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto" onClick={onImprove}>
          {t("aiImproveListing")}
        </Button>
      </div>
      {suggestions ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-3">
            <p className="text-xs font-semibold uppercase text-[color:var(--darlink-text-muted)]">{t("aiSuggestedTitle")}</p>
            <p className="mt-1 whitespace-pre-wrap text-[color:var(--darlink-text)]">{suggestions.improvedTitle}</p>
            <Button
              type="button"
              variant="primary"
              className="mt-2 min-h-10 w-full sm:w-auto"
              onClick={() => props.onApplyTitle(suggestions.improvedTitle)}
            >
              {t("aiApplyTitle")}
            </Button>
          </div>
          <div className="rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-3">
            <p className="text-xs font-semibold uppercase text-[color:var(--darlink-text-muted)]">{t("aiSuggestedDescription")}</p>
            <p className="mt-1 whitespace-pre-wrap text-[color:var(--darlink-text)]">{suggestions.improvedDescription}</p>
            <Button
              type="button"
              variant="primary"
              className="mt-2 min-h-10 w-full sm:w-auto"
              onClick={() => props.onApplyDescription(suggestions.improvedDescription)}
            >
              {t("aiApplyDescription")}
            </Button>
          </div>
          {suggestions.suggestedAmenities.length > 0 ? (
            <div className="rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-3">
              <p className="text-xs font-semibold uppercase text-[color:var(--darlink-text-muted)]">{t("aiSuggestedAmenities")}</p>
              <p className="mt-1 text-[color:var(--darlink-text-muted)]">{suggestions.suggestedAmenities.join(", ")}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-2 min-h-10 w-full sm:w-auto"
                onClick={() =>
                  props.onApplyAmenities(
                    normalizeSyriaAmenityKeys([...props.amenities, ...suggestions.suggestedAmenities]),
                  )
                }
              >
                {t("aiMergeAmenities")}
              </Button>
            </div>
          ) : null}
          <p className="text-xs text-[color:var(--darlink-text-muted)]">{suggestions.priceWording}</p>
          <ul className="list-inside list-disc text-xs text-[color:var(--darlink-text-muted)]">
            {suggestions.tips.slice(0, 5).map((tip) => (
              <li key={tip.slice(0, 40)}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
