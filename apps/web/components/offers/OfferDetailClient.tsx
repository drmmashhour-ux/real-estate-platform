"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { OfferEvent, OfferEventType, OfferStatus } from "@prisma/client";
import { OfferTimeline } from "@/components/offers/OfferTimeline";
import { getAllowedTransitions, canPostCounterOffer } from "@/modules/offers/services/offer-status-machine";
import type { OfferActorRole } from "@/modules/offers/services/offer-status-machine";
import { isPublicDemoMode } from "@/lib/demo-mode";
import { OpenContextConversationButton } from "@/components/messaging/OpenContextConversationButton";

export type OfferDetailInitial = {
  id: string;
  listingId: string;
  listingTitle: string | null;
  status: OfferStatus;
  offeredPrice: number;
  downPaymentAmount: number | null;
  financingNeeded: boolean | null;
  closingDate: string | null;
  conditions: string | null;
  message: string | null;
  buyer?: { name: string | null; email: string | null };
  events: Array<{
    id: string;
    type: string;
    message: string | null;
    createdAt: Date | string;
    metadata: unknown;
  }>;
};

type Props = {
  initialOffer: OfferDetailInitial;
  viewer: OfferActorRole;
};

export function OfferDetailClient({ initialOffer, viewer }: Props) {
  const [offer, setOffer] = useState(initialOffer);
  const [err, setErr] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMsg, setCounterMsg] = useState("");
  const [note, setNote] = useState("");
  const [noteInternal, setNoteInternal] = useState(true);
  const demo = isPublicDemoMode();

  const reload = useCallback(async () => {
    const res = await fetch(`/api/offers/${encodeURIComponent(offer.id)}`, { credentials: "same-origin" });
    const j = (await res.json()) as { error?: string; offer?: OfferDetailInitial };
    if (!res.ok) {
      setErr(j.error ?? "Failed to refresh");
      return;
    }
    if (j.offer) {
      setOffer({
        ...j.offer,
        listingTitle: j.offer.listingTitle ?? offer.listingTitle,
        events: j.offer.events.map((e) => ({
          ...e,
          createdAt: typeof e.createdAt === "string" ? e.createdAt : (e.createdAt as unknown as string),
        })),
      });
    }
  }, [offer.id, offer.listingTitle]);

  async function postStatus(status: OfferStatus) {
    setErr(null);
    const res = await fetch(`/api/offers/${encodeURIComponent(offer.id)}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status }),
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Action failed");
      return;
    }
    await reload();
  }

  async function postSubmitDraft() {
    setErr(null);
    const res = await fetch(`/api/offers/${encodeURIComponent(offer.id)}/submit`, {
      method: "POST",
      credentials: "same-origin",
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Submit failed");
      return;
    }
    await reload();
  }

  async function postCounter() {
    setErr(null);
    const res = await fetch(`/api/offers/${encodeURIComponent(offer.id)}/counter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        offeredPrice: parseFloat(counterPrice),
        message: counterMsg || undefined,
      }),
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Counter failed");
      return;
    }
    setCounterPrice("");
    setCounterMsg("");
    await reload();
  }

  async function postNote() {
    setErr(null);
    const res = await fetch(`/api/offers/${encodeURIComponent(offer.id)}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ message: note, internal: noteInternal }),
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Note failed");
      return;
    }
    setNote("");
    await reload();
  }

  const allowed = getAllowedTransitions(offer.status, viewer);
  const canCounter = canPostCounterOffer(offer.status, viewer);

  return (
    <div className="space-y-8 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-slate-500">Offer</p>
          <h1 className="text-2xl font-semibold text-white">
            {offer.listingTitle ?? `Listing ${offer.listingId.slice(0, 10)}…`}
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{offer.listingId}</p>
        </div>
        <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium text-[#C9A96E]">
          {offer.status.replace(/_/g, " ")}
        </span>
      </div>

      {demo ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/90">
          Demo workflow — actions update platform state only.
        </p>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="text-xs uppercase text-slate-500">Conversation</p>
        <div className="mt-2">
          <OpenContextConversationButton
            contextType="offer"
            contextId={offer.id}
            label="Open offer conversation"
            className="rounded-lg border border-[#C9A96E]/50 bg-[#C9A96E]/10 px-4 py-2 text-sm font-semibold text-[#C9A96E] hover:bg-[#C9A96E]/20 disabled:opacity-50"
          />
        </div>
      </div>

      {err ? <p className="text-sm text-red-300">{err}</p> : null}

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <dt className="text-[10px] uppercase text-slate-500">Offered price</dt>
          <dd className="font-mono text-lg">${offer.offeredPrice.toLocaleString()}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <dt className="text-[10px] uppercase text-slate-500">Down payment</dt>
          <dd className="font-mono">
            {offer.downPaymentAmount != null ? `$${offer.downPaymentAmount.toLocaleString()}` : "—"}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <dt className="text-[10px] uppercase text-slate-500">Financing</dt>
          <dd>{offer.financingNeeded == null ? "—" : offer.financingNeeded ? "Yes" : "No"}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <dt className="text-[10px] uppercase text-slate-500">Closing</dt>
          <dd>{offer.closingDate ? new Date(offer.closingDate).toLocaleDateString() : "—"}</dd>
        </div>
      </dl>

      {offer.message ? (
        <div>
          <p className="text-xs uppercase text-slate-500">Message</p>
          <p className="mt-1 text-sm text-slate-200">{offer.message}</p>
        </div>
      ) : null}

      {offer.buyer?.email != null || offer.buyer?.name != null ? (
        <div>
          <p className="text-xs uppercase text-slate-500">Buyer</p>
          <p className="text-sm">{offer.buyer?.name ?? "—"}</p>
          <p className="text-sm text-slate-400">{offer.buyer?.email ?? ""}</p>
        </div>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold text-[#C9A96E]">Timeline</h2>
        <div className="mt-3">
          <OfferTimeline
            events={offer.events.map((e) => ({
              id: e.id,
              type: e.type as OfferEventType,
              message: e.message,
              createdAt: new Date(e.createdAt as unknown as string | Date),
              metadata: e.metadata as OfferEvent["metadata"],
            }))}
          />
        </div>
      </section>

      {viewer === "buyer" && offer.status === "DRAFT" ? (
        <button
          type="button"
          onClick={() => void postSubmitDraft()}
          className="rounded-lg bg-[#C9A96E] px-4 py-2 text-sm font-semibold text-black"
        >
          Submit offer
        </button>
      ) : null}

      {allowed.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-white">Update status</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {allowed.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void postStatus(s)}
                className="rounded-lg bg-[#C9A96E]/90 px-3 py-2 text-xs font-semibold text-black hover:bg-[#C9A96E]"
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {canCounter ? (
        <section className="rounded-xl border border-white/10 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-white">Counter-offer</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block text-xs text-slate-400">
              Price (USD)
              <input
                type="number"
                className="mt-1 w-full rounded border border-white/15 bg-black/50 px-2 py-2 text-sm text-white"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
              />
            </label>
            <label className="block text-xs text-slate-400 sm:col-span-2">
              Message
              <input
                className="mt-1 w-full rounded border border-white/15 bg-black/50 px-2 py-2 text-sm text-white"
                value={counterMsg}
                onChange={(e) => setCounterMsg(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void postCounter()}
            className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            Send counter-offer
          </button>
        </section>
      ) : null}

      {viewer === "broker" || viewer === "admin" ? (
        <section className="rounded-xl border border-white/10 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-white">Internal note</h3>
          <textarea
            className="mt-2 w-full rounded border border-white/15 bg-black/50 px-2 py-2 text-sm text-white"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={noteInternal} onChange={(e) => setNoteInternal(e.target.checked)} />
            Internal (hidden from buyer)
          </label>
          <button
            type="button"
            onClick={() => void postNote()}
            className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white"
          >
            Add note
          </button>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/dashboard/offers" className="text-[#C9A96E] hover:underline">
          ← My offers
        </Link>
        {viewer === "broker" || viewer === "admin" ? (
          <Link href="/dashboard/broker/offers" className="text-[#C9A96E] hover:underline">
            Broker inbox
          </Link>
        ) : null}
      </div>
    </div>
  );
}
