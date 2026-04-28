"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

export function ListingSellerMessageForm(props: { propertyId: string; disabled?: boolean }) {
  const { propertyId, disabled } = props;
  const t = useTranslations("Listing");
  const formRef = useRef<HTMLFormElement>(null);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (disabled) {
    return null;
  }

  return (
    <form
      ref={formRef}
      className="space-y-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/40 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSending(true);
        setOk(false);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "").trim();
        const phone = String(fd.get("phone") ?? "").trim();
        const message = String(fd.get("message") ?? "").trim();
        try {
          const res = await fetch(`/api/listings/${encodeURIComponent(propertyId)}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              ...(phone.length > 0 ? { phone } : {}),
              message,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          if (res.ok && data.ok) {
            setOk(true);
            formRef.current?.reset();
          } else if (data.error === "messages_disabled") {
            setError("messages_disabled");
          } else if (data.error === "rate_limit_messages") {
            setError("rate_limit_messages");
          } else if (data.error === "listing_unavailable") {
            setError("listing_unavailable");
          } else {
            setError("generic");
          }
        } catch {
          setError("generic");
        }
        setSending(false);
      }}
    >
      <p className="text-xs font-semibold text-[color:var(--darlink-text)]">{t("contactMessageTitle")}</p>
      <label className="block text-xs text-[color:var(--darlink-text-muted)]">
        {t("contactMessageName")}
        <input
          name="name"
          required
          autoComplete="name"
          className="mt-1 w-full rounded-md border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-2 py-2 text-sm text-[color:var(--darlink-text)]"
        />
      </label>
      <label className="block text-xs text-[color:var(--darlink-text-muted)]">
        {t("contactMessagePhoneOptional")}
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="mt-1 w-full rounded-md border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-2 py-2 text-sm text-[color:var(--darlink-text)]"
        />
      </label>
      <label className="block text-xs text-[color:var(--darlink-text-muted)]">
        {t("contactMessageBody")}
        <textarea
          name="message"
          required
          rows={3}
          className="mt-1 w-full whitespace-pre-wrap rounded-md border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-2 py-2 text-sm text-[color:var(--darlink-text)]"
        />
      </label>
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-md bg-[color:var(--darlink-navy)] py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {sending ? "…" : t("contactMessageSend")}
      </button>
      {ok ? <p className="text-xs text-emerald-700">{t("contactMessageOk")}</p> : null}
      {error === "messages_disabled" ? (
        <p className="text-xs text-amber-800">{t("contactMessagesDisabled")}</p>
      ) : error === "rate_limit_messages" ? (
        <p className="text-xs text-amber-800">{t("contactMessageRateLimited")}</p>
      ) : error === "listing_unavailable" ? (
        <p className="text-xs text-red-700">{t("contactMessageUnavailable")}</p>
      ) : error === "generic" ? (
        <p className="text-xs text-red-700">{t("contactMessageErr")}</p>
      ) : null}
    </form>
  );
}
