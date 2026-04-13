"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  PublicShareDetailsCard,
  PublicShareInactiveState,
  PublicShareMapCard,
  PublicShareStatusCard,
} from "@/components/share/public-share";

type PublicPayload =
  | {
      active: false;
      state: string;
      message: string;
    }
  | {
      active: true;
      sessionStatus: string;
      shareType: string;
      guestFirstName: string;
      listingName: string;
      listingCity: string;
      stayStatus: string;
      checkIn: string;
      checkOut: string;
      expiresAt: string;
      lastLocation: {
        lat: number;
        lng: number;
        accuracyMeters: number | null;
        updatedAt: string | null;
      } | null;
    };

function sessionStatusLabel(raw: string): string {
  return raw.replace(/_/g, " ").toLowerCase();
}

export default function SharedStayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<PublicPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void fetch(`/api/public-share/${encodeURIComponent(token)}`, { cache: "no-store" })
        .then(async (r) => {
          const j = (await r.json().catch(() => ({}))) as PublicPayload & { error?: string };
          if (!cancelled) setLoading(false);
          if (!r.ok) {
            setError("unavailable");
            setData(null);
            return;
          }
          if (!cancelled) {
            setError(null);
            setData(j as PublicPayload);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoading(false);
            setError("unavailable");
          }
        });
    };
    load();
    const id = window.setInterval(load, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [token]);

  const lastUpdatedLabel = useMemo(() => {
    if (!data || !data.active) return "—";
    if (data.shareType === "LIVE_LOCATION") {
      if (data.lastLocation?.updatedAt) {
        return new Date(data.lastLocation.updatedAt).toLocaleString();
      }
      return "Location not updated yet";
    }
    return "Stay status only (no live location)";
  }, [data]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-center text-slate-400">
        <p className="text-sm">Loading…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950">
        <PublicShareInactiveState
          variant="unavailable"
          message="This link is unavailable or no longer active."
          showBrowseLink
        />
      </main>
    );
  }

  if (!data.active) {
    return (
      <main className="min-h-screen bg-slate-950">
        <PublicShareInactiveState
          variant="ended"
          message={data.message || "This link is no longer active."}
          showBrowseLink
        />
      </main>
    );
  }

  const mapHref =
    data.lastLocation != null
      ? `https://www.openstreetmap.org/?mlat=${data.lastLocation.lat}&mlon=${data.lastLocation.lng}&zoom=14`
      : null;

  const liveMode = data.shareType === "LIVE_LOCATION";

  return (
    <main className="min-h-screen bg-slate-950 pb-16 pt-8 text-slate-100">
      <div className="mx-auto max-w-lg px-4">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">BNHUB</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Shared stay</h1>
          <p className="mt-2 text-sm text-slate-500">This stay was shared with you temporarily.</p>
          <p className="mt-1 text-xs text-slate-600">Read-only · no sign-in · refreshes about every 15 seconds</p>
        </header>

        <div className="mt-8 space-y-4">
          <PublicShareStatusCard
            guestFirstName={data.guestFirstName}
            listingName={data.listingName}
            listingCity={data.listingCity}
            sessionStatusLabel={sessionStatusLabel(data.sessionStatus)}
            stayStatusLabel={data.stayStatus}
            lastUpdatedLabel={lastUpdatedLabel}
          />

          <PublicShareMapCard liveMode={liveMode} lastLocation={data.lastLocation} mapHref={mapHref} />

          <PublicShareDetailsCard checkInIso={data.checkIn} checkOutIso={data.checkOut} />
        </div>

        <p className="mt-8 rounded-xl border border-slate-800/80 bg-slate-900/50 px-4 py-3 text-center text-xs leading-relaxed text-slate-500">
          Link active until{" "}
          <time dateTime={data.expiresAt} className="text-slate-400">
            {new Date(data.expiresAt).toLocaleString()}
          </time>
          . No payment or private account details are shown.
        </p>
      </div>
    </main>
  );
}
