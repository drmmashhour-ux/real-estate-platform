"use client";

export function DepositTracker({ note }: { note?: string }) {
  return (
    <p className="text-xs text-zinc-500">
      {note ?? "Deposit milestones follow your trust workflow mode — confirm with bank/trust records."}
    </p>
  );
}
