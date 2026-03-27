"use client";

import { useCallback, useState } from "react";
import type { EnforceableTemplateKind } from "@/lib/legal/enforceable-contract-templates";
import { ContractSign } from "@/components/legal/ContractSign";

type Props = {
  open: boolean;
  title?: string;
  kind: EnforceableTemplateKind;
  fsboListingId?: string;
  listingId?: string;
  onClose: () => void;
  onComplete?: (contractId: string) => void;
};

/**
 * Blocks a flow until the user signs the required enforceable agreement; call after a 403 from gated APIs.
 */
export function ContractRequiredModal({
  open,
  title = "Agreement required",
  kind,
  fsboListingId,
  listingId,
  onClose,
  onComplete,
}: Props) {
  const [done, setDone] = useState(false);

  const handleSuccess = useCallback(
    (contractId: string) => {
      setDone(true);
      onComplete?.(contractId);
      onClose();
    },
    [onComplete, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0a0a] p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {done ? (
          <p className="text-sm text-emerald-400">Saved. You can continue.</p>
        ) : (
          <ContractSign
            kind={kind}
            fsboListingId={fsboListingId}
            listingId={listingId}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
