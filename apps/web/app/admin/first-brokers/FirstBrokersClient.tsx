"use client";

import { useCallback, useEffect, useState } from "react";

import {
  FIRST_10_DM_TEMPLATE,
  FIRST_10_TARGET,
  type FirstQuebecBrokerRow,
  type FirstQuebecSummary,
} from "@/modules/brokers/first-ten-quebec.types";

const STAGES: FirstQuebecBrokerRow["stage"][] = [
  "found",
  "contacted",
  "demo_booked",
  "demo_done",
  "trial",
  "paid",
];

function firstName(full: string): string {
  const t = full.trim();
  if (!t) return "Prénom";
  return t.split(/\s+/)[0] ?? "Prénom";
}

function dmFromTemplate(name: string) {
  return FIRST_10_DM_TEMPLATE.replace("[Prénom]", firstName(name));
}

type ApiList = { rows: FirstQuebecBrokerRow[]; summary: FirstQuebecSummary };

export function FirstBrokersClient() {
  const [data, setData] = useState<ApiList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "montreal" as "montreal" | "laval",
    source: "facebook" as "facebook" | "instagram" | "google",
    targetIndependent: true,
    targetUnderFiveYears: true,
    targetSocialActive: true,
    targetSmallTeam: true,
    activityScore: 3,
    responseLevel: "none" as FirstQuebecBrokerRow["responseLevel"],
    notes: "",
  });

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/first-ten-quebec-brokers", { cache: "no-store" });
    if (res.status === 403) {
      setError("Accès refusé (admin requis).");
      setData(null);
      return;
    }
    if (!res.ok) {
      setError("Chargement impossible.");
      return;
    }
    const j = (await res.json()) as ApiList;
    setData(j);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/first-ten-quebec-brokers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Ajout refusé.");
      return;
    }
    setForm((f) => ({ ...f, name: "", phone: "", email: "", notes: "" }));
    void load();
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setSaving(true);
    const res = await fetch("/api/admin/first-ten-quebec-brokers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setSaving(false);
    if (!res.ok) return;
    const j = (await res.json()) as { row: FirstQuebecBrokerRow; summary: FirstQuebecSummary };
    setData((d) =>
      d
        ? {
            rows: d.rows.map((r) => (r.id === j.row.id ? j.row : r)),
            summary: j.summary,
          }
        : { rows: [j.row], summary: j.summary },
    );
  };

  const markContacted = async (id: string) => {
    setSaving(true);
    const res = await fetch("/api/admin/first-ten-quebec-brokers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_contacted", id }),
    });
    setSaving(false);
    if (res.ok) void load();
  };

  const scheduleFollowup = async (id: string) => {
    setSaving(true);
    const res = await fetch("/api/admin/first-ten-quebec-brokers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "schedule_followup", id, days: 2 }),
    });
    setSaving(false);
    if (res.ok) void load();
  };

  const copyDm = async (name: string) => {
    try {
      await navigator.clipboard.writeText(dmFromTemplate(name));
    } catch {
      /* noop */
    }
  };

  const cityLabel = (c: string) => (c === "montreal" ? "Montréal" : "Laval");
  const sourceLabel = (s: string) =>
    s === "facebook" ? "Facebook" : s === "instagram" ? "Instagram" : "Google";

  if (loading) {
    return <p className="p-8 text-sm text-zinc-400">Chargement…</p>;
  }

  const rows = data?.rows ?? [];
  const summary = data?.summary;
  const toward10 = Math.min(rows.length, FIRST_10_TARGET);
  const progressPct = Math.round((toward10 / FIRST_10_TARGET) * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 text-zinc-100">
      <header className="space-y-2 border-b border-zinc-800 pb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/90">LECIPM GTM</p>
        <h1 className="text-2xl font-semibold">First 10 — courtiers (Montréal &amp; Laval)</h1>
        <p className="max-w-3xl text-sm text-zinc-400">
          Liste manuelle, pipeline et objectifs journaliers. Ne pas prétendre des avantages légaux ou OACIQ sans preuve
          — positionnement assistif uniquement.
        </p>
      </header>

      {error && <p className="rounded-lg border border-rose-800/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-semibold text-amber-200/90">Critères cibles (ICP)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            <li>Brokers indépendants, petites équipes (1–5), expérience ciblée (cocher &lt; 5 ans)</li>
            <li>Actifs sur les réseaux (indicateur manuel + score d&apos;activité)</li>
            <li>
              <span className="text-cyan-300/90">Montréal</span> &amp;{" "}
              <span className="text-cyan-300/90">Laval</span> en priorité
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
          <h2 className="text-sm font-semibold text-amber-200/90">Objectifs quotidiens (guide)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>→ Ajouter ~5 courtiers / jour (CRM)</li>
            <li>→ Contacter ~10 / jour</li>
            <li>→ Réserver 2–3 démos / jour</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dans la liste" value={String(summary?.total ?? 0)} sub={`Objectif: ${FIRST_10_TARGET} (Mtl/Laval)`} />
        <StatCard label="Démos réservées" value={String(summary?.demosBooked ?? 0)} sub="Stage: demo_booked" />
        <StatCard
          label="Pipeline post-démo"
          value={String(summary?.conversionsPipeline ?? 0)}
          sub="demo_done + trial"
        />
        <StatCard label="Payant" value={String(summary?.paid ?? 0)} sub="Stage: paid" />
      </section>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Progrès vers {FIRST_10_TARGET}</span>
          <span>
            {toward10}/{FIRST_10_TARGET}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-amber-500/80 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/30 p-4">
        <h2 className="text-sm font-semibold">Pipeline (volume par étape)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-300"
            >
              {s.replace(/_/g, " ")}: {summary?.byStage?.[s] ?? 0}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-900/30 bg-cyan-950/10 p-4">
        <h2 className="text-sm font-semibold text-cyan-200/90">Message court (DM)</h2>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-black/40 p-3 font-sans text-xs text-zinc-300">
          {FIRST_10_DM_TEMPLATE}
        </pre>
        <p className="mt-1 text-[11px] text-zinc-500">Remplacer [Prénom] — bouton &quot;Copier DM&quot; sur chaque ligne.</p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Ajouter un courtier</h2>
        <form onSubmit={onAdd} className="grid gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:grid-cols-2">
          <label className="text-xs text-zinc-500">
            Nom
            <input
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="text-xs text-zinc-500">
            Téléphone
            <input
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </label>
          <label className="text-xs text-zinc-500">
            Courriel
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="text-xs text-zinc-500">
            Ville
            <select
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value as typeof form.city }))}
            >
              <option value="montreal">Montréal</option>
              <option value="laval">Laval</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Source
            <select
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as typeof form.source }))}
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="google">Google / Maps</option>
            </select>
          </label>
          <div className="text-xs text-zinc-500 sm:col-span-2">
            <p className="mb-1">Cible (cochez)</p>
            <div className="flex flex-wrap gap-3 text-zinc-300">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.targetIndependent}
                  onChange={(e) => setForm((f) => ({ ...f, targetIndependent: e.target.checked }))}
                />
                Indépendant
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.targetUnderFiveYears}
                  onChange={(e) => setForm((f) => ({ ...f, targetUnderFiveYears: e.target.checked }))}
                />
                &lt; 5 ans
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.targetSocialActive}
                  onChange={(e) => setForm((f) => ({ ...f, targetSocialActive: e.target.checked }))}
                />
                Actif sur les réseaux
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.targetSmallTeam}
                  onChange={(e) => setForm((f) => ({ ...f, targetSmallTeam: e.target.checked }))}
                />
                Petite équipe
              </label>
            </div>
          </div>
          <label className="text-xs text-zinc-500">
            Activité (1–5)
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
              value={form.activityScore}
              onChange={(e) => setForm((f) => ({ ...f, activityScore: Number(e.target.value) || 3 }))}
            />
          </label>
          <label className="text-xs text-zinc-500">
            Réponse
            <select
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
              value={form.responseLevel}
              onChange={(e) => setForm((f) => ({ ...f, responseLevel: e.target.value as typeof form.responseLevel }))}
            >
              <option value="none">Aucune</option>
              <option value="low">Faible</option>
              <option value="med">Moyenne</option>
              <option value="high">Élevée</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500 sm:col-span-2">
            Notes
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-2 text-sm text-amber-100 hover:bg-amber-950/60 disabled:opacity-50"
            >
              {saving ? "…" : "Ajouter à la cible"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Liste cible + suivi (tri: activité, puis réponse)</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="p-2">Nom</th>
                <th className="p-2">Géo</th>
                <th className="p-2">Source</th>
                <th className="p-2">ICP</th>
                <th className="p-2">Act./rép.</th>
                <th className="p-2">Étape</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 text-zinc-300">
                  <td className="p-2 font-medium text-white">
                    {r.name}
                    <div className="text-[11px] font-normal text-zinc-500">{r.email || "—"}</div>
                  </td>
                  <td className="p-2">
                    <span
                      className={
                        r.city === "montreal"
                          ? "rounded bg-cyan-950/50 px-1.5 text-cyan-200"
                          : "rounded bg-violet-950/50 px-1.5 text-violet-200"
                      }
                    >
                      {cityLabel(r.city)}
                    </span>
                  </td>
                  <td className="p-2 text-xs">{sourceLabel(r.source)}</td>
                  <td className="p-2 text-[11px] text-zinc-500">
                    {[r.targetIndependent && "indép.", r.targetUnderFiveYears && "<5a", r.targetSocialActive && "social", r.targetSmallTeam && "p.équipe"]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td className="p-2 font-mono text-xs text-zinc-400">
                    {r.activityScore} / {r.responseLevel}
                  </td>
                  <td className="p-2">
                    <select
                      className="rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5 text-xs"
                      value={r.stage}
                      onChange={(e) => void patch(r.id, { stage: e.target.value as FirstQuebecBrokerRow["stage"] })}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {r.phone ? (
                        <a
                          className="rounded border border-zinc-600 px-2 py-0.5 text-[11px] text-zinc-200 hover:border-amber-500/50"
                          href={`tel:${r.phone.replace(/\s/g, "")}`}
                        >
                          Appeler
                        </a>
                      ) : null}
                      {r.email ? (
                        <a
                          className="rounded border border-zinc-600 px-2 py-0.5 text-[11px] text-zinc-200 hover:border-amber-500/50"
                          href={`mailto:${encodeURIComponent(r.email)}`}
                        >
                          Courriel
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className="rounded border border-zinc-600 px-2 py-0.5 text-[11px] text-zinc-200 hover:border-amber-500/50"
                        onClick={() => void copyDm(r.name)}
                      >
                        Copier DM
                      </button>
                      <button
                        type="button"
                        className="rounded border border-emerald-800/50 px-2 py-0.5 text-[11px] text-emerald-200/90"
                        onClick={() => void markContacted(r.id)}
                        disabled={saving}
                      >
                        Marquer contacté
                      </button>
                      <button
                        type="button"
                        className="rounded border border-amber-800/50 px-2 py-0.5 text-[11px] text-amber-200/80"
                        onClick={() => void scheduleFollowup(r.id)}
                        disabled={saving}
                      >
                        Relance +2j
                      </button>
                    </div>
                    {r.nextFollowUpAt && (
                      <p className="mt-1 text-[10px] text-zinc-500">Relance: {new Date(r.nextFollowUpAt).toLocaleString()}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="mt-2 text-sm text-zinc-500">Aucun courtier — ajoutez la première cible.</p>}
      </section>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-3">
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-2xl text-zinc-100">{value}</p>
      <p className="text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}
