"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createSybnbListingReport } from "@/actions/sybnb-report";
import { cn } from "@/lib/cn";

type Props = {
  propertyId: string;
  disabled?: boolean;
  /** `compact` = link to expand; `section` = titled block (listing page hero). */
  variant?: "compact" | "section";
};

function reportSubmitErrorMessage(t: (key: string) => string, raw: string): string {
  if (raw.startsWith("Too many")) {
    return t("reportErr_rate_limit");
  }
  if (raw === "not_found" || raw === "self_report" || raw === "not_stay") {
    return t(`reportErr_${raw}`);
  }
  return t("reportErr_generic");
}

export function SybnbReportListingForm({ propertyId, disabled, variant = "compact" }: Props) {
  const t = useTranslations("Sybnb.listing");
  const t8 = useTranslations("Sy8");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (disabled) {
    return null;
  }

  const formInner = (
    <form
      ref={formRef}
      className={cn(
        "space-y-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm [dir=rtl]:text-right",
        variant === "section" ? "mt-2" : "mt-3",
      )}
      action={async (fd) => {
        setSending(true);
        setOk(false);
        setError(null);
        const result = await createSybnbListingReport(fd);
        setSending(false);
        if (result.ok) {
          setOk(true);
          setOpen(false);
          formRef.current?.reset();
          return;
        }
        setError(reportSubmitErrorMessage(t, result.error));
      }}
    >
      <input type="hidden" name="propertyId" value={propertyId} />
      <label className="block text-xs text-neutral-600">
        {t("reportLabel")}
        <select name="reason" className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm" required>
          <option value="fraud">{t8("report_fraud")}</option>
          <option value="duplicate">{t8("report_duplicate")}</option>
          <option value="wrong_price">{t8("report_wrong_price")}</option>
          <option value="wrong_info">{t8("report_wrong_info")}</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-lg bg-neutral-900 py-2 text-xs font-semibold text-amber-400 disabled:opacity-50"
      >
        {sending ? "…" : t8("reportSend")}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {ok ? <p className="text-xs text-emerald-700">{t8("reportOk")}</p> : null}
    </form>
  );

  if (variant === "section") {
    return (
      <section className="rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 [dir=rtl]:text-right">
        <h2 className="text-sm font-semibold text-neutral-900">{t("reportSectionTitle")}</h2>
        <p className="mt-1 text-xs text-neutral-500">{t("reportSectionHint")}</p>
        {formInner}
      </section>
    );
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
      >
        {t("reportCta")}
      </button>
      {open ? formInner : null}
    </div>
  );
}
