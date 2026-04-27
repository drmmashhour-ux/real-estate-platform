"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createSyriaListingReport } from "@/actions/syria-listing-report";

type Props = { propertyId: string; disabled?: boolean };

export function ListingReportForm({ propertyId, disabled }: Props) {
  const t = useTranslations("Listing");
  const t8 = useTranslations("Sy8");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (disabled) {
    return null;
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-red-600 hover:underline"
      >
        {t("reportListing")}
      </button>
      {open ? (
        <form
          ref={formRef}
          className="mt-3 space-y-2 rounded-xl border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-3"
          action={async (fd) => {
            setSending(true);
            setOk(false);
            await createSyriaListingReport(fd);
            setSending(false);
            setOk(true);
            setOpen(false);
            formRef.current?.reset();
          }}
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <label className="block text-xs text-[color:var(--darlink-text-muted)]">
            {t8("reportReasonLabel")}
            <select name="reason" className="mt-1 w-full rounded-md border border-[color:var(--darlink-border)] bg-white px-2 py-2 text-sm" required>
              <option value="fraud">{t8("report_fraud")}</option>
              <option value="duplicate">{t8("report_duplicate")}</option>
              <option value="wrong_price">{t8("report_wrong_price")}</option>
              <option value="wrong_info">{t8("report_wrong_info")}</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-md bg-[color:var(--darlink-navy)] py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {sending ? "…" : t8("reportSend")}
          </button>
          {ok ? <p className="text-xs text-emerald-700">{t8("reportOk")}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
