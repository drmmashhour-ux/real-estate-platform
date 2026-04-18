"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/config/contact";

type Status = "idle" | "submitting" | "success" | "error";

export type GetLeadsLeadFormProps = {
  /** Optional WhatsApp (or other) URL — `NEXT_PUBLIC_GROWTH_WHATSAPP_URL`. */
  directMessageHref?: string | null;
  /** Primary submit button label (default: Submit). */
  submitLabel?: string;
  /** Show optional chat / email row below the form (default: true). */
  showOptionalChatRow?: boolean;
  /** Accent color for gold UI (e.g. landing page `#D4AF37`). */
  accentGold?: string;
};

export function GetLeadsLeadForm({
  directMessageHref,
  submitLabel = "Submit",
  showOptionalChatRow = true,
  accentGold,
}: GetLeadsLeadFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const mailtoFallback = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("LECIPM — listing / lead request")}`;
  const gold = accentGold?.trim() || undefined;
  const btnStyle = gold ? { backgroundColor: gold } : undefined;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("submitting");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const propertyLinkOrAddress = String(fd.get("propertyLinkOrAddress") ?? "").trim();
    const notes = String(fd.get("notes") ?? "").trim();
    if (!name || !propertyLinkOrAddress) {
      setStatus("error");
      setErrorMsg("Please add your name and property link or address.");
      return;
    }
    if (!email && !phone) {
      setStatus("error");
      setErrorMsg("Please provide an email or phone number.");
      return;
    }
    try {
      const res = await fetch("/api/growth/early-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          propertyLinkOrAddress,
          notes: notes || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  const labelClass = gold ? "" : "text-premium-gold/90";

  return (
    <div className="space-y-6">
      <form
        id="get-leads-form"
        onSubmit={onSubmit}
        className={`rounded-2xl border bg-[#121212] p-6 shadow-lg sm:p-8 ${gold ? "border-white/10" : "border-premium-gold/25"}`}
        style={gold ? { borderColor: `${gold}44` } : undefined}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.18em] ${labelClass}`}
          style={gold ? { color: gold } : undefined}
        >
          Your details
        </p>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          Add your name, phone or email, and your property link or address. We&apos;ll follow up personally.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="gl-name"
              className={`block text-xs font-medium uppercase tracking-wider ${labelClass}`}
              style={gold ? { color: gold } : undefined}
            >
              Name
            </label>
            <input
              id="gl-name"
              name="name"
              required
              autoComplete="name"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-base text-white placeholder:text-[#B3B3B3]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 sm:text-sm"
              placeholder="Your name"
            />
          </div>
          <div>
            <label
              htmlFor="gl-email"
              className={`block text-xs font-medium uppercase tracking-wider ${labelClass}`}
              style={gold ? { color: gold } : undefined}
            >
              Email
            </label>
            <input
              id="gl-email"
              name="email"
              type="email"
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-base text-white placeholder:text-[#B3B3B3]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="gl-phone"
              className={`block text-xs font-medium uppercase tracking-wider ${labelClass}`}
              style={gold ? { color: gold } : undefined}
            >
              Phone
            </label>
            <input
              id="gl-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-base text-white placeholder:text-[#B3B3B3]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 sm:text-sm"
              placeholder="+1 …"
            />
          </div>
          <p className="sm:col-span-2 text-xs text-[#737373]">Phone or email — at least one.</p>
          <div className="sm:col-span-2">
            <label
              htmlFor="gl-property"
              className={`block text-xs font-medium uppercase tracking-wider ${labelClass}`}
              style={gold ? { color: gold } : undefined}
            >
              Property address or link
            </label>
            <input
              id="gl-property"
              name="propertyLinkOrAddress"
              required
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-base text-white placeholder:text-[#B3B3B3]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 sm:text-sm"
              placeholder="Street address or listing URL"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="gl-notes"
              className={`block text-xs font-medium uppercase tracking-wider ${labelClass}`}
              style={gold ? { color: gold } : undefined}
            >
              Notes <span className="font-normal text-[#737373]">(optional)</span>
            </label>
            <textarea
              id="gl-notes"
              name="notes"
              rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-base text-white placeholder:text-[#B3B3B3]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 sm:text-sm"
              placeholder="Anything else we should know…"
            />
          </div>
        </div>

        {status === "error" && errorMsg ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {errorMsg}
          </p>
        ) : null}
        {status === "success" ? (
          <p className="mt-4 text-sm text-emerald-400" role="status">
            Thanks — we received your details and will follow up using the contact you provided.
          </p>
        ) : null}

        <div className="mt-6">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl px-6 text-base font-semibold text-black transition hover:brightness-95 disabled:opacity-60"
            style={btnStyle ?? { backgroundColor: "var(--color-premium-gold, #d4af37)" }}
          >
            {status === "submitting" ? "Sending…" : submitLabel}
          </button>
        </div>
      </form>

      {showOptionalChatRow ? (
        <div className="rounded-xl border border-white/10 bg-[#0B0B0B]/80 px-4 py-3 text-center text-sm text-[#B3B3B3]">
          <span className="text-[#737373]">Prefer chat? </span>
          {directMessageHref ? (
            <a
              href={directMessageHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-2 hover:underline"
              style={{ color: gold ?? undefined }}
            >
              Message us directly
            </a>
          ) : (
            <a
              href={mailtoFallback}
              className={`font-medium underline-offset-2 hover:underline ${gold ? "" : "text-premium-gold"}`}
              style={gold ? { color: gold } : undefined}
            >
              Email us
            </a>
          )}
        </div>
      ) : null}
    </div>
  );
}
