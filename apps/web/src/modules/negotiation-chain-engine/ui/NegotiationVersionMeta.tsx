"use client";

import type { NegotiationVersionWithDetails } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";
import { formatVersionTimestamp, versionTypeLabel } from "@/src/modules/negotiation-chain-engine/lib/negotiationUiFormat";

type Props = {
  version: NegotiationVersionWithDetails;
  compact?: boolean;
};

export function NegotiationVersionMeta({ version, compact }: Props) {
  const created = formatVersionTimestamp(version.createdAt);
  return (
    <div className={compact ? "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500" : "space-y-0.5 text-xs text-slate-400"}>
      <p className={compact ? "font-medium text-slate-300" : "text-sm font-semibold text-white"}>
        {versionTypeLabel(version.versionNumber)}
        <span className="ml-2 font-normal capitalize text-slate-500">· {version.role}</span>
      </p>
      <p className="tabular-nums text-slate-500">{created}</p>
    </div>
  );
}
