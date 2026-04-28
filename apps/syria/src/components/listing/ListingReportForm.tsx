"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = { propertyId: string; disabled?: boolean };

export function ListingReportForm({ propertyId, disabled }: Props) {
  const t = useTranslations("Listing");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          onSubmit={async (e) => {
            e.preventDefault();
            setSending(true);
            setOk(false);
            setError(null);
            const fd = new FormData(e.currentTarget);
            const reason = String(fd.get("reason") ?? "");
            try {
              const res = await fetch(`/api/listings/${encodeURIComponent(propertyId)}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ reason }),
              });
              const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
              if (res.ok && data.ok) {
                setOk(true);
                setOpen(false);
                formRef.current?.reset();
              } else if (data.error === "unauthorized") {
                setError("unauthorized");
              } else if (data.error === "rate_limit") {
                setError("rate_limit");
              } else if (data.error === "self_report") {
                setError("self_report");
              } else {
                setError("generic");
              }
            } catch {
              setError("generic");
            } finally {
              setSending(false);
            }
          }}
        >
          <label className="block text-xs text-[color:var(--darlink-text-muted)]">
            {t("reportReasonLabel")}
            <select
              name="reason"
              className="mt-1 w-full rounded-md border border-[color:var(--darlink-border)] bg-white px-2 py-2 text-sm"
              required
            >
              <option value="spam">{t("reportReason_spam")}</option>
              <option value="fake">{t("reportReason_fake")}</option>
              <option value="wrong_info">{t("reportReason_wrong_info")}</option>
              <option value="other">{t("reportReason_other")}</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-md bg-[color:var(--darlink-navy)] py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {sending ? "…" : t("reportSend")}
          </button>
          {error ? (
            <p className="text-xs text-red-700">
              {error === "unauthorized"
                ? t("reportErr_unauthorized")
                : error === "rate_limit"
                  ? t("reportErr_rate_limit")
                  : error === "self_report"
                    ? t("reportErr_self_report")
                    : t("reportErr_generic")}
            </p>
          ) : null}
        </form>
      ) : null}
      {ok ? <p className="mt-2 text-xs text-emerald-700">{t("reportSubmitted")}</p> : null}
    </div>
  );
}
