"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { LegalAiDisclaimer } from "@/components/legal/LegalAiDisclaimer";

const TERMS_HTML = `
<p><strong>Application terms</strong></p>
<p>By submitting an application, you confirm that the information you provide is accurate to the best of your knowledge and that you understand the landlord may run references, credit checks, and identity verification outside this platform.</p>
<p>Submitting an application does not guarantee a lease. The landlord may accept or reject applications at their discretion, subject to applicable law.</p>
<p>This summary is informational only and is not legal advice.</p>
`;

export function RentApplyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId") ?? "";
  const [message, setMessage] = useState(
    "I am interested in this rental. I would like to move in on the first of next month. I can provide references and proof of income upon request."
  );
  const [docNote, setDocNote] = useState("ID + proof of income (filenames for demo)");
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!listingId) {
      setErr("Missing listing. Open a listing and click Apply again.");
      return;
    }
    if (!termsAccepted) {
      setErr("You must accept terms before continuing.");
      return;
    }
    if (message.trim().length < 20) {
      setErr("Add a short message (at least 20 characters).");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const legalAcceptedAt = new Date().toISOString();
      const r = await fetch("/api/rental/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          listingId,
          message: message.trim(),
          legalAcceptedAt,
          documentsJson: { notes: docNote.trim() || undefined },
        }),
      });
      const j = (await r.json()) as { error?: string; application?: { id: string } };
      if (!r.ok) {
        const msg = typeof j.error === "string" ? j.error : "";
        throw new Error(msg || "submit_failed");
      }
      router.push("/dashboard/tenant/payments?applied=1");
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setErr(
        m === "Sign in required" || m.includes("401")
          ? "Sign in to submit an application."
          : m === "You must accept terms before continuing."
            ? m
            : m && m !== "submit_failed" && m.length < 160
              ? m
              : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }, [listingId, message, termsAccepted, docNote, router]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {!listingId ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No listing selected. Go to <a className="underline" href="/rent">Rent Hub search</a>, open a listing, and use
          &quot;Apply to rent&quot;.
        </p>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-white/80">Message to landlord</label>
        <textarea
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80">Documents (demo)</label>
        <input
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5"
          type="file"
          multiple
          onChange={() => {
            /* placeholder — demo stores note only */
          }}
        />
        <input
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          placeholder="Notes for uploaded documents"
          value={docNote}
          onChange={(e) => setDocNote(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
          <input
            type="checkbox"
            className="mt-1"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <span>
            I have read and accept the application terms (required before submitting).
            <button
              type="button"
              className="ml-2 text-premium-gold underline"
              onClick={() => setShowTerms(true)}
            >
              View terms
            </button>
          </span>
        </label>
      </div>

      <LegalAiDisclaimer className="text-xs text-white/50" />

      {showTerms ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setShowTerms(false)}
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-6 text-sm text-[#B3B3B3]">
            <h2 className="text-lg font-semibold text-white">Application terms</h2>
            <div
              className="prose prose-invert mt-4 max-w-none text-sm prose-p:mb-3"
              dangerouslySetInnerHTML={{ __html: TERMS_HTML }}
            />
            <button
              type="button"
              className="mt-4 rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-[#0B0B0B]"
              onClick={() => setShowTerms(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <button
        type="button"
        disabled={busy || !listingId}
        onClick={submit}
        className="w-full rounded-xl bg-premium-gold py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Submit application"}
      </button>
    </div>
  );
}
