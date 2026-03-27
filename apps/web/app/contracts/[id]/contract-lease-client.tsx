"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PLATFORM_COPYRIGHT_LINE } from "@/lib/brand/platform";
import { OpenContextConversationButton } from "@/components/messaging/OpenContextConversationButton";

const GOLD = "#C9A646";
const BG = "#0B0B0B";

type SigRow = {
  id: string;
  role: string;
  name: string;
  email: string;
  signedAt: string | null;
  isViewer: boolean;
};

type ApiContract = {
  id: string;
  title: string;
  status: string;
  type?: string;
  contentHtml: string | null;
  signatures: SigRow[];
  canSign: boolean;
  pendingRole: string | null;
  marketplaceSimpleSign?: boolean;
};

export function ContractLeaseClient({ contractId }: { contractId: string }) {
  const [data, setData] = useState<ApiContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typedName, setTypedName] = useState("");
  const [marketplaceAgreed, setMarketplaceAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}`, { credentials: "same-origin" });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Failed to load");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (data?.marketplaceSimpleSign && !marketplaceAgreed) {
      setError("Please confirm you agree to the terms above.");
      return;
    }
    setSubmitting(true);
    try {
      if (data?.marketplaceSimpleSign) {
        const res = await fetch("/api/marketplace/seller-contracts/sign", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractId, confirm: true }),
        });
        const j = await res.json();
        if (!res.ok) {
          setError(j.error || "Could not sign");
          return;
        }
        setMarketplaceAgreed(false);
        await load();
        return;
      }

      const res = await fetch("/api/contracts/sign", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, name: typedName }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Could not sign");
        return;
      }
      setTypedName("");
      await load();
    } catch {
      setError("Sign request failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-16 text-center text-[#B3B3B3]" style={{ background: BG }}>
        Loading contract…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen px-4 py-16 text-center" style={{ background: BG }}>
        <p className="text-rose-400">{error}</p>
        <Link href="/dashboard/real-estate" className="mt-4 inline-block text-sm" style={{ color: GOLD }}>
          ← Dashboard
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen text-slate-100" style={{ background: BG }}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            {PLATFORM_COPYRIGHT_LINE}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{data.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Status: <span className="text-slate-300">{data.status}</span> · Ref:{" "}
            <span className="font-mono text-xs">{data.id.slice(0, 12)}…</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/api/contracts/${contractId}/pdf`}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-[#0B0B0B]"
              style={{ background: GOLD }}
            >
              Download PDF
            </a>
            <Link href="/bnhub/trips" className="text-sm text-slate-400 hover:text-white">
              My trips
            </Link>
            <OpenContextConversationButton
              contextType="contract"
              contextId={contractId}
              label="Open contract conversation"
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:opacity-50"
            />
          </div>
        </header>

        <section
          className="prose prose-invert mt-8 max-w-none prose-headings:text-[#C9A646] prose-p:text-slate-300 prose-li:text-slate-300"
          dangerouslySetInnerHTML={{ __html: data.contentHtml ?? "<p>No content.</p>" }}
        />

        <section className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-semibold" style={{ color: GOLD }}>
            Signatures
          </h2>
          {data.marketplaceSimpleSign && data.signatures.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              Confirm below to accept this agreement. A record is stored with your account.
            </p>
          ) : null}
          <ul className="mt-4 space-y-3 text-sm">
            {data.signatures.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 px-3 py-2"
              >
                <div>
                  <span className="font-medium capitalize text-slate-200">{s.role}</span>
                  <span className="text-slate-500"> · {s.name}</span>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </div>
                {s.signedAt ? (
                  <span className="text-emerald-400">Signed ✔</span>
                ) : (
                  <span className="text-amber-200/90">Pending ⏳</span>
                )}
              </li>
            ))}
          </ul>

          {data.canSign ? (
            <form onSubmit={onSign} className="mt-6 space-y-3 border-t border-white/10 pt-6">
              {data.marketplaceSimpleSign ? (
                <>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={marketplaceAgreed}
                      onChange={(e) => setMarketplaceAgreed(e.target.checked)}
                      className="mt-1"
                    />
                    <span>I have read and agree to this agreement.</span>
                  </label>
                  {error ? <p className="text-sm text-rose-400">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={submitting || !marketplaceAgreed}
                    className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
                    style={{ background: GOLD }}
                  >
                    {submitting ? "Signing…" : "Sign contract"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-400">
                    Sign as <span className="font-semibold text-slate-200">{data.pendingRole}</span>. Type your full
                    legal name as it appears on ID.
                  </p>
                  <p className="text-xs text-slate-500">
                    This electronic signature is legally binding under applicable Québec laws.
                  </p>
                  <input
                    type="text"
                    required
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Full legal name"
                    className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-white placeholder:text-slate-600"
                  />
                  {error ? <p className="text-sm text-rose-400">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
                    style={{ background: GOLD }}
                  >
                    {submitting ? "Signing…" : "Confirm signature"}
                  </button>
                </>
              )}
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              {data.status === "signed" || data.status === "completed"
                ? "Agreement recorded."
                : data.signatures.length > 0 && data.signatures.every((s) => s.signedAt)
                  ? "All parties have signed."
                  : "Waiting for other parties to sign."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
