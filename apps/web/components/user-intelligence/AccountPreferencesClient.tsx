"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserPreferenceProfileView } from "@/modules/user-intelligence/types/user-intelligence.types";
import type { UserJourneyView } from "@/modules/user-intelligence/services/user-journey.service";
import { UserPreferenceEditor } from "./UserPreferenceEditor";
import { UserPreferenceSummary } from "./UserPreferenceSummary";
import { UserJourneySummary } from "./UserJourneySummary";

export function AccountPreferencesClient() {
  const [profile, setProfile] = useState<UserPreferenceProfileView | null>(null);
  const [journey, setJourney] = useState<UserJourneyView | null>(null);
  const [load, setLoad] = useState(true);
  const [rebuild, setRebuild] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoad(true);
    setErr(null);
    try {
      const [p, j] = await Promise.all([fetch("/api/user-intelligence/profile", { method: "GET" }), fetch("/api/user-intelligence/journey", { method: "GET" })]);
      const pj = (await p.json()) as { ok?: boolean; profile?: UserPreferenceProfileView | null };
      const jj = (await j.json()) as { ok?: boolean; journey?: UserJourneyView | null };
      if (pj.ok) {
        setProfile(pj.profile ?? null);
      } else {
        setErr("Could not load profile");
      }
      if (jj.ok) {
        setJourney(jj.journey ?? null);
      }
    } catch {
      setErr("You may need to sign in to see saved preferences.");
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const doRebuild = async () => {
    setRebuild(true);
    setErr(null);
    try {
      const res = await fetch("/api/user-intelligence/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rebuild: true, snapshot: true }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!j.ok) {
        setErr(j.error ?? "Rebuild failed");
        return;
      }
      await loadAll();
    } catch {
      setErr("Network error");
    } finally {
      setRebuild(false);
    }
  };

  return (
    <div className="space-y-10">
      {err && <p className="text-sm text-amber-200/90">{err}</p>}
      <section>
        <h2 className="text-lg font-medium text-white">Remembered profile</h2>
        <UserPreferenceSummary profile={profile} loading={load} />
        <button
          type="button"
          onClick={doRebuild}
          disabled={rebuild}
          className="mt-4 rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
        >
          {rebuild ? "Rebuilding…" : "Rebuild from my signals"}
        </button>
      </section>
      <section>
        <h2 className="text-lg font-medium text-white">Journey</h2>
        <UserJourneySummary journey={journey} loading={load} />
      </section>
      <section>
        <h2 className="text-lg font-medium text-white">Add a preference</h2>
        <UserPreferenceEditor onSaved={loadAll} />
      </section>
    </div>
  );
}
