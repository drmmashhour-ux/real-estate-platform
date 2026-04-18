import { getTranslations } from "next-intl/server";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export async function BuySearchFilters(props: { defaultQ?: string; defaultCity?: string }) {
  const t = await getTranslations("home");

  return (
    <form
      method="get"
      className="darlink-rtl-row flex max-w-3xl flex-col gap-3 rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-4 shadow-[var(--darlink-shadow-sm)] md:flex-row md:items-end"
    >
      <label className="block flex-1 text-sm text-[color:var(--darlink-text-muted)]">
        {t("searchCity")}
        <Input name="city" defaultValue={props.defaultCity ?? ""} placeholder={t("searchCityPlaceholder")} className="mt-1" />
      </label>
      <label className="block flex-1 text-sm text-[color:var(--darlink-text-muted)]">
        {t("searchKeywords")}
        <Input name="q" defaultValue={props.defaultQ ?? ""} placeholder={t("search_placeholder")} className="mt-1" />
      </label>
      <Button type="submit" variant="primary" className="md:mb-0.5">
        {t("searchSubmit")}
      </Button>
    </form>
  );
}
