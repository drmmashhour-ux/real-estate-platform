import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";

export function signalKey(type: string, entityType: string, entityId: string | null, reasonCode: string): string {
  return `${type}:${entityType}:${entityId ?? "none"}:${reasonCode}`;
}

export function dedupeSignalsById(signals: MarketplaceSignal[]): MarketplaceSignal[] {
  const map = new Map<string, MarketplaceSignal>();
  for (const s of signals) {
    if (!map.has(s.id)) map.set(s.id, s);
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function capSignals(signals: MarketplaceSignal[], max: number): MarketplaceSignal[] {
  if (signals.length <= max) return signals;
  return signals.slice(0, max);
}
