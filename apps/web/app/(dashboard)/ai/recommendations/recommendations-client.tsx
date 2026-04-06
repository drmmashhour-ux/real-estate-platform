"use client";

import { useCallback, useEffect, useState } from "react";
import { AIRecommendationCard, type Rec } from "@/components/ai/AIRecommendationCard";

export function RecommendationsClient() {
  const [items, setItems] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/ai/recommendations?status=active");
    const data = (await res.json()) as { recommendations?: Rec[] };
    setItems(data.recommendations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dismiss = async (id: string) => {
    await fetch("/api/ai/actions/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionKey: "dismiss_recommendation",
        targetEntityType: "recommendation",
        targetEntityId: id,
        allowManualSafe: true,
      }),
    });
    void load();
  };

  const act = async (rec: Rec) => {
    const sa = rec.suggestedAction ?? "";
    const actionKey =
      sa === "draft_listing_copy" || sa === "apply_listing_draft"
        ? "draft_listing_copy"
        : sa === "recommend_promotion" || sa === "review_promotion"
          ? "recommend_promotion"
          : "draft_listing_copy";
    await fetch("/api/ai/actions/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionKey,
        targetEntityType: rec.targetEntityType,
        targetEntityId: rec.targetEntityId,
        allowManualSafe: true,
        payload:
          actionKey === "draft_listing_copy"
            ? { proposedTitle: null, proposedDescription: rec.description.slice(0, 4000), confidence: rec.confidence }
            : { note: rec.description.slice(0, 500) },
      }),
    });
    void load();
  };

  if (loading) return <p className="text-sm text-white/45">Loading…</p>;

  return (
    <div className="space-y-4">
      {items.length === 0 ? <p className="text-sm text-white/45">No active recommendations.</p> : null}
      {items.map((r) => (
        <AIRecommendationCard key={r.id} rec={r} onDismiss={dismiss} onExecute={act} />
      ))}
    </div>
  );
}
