"use client";

import { useState } from "react";
import { m } from "./marketing-ui-classes";

export function ScheduleCampaignModal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = "Continue",
  busy,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  busy?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`${m.card} max-h-[90vh] w-full max-w-lg overflow-y-auto border-amber-500/30`}>
        <h3 className={m.title}>{title}</h3>
        <div className="mt-4">{children}</div>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={m.btnGhost} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={m.btnPrimary}
            disabled={busy}
            onClick={async () => {
              setError(null);
              try {
                await onConfirm();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
