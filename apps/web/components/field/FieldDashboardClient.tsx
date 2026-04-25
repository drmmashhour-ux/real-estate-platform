"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  MapPin,
  Mic,
  Phone,
  Play,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { LeciSurfaceBootstrap } from "@/components/leci/LeciSurfaceBootstrap";
import { DEMO_TRAINING_STEPS } from "@/components/demo/demo-training-data";
import { FIELD_DAILY_GOALS } from "./field-constants";
import {
  appendLog,
  deleteLead,
  loadFieldStore,
  newLeadId,
  newLogId,
  upsertLead,
} from "./field-storage";
import type { FieldLead, FieldLeadStatus, FieldStore, VisitOutcome } from "./field-types";

const STATUS_LABEL: Record<FieldLeadStatus, string> = {
  to_visit: "À visiter",
  scheduled: "Rencontre prévue",
  demo_done: "Démo faite",
  interested: "Intéressé",
  not_interested: "Pas intéressé",
  follow_up: "Suivi",
};

const OUTCOME_TO_STATUS: Record<VisitOutcome, FieldLeadStatus> = {
  demo_done: "demo_done",
  interested: "interested",
  not_interested: "not_interested",
  follow_up: "follow_up",
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function isInLastDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return t >= cutoff;
}

type Props = {
  agentUserId: string;
  agentEmail: string;
};

export function FieldDashboardClient({ agentUserId, agentEmail }: Props) {
  const [store, setStore] = useState<FieldStore>({ leads: [], logs: [] });
  const [hydrated, setHydrated] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [logLeadId, setLogLeadId] = useState("");
  const [logOutcome, setLogOutcome] = useState<VisitOutcome>("demo_done");
  const [logNote, setLogNote] = useState("");

  useEffect(() => {
    setStore(loadFieldStore(agentUserId));
    setHydrated(true);
  }, [agentUserId]);

  const today = useMemo(() => startOfDay(new Date()), []);

  const todayStats = useMemo(() => {
    const logsToday = store.logs.filter((l) => isSameDay(new Date(l.at), today));
    const uniqueLeadsToday = new Set(logsToday.map((l) => l.leadId)).size;
    const demosToday = logsToday.filter((l) => l.outcome === "demo_done").length;
    const followUpsToday = logsToday.filter((l) => l.outcome === "follow_up").length;
    return { uniqueLeadsToday, demosToday, followUpsToday, logsToday: logsToday.length };
  }, [store.logs, today]);

  const weekStats = useMemo(() => {
    const recent = store.logs.filter((l) => isInLastDays(l.at, 7));
    return {
      demos: recent.filter((l) => l.outcome === "demo_done").length,
      conversions: recent.filter((l) => l.outcome === "interested").length,
      touches: recent.length,
    };
  }, [store.logs]);

  const addLead = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    const lead: FieldLead = {
      id: newLeadId(),
      brokerName: name,
      phone: newPhone.trim() || "—",
      location: newLocation.trim() || "—",
      status: "to_visit",
      updatedAt: new Date().toISOString(),
    };
    setStore((prev) => upsertLead(agentUserId, prev, lead));
    setNewName("");
    setNewPhone("");
    setNewLocation("");
  }, [agentUserId, newLocation, newName, newPhone]);

  const submitLog = useCallback(() => {
    if (!logLeadId) return;
    setStore((prev) => {
      const lead = prev.leads.find((l) => l.id === logLeadId);
      if (!lead) return prev;
      const log = {
        id: newLogId(),
        leadId: logLeadId,
        brokerNameSnapshot: lead.brokerName,
        at: new Date().toISOString(),
        outcome: logOutcome,
        note: logNote.trim() || undefined,
      };
      return appendLog(agentUserId, prev, log, { leadId: logLeadId, status: OUTCOME_TO_STATUS[logOutcome] });
    });
    setLogNote("");
  }, [agentUserId, logLeadId, logNote, logOutcome]);

  const removeLead = useCallback(
    (id: string) => {
      if (!confirm("Retirer ce courtier et ses journaux locaux ?")) return;
      setStore((prev) => deleteLead(agentUserId, prev, id));
      setLogLeadId((cur) => (cur === id ? "" : cur));
    },
    [agentUserId],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        Chargement du terrain…
      </div>
    );
  }

  const step = DEMO_TRAINING_STEPS[demoStep] ?? DEMO_TRAINING_STEPS[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <LeciSurfaceBootstrap
        userRole="field_agent"
        draftSummary={`Équipe démo terrain · ${agentEmail}`}
        focusTopic="field_demo"
      />

      <header className="border-b border-white/10 bg-black/60 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">LECIPM · Field</p>
          <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl">
            Demo <span className="text-[#D4AF37]">Team</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Pistes à visiter, script pas à pas, suivi des rencontres et objectifs du jour. LECI (coin bas-droite) pour
            objections et formulation en direct.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/marketing/demo-training"
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              Script complet formation →
            </Link>
            <Link
              href="/marketing/objections"
              className="rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-[#D4AF37]/20"
            >
              Objections →
            </Link>
            <Link
              href="/drafts/turbo"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20"
            >
              Ouvrir Turbo (démo)
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        {/* Daily tasks */}
        <section>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            <CalendarCheck className="h-4 w-4 text-[#D4AF37]" />
            Tâches du jour
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Visiter des courtiers",
                current: todayStats.uniqueLeadsToday,
                target: FIELD_DAILY_GOALS.brokerVisits,
                hint: "Courtiers touchés aujourd’hui (logs)",
              },
              {
                label: "Lancer des démos",
                current: todayStats.demosToday,
                target: FIELD_DAILY_GOALS.demos,
                hint: "Compteur « Démo faite »",
              },
              {
                label: "Suivis",
                current: todayStats.followUpsToday,
                target: FIELD_DAILY_GOALS.followUps,
                hint: "Relances enregistrées",
              },
            ].map((g) => (
              <div key={g.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-zinc-200">{g.label}</p>
                <p className="mt-1 text-[11px] text-zinc-500">{g.hint}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D4AF37]/80 transition-all"
                    style={{ width: `${Math.min(100, (g.current / g.target) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 font-mono text-sm text-[#D4AF37]">
                  {g.current} / {g.target}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Performance */}
        <section>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
            Performance (7 jours)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-bold uppercase text-zinc-500">Démos enregistrées</p>
              <p className="mt-2 text-3xl font-black text-white">{weekStats.demos}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-[11px] font-bold uppercase text-emerald-400/90">Intéressés</p>
              <p className="mt-2 text-3xl font-black text-emerald-200">{weekStats.conversions}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-bold uppercase text-zinc-500">Activité (entrées)</p>
              <p className="mt-2 text-3xl font-black text-zinc-200">{weekStats.touches}</p>
            </div>
          </div>
        </section>

        {/* Demo mode */}
        <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-[#D4AF37]" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#D4AF37]">Mode démo</h2>
                <p className="text-xs text-zinc-500">Script pas à pas · quoi dire · où cliquer</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDemoOpen((v) => !v);
                setDemoStep(0);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-4 py-2.5 text-sm font-bold text-amber-100 hover:bg-[#D4AF37]/25"
            >
              <Play className="h-4 w-4" />
              {demoOpen ? "Fermer" : "Start Demo"}
            </button>
          </div>

          {demoOpen ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-500">
                  Étape {demoStep + 1} / {DEMO_TRAINING_STEPS.length}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={demoStep === 0}
                    onClick={() => setDemoStep((s) => Math.max(0, s - 1))}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs disabled:opacity-30"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    disabled={demoStep >= DEMO_TRAINING_STEPS.length - 1}
                    onClick={() => setDemoStep((s) => Math.min(DEMO_TRAINING_STEPS.length - 1, s + 1))}
                    className="rounded-lg border border-[#D4AF37]/40 px-2 py-1 text-xs text-amber-100 disabled:opacity-30"
                  >
                    Suivant
                  </button>
                </div>
              </div>
              <h3 className="mt-3 text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">{step.script}</p>
              {step.show ? (
                <p className="mt-3 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-400">À l’écran :</span> {step.show}
                </p>
              ) : null}
              {step.action ? (
                <p className="mt-1 text-xs text-emerald-300/90">
                  <span className="font-semibold">Clic / geste :</span> {step.action}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Leads */}
        <section>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            <Target className="h-4 w-4 text-[#D4AF37]" />
            Pistes à visiter
          </h2>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-bold uppercase text-zinc-500">Ajouter un courtier</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <input
                className="min-w-[160px] flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm"
                placeholder="Nom du courtier / agence"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="min-w-[140px] flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm"
                placeholder="Téléphone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <input
                className="min-w-[140px] flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm"
                placeholder="Ville / région"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
              <button
                type="button"
                onClick={addLead}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-2 text-sm font-semibold text-amber-100"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/40 text-[11px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Courtier</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Lieu</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {store.leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Aucune piste — ajoute un courtier ci-dessus.
                    </td>
                  </tr>
                ) : (
                  store.leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-zinc-100">{lead.brokerName}</td>
                      <td className="px-4 py-3 text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {lead.location}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                          {STATUS_LABEL[lead.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeLead(lead.id)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/20 hover:text-rose-300"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Result logging */}
        <section>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            <ClipboardList className="h-4 w-4 text-[#D4AF37]" />
            Journal après rencontre
          </h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-500">Courtier</label>
                <select
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm"
                  value={logLeadId}
                  onChange={(e) => setLogLeadId(e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  {store.leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.brokerName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-500">Résultat</label>
                <select
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm"
                  value={logOutcome}
                  onChange={(e) => setLogOutcome(e.target.value as VisitOutcome)}
                >
                  <option value="demo_done">Démo faite</option>
                  <option value="interested">Intéressé</option>
                  <option value="not_interested">Pas intéressé</option>
                  <option value="follow_up">Suivi à planifier</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[11px] font-bold uppercase text-zinc-500">Note (optionnel)</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm"
                rows={2}
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="Prochaine action, objection principale…"
              />
            </div>
            <button
              type="button"
              onClick={submitLog}
              disabled={!logLeadId}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-bold text-emerald-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
              Enregistrer le résultat
            </button>
          </div>

          <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/30">
            {store.logs.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Aucun journal pour l’instant.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {store.logs.slice(0, 40).map((log) => (
                  <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span className="font-medium text-zinc-200">{log.brokerNameSnapshot}</span>
                    <span className="text-xs text-zinc-500">{new Date(log.at).toLocaleString()}</span>
                    <span className="w-full text-xs text-[#D4AF37] sm:w-auto">
                      {log.outcome === "demo_done"
                        ? "Démo faite"
                        : log.outcome === "interested"
                          ? "Intéressé"
                          : log.outcome === "not_interested"
                            ? "Pas intéressé"
                            : "Suivi"}
                    </span>
                    {log.note ? <span className="w-full text-xs text-zinc-500">{log.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* LECI callout */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-sm font-bold text-white">LECI — assisteur sur le terrain</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Ouvre l’assistant (bouton doré en bas à droite) pour demander quoi dire, reformuler une objection ou vérifier
            un risque — la validation finale reste humaine.
          </p>
        </section>
      </div>
    </div>
  );
}
