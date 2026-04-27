import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Props = {
  roleLabel: string;
  propertyTitle: string;
  propertyHref: string;
  checkInOut: string;
  amountPrimary: string;
  amountSub: string | null;
  amountBreakdown: string | null;
  guestPayLine: string;
  payoutStatusLine: string;
  sybnbPhaseLine: string | null;
  payoutHint: string | null;
  /** Host-facing SYBNB escrow copy (no internal risk details). */
  hostEscrowLine?: string | null;
  guidanceLine: string;
  children?: ReactNode;
};

/**
 * One booking row in the dashboard list (stays + other categories share layout).
 * Parent supplies translated copy.
 */
export function SybnbBookingCard({
  roleLabel,
  propertyTitle,
  propertyHref,
  checkInOut,
  amountPrimary,
  amountSub,
  amountBreakdown,
  guestPayLine,
  payoutStatusLine,
  sybnbPhaseLine,
  payoutHint,
  hostEscrowLine,
  guidanceLine,
  children,
}: Props) {
  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-stone-500">{roleLabel}</p>
          <Link href={propertyHref} className="text-lg font-semibold text-stone-900 hover:underline">
            {propertyTitle}
          </Link>
          <p className="text-sm text-stone-600">{checkInOut}</p>
          {sybnbPhaseLine ? <p className="mt-1 text-xs text-stone-500">{sybnbPhaseLine}</p> : null}
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{amountPrimary}</p>
          {amountSub ? <p className="text-xs text-stone-500">{amountSub}</p> : null}
          {amountBreakdown ? <p className="text-xs text-stone-500">{amountBreakdown}</p> : null}
          <p className="text-stone-600">{guestPayLine}</p>
          <p className="text-stone-600">{payoutStatusLine}</p>
        </div>
      </div>

      {payoutHint ? <p className="mt-2 text-xs text-stone-500">{payoutHint}</p> : null}
      {hostEscrowLine ? <p className="mt-2 text-xs text-amber-900/90">{hostEscrowLine}</p> : null}
      <p className="mt-2 text-xs text-stone-600">{guidanceLine}</p>
      {children}
    </li>
  );
}
