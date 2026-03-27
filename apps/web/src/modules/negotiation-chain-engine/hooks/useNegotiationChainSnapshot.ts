"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NegotiationVersionWithDetails } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";

export type NegotiationChainSnapshot = {
  chain: { id: string; status: string; propertyId?: string; caseId?: string | null } | null;
  activeVersion: NegotiationVersionWithDetails | null;
  history: NegotiationVersionWithDetails[];
  previousVersion: NegotiationVersionWithDetails | null;
  diffFromPrevious: unknown;
  diffSummaryLines: string[];
};

function parseSnapshot(j: Record<string, unknown>): NegotiationChainSnapshot {
  return {
    chain: (j.chain as NegotiationChainSnapshot["chain"]) ?? null,
    activeVersion: (j.activeVersion as NegotiationVersionWithDetails | null) ?? null,
    history: Array.isArray(j.history) ? (j.history as NegotiationVersionWithDetails[]) : [],
    previousVersion: (j.previousVersion as NegotiationVersionWithDetails | null) ?? null,
    diffFromPrevious: j.diffFromPrevious ?? null,
    diffSummaryLines: Array.isArray(j.diffSummaryLines) ? (j.diffSummaryLines as string[]) : [],
  };
}

export function useNegotiationChainSnapshot(listingId: string, documentId?: string | null) {
  const [data, setData] = useState<NegotiationChainSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const fetchSnapshot = useCallback(
    async (opts?: { signal?: AbortSignal }) => {
      const myId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      const q = new URLSearchParams({ propertyId: listingId });
      if (documentId) q.set("caseId", documentId);
      try {
        const res = await fetch(`/api/negotiation-chains?${q.toString()}`, { signal: opts?.signal });
        const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (myId !== requestIdRef.current) return;
        if (!res.ok) {
          setError(typeof j.error === "string" ? j.error : "Could not load negotiation chain.");
          setData(null);
          return;
        }
        setData(parseSnapshot(j));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (myId !== requestIdRef.current) return;
        setError("Network error.");
        setData(null);
      } finally {
        if (myId === requestIdRef.current) setLoading(false);
      }
    },
    [listingId, documentId],
  );

  useEffect(() => {
    const ac = new AbortController();
    void fetchSnapshot({ signal: ac.signal });
    return () => ac.abort();
  }, [fetchSnapshot]);

  const reload = useCallback(() => fetchSnapshot(), [fetchSnapshot]);

  return { data, error, loading, reload };
}
