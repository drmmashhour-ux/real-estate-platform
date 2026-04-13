"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ContentLicenseModal } from "@/components/legal/ContentLicenseModal";
import { CONTENT_LICENSE_ERROR } from "@/lib/legal/content-license-client";
import { CONTENT_LICENSE_VERSION } from "@/modules/legal/content-license";
import type { ImmoListingKind } from "@/lib/immo/types";

const ClientCommunicationChat = dynamic(
  () =>
    import("@/components/ai/ClientCommunicationChat").then((m) => ({
      default: m.ClientCommunicationChat,
    })),
  { ssr: false, loading: () => <p className="text-center text-sm text-slate-500">Loading assistant…</p> }
);

export type ImmoContactSource = "contact_broker" | "book_visit" | "chat" | "form";

const TITLES: Record<ImmoContactSource, string> = {
  contact_broker: "Contact broker",
  book_visit: "Book a visit",
  chat: "Chat with us",
  form: "Get in touch",
};

const SUB: Record<ImmoContactSource, string> = {
  contact_broker: "We’ll route your request to a licensed broker.",
  book_visit: "Tell us when you’d like to visit — a broker will confirm.",
  chat: "Share your details, then continue with the AI assistant if you like.",
  form: "Send a message about this property.",
};

type Props = {
  open: boolean;
  onClose: () => void;
  source: ImmoContactSource;
  listingKind: ImmoListingKind;
  listingRef: string;
  listingCode?: string | null;
  listingTitle: string;
  location: string;
};

export function ImmoContactModal({
  open,
  onClose,
  source,
  listingKind,
  listingRef,
  listingCode,
  listingTitle,
  location,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [buyingSoon, setBuyingSoon] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [preApproved, setPreApproved] = useState("");
  const [consentSms, setConsentSms] = useState(false);
  const [consentVoice, setConsentVoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    tier: string;
    similarSearchUrl: string;
  } | null>(null);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseVersion, setLicenseVersion] = useState<string>(CONTENT_LICENSE_VERSION);
  const [usedAiAssist, setUsedAiAssist] = useState(false);
  const [composeBusy, setComposeBusy] = useState(false);

  const reset = useCallback(() => {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setBuyingSoon("");
    setBudgetRange("");
    setPreApproved("");
    setConsentSms(false);
    setConsentVoice(false);
    setError(null);
    setDone(null);
    setLicenseOpen(false);
    setUsedAiAssist(false);
    setComposeBusy(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const submitPayload = useCallback(
    () => ({
      name,
      email,
      phone,
      message,
      listingKind,
      listingRef,
      source,
      buyingSoon: buyingSoon || undefined,
      budgetRange: budgetRange || undefined,
      preApproved: preApproved || undefined,
      consentSmsWhatsapp: consentSms,
      consentVoice: consentVoice,
      locale: typeof navigator !== "undefined" ? navigator.language : "en",
      sourcePage: typeof window !== "undefined" ? window.location.pathname : "",
      aiAssistUsed: usedAiAssist,
    }),
    [
      name,
      email,
      phone,
      message,
      listingKind,
      listingRef,
      source,
      buyingSoon,
      budgetRange,
      preApproved,
      consentSms,
      consentVoice,
      usedAiAssist,
    ]
  );

  const composeMessageAi = useCallback(async () => {
    setComposeBusy(true);
    setError(null);
    try {
      const draftNotes =
        message.trim() ||
        "I am interested in this property and would like to arrange a visit or discuss next steps.";
      const res = await fetch("/api/immo/compose-message-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: source === "contact_broker" ? "licensed broker" : "listing contact",
          intent: TITLES[source],
          listingTitle,
          location,
          listingCode: listingCode ?? undefined,
          draftNotes,
          tone: "polite",
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string; configured?: boolean };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not draft message");
      }
      if (data.message) {
        setMessage(data.message);
        setUsedAiAssist(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI draft failed");
    } finally {
      setComposeBusy(false);
    }
  }, [listingCode, listingTitle, location, message, source]);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setError(null);
      setBusy(true);
      try {
        const res = await fetch("/api/immo/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload()),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          requiredVersion?: string;
          tier?: string;
          similarSearchUrl?: string;
        };
        if (!res.ok) {
          if (data.error === CONTENT_LICENSE_ERROR && typeof data.requiredVersion === "string") {
            setLicenseVersion(data.requiredVersion);
            setLicenseOpen(true);
            return;
          }
          throw new Error(data.error ?? "Something went wrong");
        }
        setDone({
          tier: data.tier ?? "warm",
          similarSearchUrl: data.similarSearchUrl ?? "/search/bnhub",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send");
      } finally {
        setBusy(false);
      }
    },
    [submitPayload]
  );

  if (!open) return null;

  return (
    <>
    <ContentLicenseModal
      open={licenseOpen}
      requiredVersion={licenseVersion}
      onClose={() => setLicenseOpen(false)}
      onAccepted={() => void submit()}
    />
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={handleClose}
      />
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-700 bg-slate-900 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-labelledby="immo-contact-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-5">
          <div>
            <h2 id="immo-contact-title" className="text-lg font-semibold text-white">
              {TITLES[source]}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{SUB[source]}</p>
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">
              <span className="font-medium text-slate-400">{listingTitle}</span>
              {location && location !== "—" ? ` · ${location}` : null}
              {listingCode ? (
                <span className="ml-1 font-mono text-slate-600">· {listingCode}</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {!done ? (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Full name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Phone *</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="+1 …"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quick questions
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Are you buying soon?</label>
                    <select
                      value={buyingSoon}
                      onChange={(e) => setBuyingSoon(e.target.value)}
                      className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="asap">ASAP</option>
                      <option value="within_30d">Within 30 days</option>
                      <option value="1_3mo">1–3 months</option>
                      <option value="3mo_plus">3+ months</option>
                      <option value="exploring">Just exploring</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Budget range</label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="under_300k">Under $300k</option>
                      <option value="300_500k">$300k – $500k</option>
                      <option value="500_800k">$500k – $800k</option>
                      <option value="800k_plus">$800k+</option>
                      <option value="not_sure">Not sure yet</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Pre-approved / financing?</label>
                    <select
                      value={preApproved}
                      onChange={(e) => setPreApproved(e.target.value)}
                      className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="yes">Yes</option>
                      <option value="no">Not yet</option>
                      <option value="prefer_not">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-slate-400">Message (optional)</label>
                  <button
                    type="button"
                    onClick={() => void composeMessageAi()}
                    disabled={composeBusy}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50"
                  >
                    {composeBusy ? "Drafting…" : "AI polish (Gemini)"}
                  </button>
                </div>
                <p className="mb-2 text-[10px] text-slate-600">
                  Add rough notes, or leave blank — AI drafts a polite message you can edit. Requires server{" "}
                  <code className="text-slate-500">GEMINI_API_KEY</code>.
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Questions, preferred visit times…"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <p className="text-xs text-slate-500">Follow-up (optional)</p>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={consentSms}
                    onChange={(e) => setConsentSms(e.target.checked)}
                    className="mt-1 rounded border-slate-600"
                  />
                  <span>I agree to receive SMS or WhatsApp about this request.</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={consentVoice}
                    onChange={(e) => setConsentVoice(e.target.checked)}
                    className="mt-1 rounded border-slate-600"
                  />
                  <span>I agree to automated voice follow-up where permitted.</span>
                </label>
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="min-h-12 w-full rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
                <p className="font-semibold text-white">Thanks! A broker will contact you shortly.</p>
                <p className="mt-1 text-emerald-200/90">
                  We’ve emailed you a confirmation. Priority:{" "}
                  <span className="font-medium capitalize">{done.tier}</span>
                </p>
              </div>
              <a
                href={done.similarSearchUrl}
                className="block rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Browse similar listings →
              </a>
              {listingKind === "bnhub" ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Continue qualification with AI (optional)
                  </p>
                  <ClientCommunicationChat
                    context={{
                      listingId: listingRef,
                      listingTitle,
                      city: location.split(",")[0]?.trim() || null,
                    }}
                    accent="#10b981"
                    defaultOpen={false}
                  />
                </div>
              ) : (
                <p className="text-center text-xs text-slate-500">
                  A licensed broker will follow up by email or phone for this listing.
                </p>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl border border-slate-600 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
