"use client";

import { useEffect, useRef, useState } from "react";

type OfferOpt = { serviceId: string; name: string };

export function ServiceRequestPanel({
  bookingId,
  listingId,
  canRequest,
}: {
  bookingId: string;
  listingId: string;
  canRequest: boolean;
}) {
  const [offers, setOffers] = useState<OfferOpt[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<
    { id: string; status: string; message: string; service: { name: string } }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const seededService = useRef(false);

  useEffect(() => {
    let cancelled = false;
    seededService.current = false;
    async function run() {
      setLoading(true);
      try {
        const [oRes, rRes] = await Promise.all([
          fetch(`/api/bnhub/listings/${listingId}/hospitality-offers`),
          fetch(`/api/bnhub/bookings/${bookingId}/service-requests`),
        ]);
        const oJson = (await oRes.json()) as { offers?: { serviceId: string; name: string }[] };
        const rJson = (await rRes.json()) as {
          requests?: { id: string; status: string; message: string; service: { name: string } }[];
        };
        if (!cancelled && oRes.ok) {
          const next = (oJson.offers ?? []).map((x) => ({ serviceId: x.serviceId, name: x.name }));
          setOffers(next);
          if (next.length && !seededService.current) {
            seededService.current = true;
            setServiceId(next[0]!.serviceId);
          }
        }
        if (!cancelled && rRes.ok) setRequests(rJson.requests ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [bookingId, listingId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSent(false);
    const r = await fetch(`/api/bnhub/bookings/${bookingId}/service-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, message: message.trim() }),
    });
    const j = (await r.json()) as { error?: string };
    if (!r.ok) {
      setError(j.error ?? "Could not send request");
      return;
    }
    setMessage("");
    setSent(true);
    const r2 = await fetch(`/api/bnhub/bookings/${bookingId}/service-requests`);
    const rj = (await r2.json()) as {
      requests?: { id: string; status: string; message: string; service: { name: string } }[];
    };
    if (r2.ok) setRequests(rj.requests ?? []);
  }

  if (!canRequest) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-slate-200">Request an add-on</h2>
      <p className="mt-1 text-sm text-slate-500">
        After booking, you can ask the host for services that are available on this listing.
      </p>
      {loading ? <p className="mt-3 text-sm text-slate-500">Loading…</p> : null}
      {!loading && !offers.length ? (
        <p className="mt-3 text-sm text-slate-500">No bookable add-ons on this listing.</p>
      ) : null}
      {offers.length > 0 ? (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-sm text-slate-300">
            Service
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
            >
              {offers.map((o) => (
                <option key={o.serviceId} value={o.serviceId}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Message
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
              placeholder="Dates, headcount, timing…"
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {sent ? <p className="text-sm text-emerald-400">Request sent.</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Send request
          </button>
        </form>
      ) : null}
      {requests.length > 0 ? (
        <ul className="mt-6 space-y-2 border-t border-slate-800 pt-4 text-sm text-slate-400">
          <li className="font-medium text-slate-300">Your requests</li>
          {requests.map((req) => (
            <li key={req.id} className="rounded-lg bg-slate-950/60 px-3 py-2">
              <span className="text-slate-200">{req.service.name}</span> · {req.status}
              <p className="mt-1 text-xs text-slate-500">{req.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
