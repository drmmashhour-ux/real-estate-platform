"use client";

import * as React from "react";
import type {
  BrokerCapacityProfile,
  BrokerLanguageProfile,
  BrokerLeadPreference,
  BrokerProfileConfidenceLevel,
  BrokerServiceArea,
  BrokerServiceAreaPriority,
  BrokerServiceProfileStored,
  BrokerSpecialization,
  BrokerSpecializationPropertyType,
} from "@/modules/broker/profile/broker-profile.types";

const PROPERTY_TYPES: BrokerSpecializationPropertyType[] = [
  "residential",
  "condo",
  "commercial",
  "land",
  "rental",
  "bnhub",
  "luxury",
  "investor",
];

const LEAD_TYPES = ["buyer", "seller", "renter", "investor", "host", "consultation"] as const;

const PRI_AREA: BrokerServiceAreaPriority[] = ["primary", "secondary", "occasional"];

function confidenceBadge(c: BrokerProfileConfidenceLevel): string {
  if (c === "high") return "bg-emerald-500/15 text-emerald-100 border-emerald-500/35";
  if (c === "medium") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  return "bg-amber-500/15 text-amber-100 border-amber-500/35";
}

function emptyDraft(): BrokerServiceProfileStored {
  return {
    serviceAreas: [],
    specializations: [],
    leadPreferences: [],
    languages: [],
    capacity: { acceptingNewLeads: true },
    notes: null,
    adminVerifiedAt: null,
  };
}

export function BrokerServiceProfilePanel() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<BrokerServiceProfileStored>(emptyDraft);
  const [profileConfidence, setProfileConfidence] = React.useState<BrokerProfileConfidenceLevel>("low");
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/broker/service-profile", { credentials: "same-origin" });
      const j = (await res.json()) as {
        profile?: {
          serviceAreas: BrokerServiceArea[];
          specializations: BrokerSpecialization[];
          leadPreferences: BrokerLeadPreference[];
          languages: BrokerLanguageProfile[];
          capacity: BrokerCapacityProfile;
          notes?: string | null;
          profileConfidence: BrokerProfileConfidenceLevel;
          updatedAt: string;
        };
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "Unable to load service profile");
        return;
      }
      const p = j.profile;
      if (!p) {
        setErr("Invalid response");
        return;
      }
      setDraft({
        serviceAreas: p.serviceAreas ?? [],
        specializations: p.specializations ?? [],
        leadPreferences: p.leadPreferences ?? [],
        languages: p.languages ?? [],
        capacity: p.capacity ?? { acceptingNewLeads: true },
        notes: p.notes ?? null,
        adminVerifiedAt: null,
      });
      setProfileConfidence(p.profileConfidence);
      setUpdatedAt(p.updatedAt);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/broker/service-profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceAreas: draft.serviceAreas,
          specializations: draft.specializations.map((s) => ({
            ...s,
            confidenceSource: "self_declared" as const,
          })),
          leadPreferences: draft.leadPreferences,
          languages: draft.languages,
          capacity: draft.capacity,
          notes: draft.notes,
        }),
      });
      const j = (await res.json()) as { profile?: { profileConfidence: BrokerProfileConfidenceLevel; updatedAt: string }; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Save failed");
        return;
      }
      if (j.profile?.profileConfidence) setProfileConfidence(j.profile.profileConfidence);
      if (j.profile?.updatedAt) setUpdatedAt(j.profile.updatedAt);
      await load();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
        Loading service profile…
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-cyan-500/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.06),rgba(11,11,11,0.92))] p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">Routing hints</p>
          <h2 className="mt-1 text-lg font-semibold">Service areas & specialization</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Explicit fields only — used as capped, explainable signals when routing is enabled. Nothing here guarantees placement or
            payouts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${confidenceBadge(profileConfidence)}`}>
            Profile completeness: {profileConfidence}
          </span>
          {updatedAt ? (
            <span className="text-[10px] text-slate-500">Updated {new Date(updatedAt).toLocaleString()}</span>
          ) : null}
        </div>
      </div>

      {err ? <p className="mt-3 text-xs text-rose-300">{err}</p> : null}

      {/* Service areas */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-200">Service areas</p>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                serviceAreas: [...d.serviceAreas, { city: "", area: null, priorityLevel: "primary" as const }],
              }))
            }
          >
            Add area
          </button>
        </div>
        <ul className="space-y-2">
          {draft.serviceAreas.map((a, idx) => (
            <li key={idx} className="grid gap-2 rounded-lg border border-white/10 bg-black/30 p-3 sm:grid-cols-12">
              <input
                className="sm:col-span-4 rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                placeholder="City"
                value={a.city}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d) => {
                    const next = [...d.serviceAreas];
                    next[idx] = { ...next[idx], city: v };
                    return { ...d, serviceAreas: next };
                  });
                }}
              />
              <input
                className="sm:col-span-4 rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                placeholder="Area (optional)"
                value={a.area ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setDraft((d) => {
                    const next = [...d.serviceAreas];
                    next[idx] = { ...next[idx], area: v ? v : null };
                    return { ...d, serviceAreas: next };
                  });
                }}
              />
              <select
                className="sm:col-span-3 rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                value={a.priorityLevel}
                onChange={(e) => {
                  const pl = e.target.value as BrokerServiceAreaPriority;
                  setDraft((d) => {
                    const next = [...d.serviceAreas];
                    next[idx] = { ...next[idx], priorityLevel: pl };
                    return { ...d, serviceAreas: next };
                  });
                }}
              >
                {PRI_AREA.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  className="text-[11px] text-slate-500 hover:text-rose-300"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      serviceAreas: d.serviceAreas.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Specializations */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-200">Property focus (self-declared)</p>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                specializations: [
                  ...d.specializations,
                  { propertyType: "residential", confidenceSource: "self_declared", enabled: true },
                ],
              }))
            }
          >
            Add focus
          </button>
        </div>
        <ul className="space-y-2">
          {draft.specializations.map((s, idx) => (
            <li key={idx} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
              <select
                className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                value={s.propertyType}
                onChange={(e) => {
                  const propertyType = e.target.value as BrokerSpecializationPropertyType;
                  setDraft((d) => {
                    const next = [...d.specializations];
                    next[idx] = { ...next[idx], propertyType };
                    return { ...d, specializations: next };
                  });
                }}
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setDraft((d) => {
                      const next = [...d.specializations];
                      next[idx] = { ...next[idx], enabled };
                      return { ...d, specializations: next };
                    });
                  }}
                />
                Enabled
              </label>
              <button
                type="button"
                className="ml-auto text-[11px] text-slate-500 hover:text-rose-300"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    specializations: d.specializations.filter((_, i) => i !== idx),
                  }))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Lead preferences */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-200">Lead-type preferences</p>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                leadPreferences: [...d.leadPreferences, { leadType: "buyer", priorityLevel: "standard" }],
              }))
            }
          >
            Add preference
          </button>
        </div>
        <ul className="space-y-2">
          {draft.leadPreferences.map((p, idx) => (
            <li key={idx} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
              <select
                className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                value={p.leadType}
                onChange={(e) => {
                  const leadType = e.target.value as BrokerLeadPreference["leadType"];
                  setDraft((d) => {
                    const next = [...d.leadPreferences];
                    next[idx] = { ...next[idx], leadType };
                    return { ...d, leadPreferences: next };
                  });
                }}
              >
                {LEAD_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {lt}
                  </option>
                ))}
              </select>
              <select
                className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                value={p.priorityLevel}
                onChange={(e) => {
                  const priorityLevel = e.target.value as BrokerLeadPreference["priorityLevel"];
                  setDraft((d) => {
                    const next = [...d.leadPreferences];
                    next[idx] = { ...next[idx], priorityLevel };
                    return { ...d, leadPreferences: next };
                  });
                }}
              >
                <option value="preferred">preferred</option>
                <option value="standard">standard</option>
                <option value="avoid">avoid</option>
              </select>
              <button
                type="button"
                className="ml-auto text-[11px] text-slate-500 hover:text-rose-300"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    leadPreferences: d.leadPreferences.filter((_, i) => i !== idx),
                  }))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Languages */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-200">Languages</p>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                languages: [...d.languages, { code: "en", label: "English", proficiency: "fluent" }],
              }))
            }
          >
            Add language
          </button>
        </div>
        <ul className="space-y-2">
          {draft.languages.map((l, idx) => (
            <li key={idx} className="grid gap-2 rounded-lg border border-white/10 bg-black/30 p-3 sm:grid-cols-12">
              <input
                className="sm:col-span-2 rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs uppercase"
                placeholder="Code"
                value={l.code}
                onChange={(e) => {
                  const code = e.target.value.slice(0, 12).toLowerCase();
                  setDraft((d) => {
                    const next = [...d.languages];
                    next[idx] = { ...next[idx], code };
                    return { ...d, languages: next };
                  });
                }}
              />
              <input
                className="sm:col-span-5 rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                placeholder="Label"
                value={l.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setDraft((d) => {
                    const next = [...d.languages];
                    next[idx] = { ...next[idx], label };
                    return { ...d, languages: next };
                  });
                }}
              />
              <select
                className="sm:col-span-4 rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                value={l.proficiency}
                onChange={(e) => {
                  const proficiency = e.target.value as BrokerLanguageProfile["proficiency"];
                  setDraft((d) => {
                    const next = [...d.languages];
                    next[idx] = { ...next[idx], proficiency };
                    return { ...d, languages: next };
                  });
                }}
              >
                <option value="native">native</option>
                <option value="fluent">fluent</option>
                <option value="working">working</option>
              </select>
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  className="text-[11px] text-slate-500 hover:text-rose-300"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      languages: d.languages.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Capacity */}
      <div className="mt-8 rounded-lg border border-white/10 bg-black/25 p-4">
        <p className="text-xs font-semibold text-slate-200">Capacity hints</p>
        <label className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={draft.capacity.acceptingNewLeads}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                capacity: { ...d.capacity, acceptingNewLeads: e.target.checked },
              }))
            }
          />
          Accepting new leads
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-[11px] text-slate-400">
            Max active leads (optional)
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
              value={draft.capacity.maxActiveLeads ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                setDraft((d) => ({
                  ...d,
                  capacity: {
                    ...d.capacity,
                    maxActiveLeads: raw === "" ? null : Math.max(0, Math.floor(Number(raw))),
                  },
                }));
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <label>
              Preferred min active
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
                value={draft.capacity.preferredActiveRange?.min ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    capacity: {
                      ...d.capacity,
                      preferredActiveRange: {
                        min: raw === "" ? undefined : Math.max(0, Math.floor(Number(raw))),
                        max: d.capacity.preferredActiveRange?.max,
                      },
                    },
                  }));
                }}
              />
            </label>
            <label>
              Preferred max active
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
                value={draft.capacity.preferredActiveRange?.max ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    capacity: {
                      ...d.capacity,
                      preferredActiveRange: {
                        min: d.capacity.preferredActiveRange?.min,
                        max: raw === "" ? undefined : Math.max(0, Math.floor(Number(raw))),
                      },
                    },
                  }));
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <label className="mt-6 block text-xs text-slate-400">
        Notes (optional — internal routing context only)
        <textarea
          className="mt-1 min-h-[72px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200"
          value={draft.notes ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setDraft((d) => ({ ...d, notes: v.trim() ? v : null }));
          }}
          placeholder="Regions you cover best, partnerships, niche experience — human-readable; not auto-verified."
        />
      </label>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          className="rounded-lg border border-cyan-500/45 bg-cyan-500/15 px-4 py-2 text-xs font-medium text-cyan-50 hover:bg-cyan-500/25 disabled:opacity-50"
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
          onClick={() => void load()}
        >
          Reload
        </button>
      </div>
    </section>
  );
}
