"use client";

import Link from "next/link";

type Props = {
  allowed: boolean;
  upgradeHref?: string | null;
  title?: string;
  message?: string;
  children: React.ReactNode;
};

/** Client shell — compute `allowed` server-side (`evaluatePaywall`) and pass through. */
export function PaywallGate({
  allowed,
  upgradeHref = "/signup",
  title = "Upgrade required",
  message,
  children,
}: Props) {
  if (allowed) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-amber-400/35 bg-amber-950/25 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">{title}</p>
      {message ? <p className="mt-2 text-sm text-slate-200">{message}</p> : null}
      {upgradeHref ? (
        <Link
          href={upgradeHref}
          className="mt-4 inline-flex rounded-xl border border-amber-400/45 bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/25"
        >
          Upgrade
        </Link>
      ) : null}
    </div>
  );
}
