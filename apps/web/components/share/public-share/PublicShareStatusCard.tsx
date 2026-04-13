"use client";

type Props = {
  guestFirstName: string;
  listingName: string;
  listingCity: string;
  sessionStatusLabel: string;
  stayStatusLabel: string;
  lastUpdatedLabel: string;
};

export function PublicShareStatusCard({
  guestFirstName,
  listingName,
  listingCity,
  sessionStatusLabel,
  stayStatusLabel,
  lastUpdatedLabel,
}: Props) {
  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-black/30"
      aria-label="Status"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h2>
      <p className="mt-3 text-sm text-slate-400">Guest</p>
      <p className="text-lg font-semibold text-white">{guestFirstName}</p>
      <p className="mt-4 text-sm text-slate-400">Listing</p>
      <p className="text-base text-slate-100">
        {listingName} · {listingCity}
      </p>
      <p className="mt-4 text-sm text-slate-400">Session</p>
      <p className="text-sm font-medium capitalize text-emerald-200/95">{sessionStatusLabel}</p>
      <p className="mt-3 text-sm text-slate-400">Stay status</p>
      <p className="text-sm font-medium text-slate-200">{stayStatusLabel}</p>
      <p className="mt-4 text-sm text-slate-400">Last updated</p>
      <p className="text-sm text-slate-300">{lastUpdatedLabel}</p>
    </section>
  );
}
