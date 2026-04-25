"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Target,
  Users,
  X,
} from "lucide-react";
import { DEMO_TRAINING_STEPS } from "@/components/demo/demo-training-data";
import { LeciSurfaceBootstrap } from "@/components/leci/LeciSurfaceBootstrap";
import { FIELD_DAILY_TARGETS } from "./daily-targets";
import { FIELD_MOCK_LEADS, type FieldBrokerLead } from "./field-leads-mock";
import {
  addFieldVisitLog,
  fieldPerformanceStats,
  loadFieldVisitLogs,
  todayFieldProgress,
  type FieldOutcome,
  type FieldVisitLog,
} from "./field-demo-storage";

const OUTCOMES: { value: FieldOutcome; label: string }[] = [
  { value: "demo_done", label: "Démo effectuée" },
  { value: "interested", label: "Intéressé" },
  { value: "not_interested", label: "Pas intéressé" },
  { value: "follow_up", label: "Relance" },
];

export function FieldDemoClient() {
  const [logs, setLogs] = useState<FieldVisitLog[]>([]);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [logLeadId, setLogLeadId] = useState(FIELD_MOCK_LEADS[0]?.id ?? "");
  const [logOutcome, setLogOutcome] = useState<FieldOutcome>("demo_done");
  const [logNote, setLogNote] = useState("");

  const refresh = useCallback(() => setLogs(loadFieldVisitLogs()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const today = useMemo(() => todayFieldProgress(logs), [logs]);
  const perf = useMemo(() => fieldPerformanceStats(logs, 7), [logs]);

  const selectedLead = useMemo(
    () => FIELD_MOCK_LEADS.find((l) => l.id === logLeadId) ?? FIELD_MOCK_LEADS[0],
    [logLeadId],
  );

  const submitLog = useCallback(() => {
    if (!selectedLead) return;
    addFieldVisitLog({
      leadId: selectedLead.id,
      brokerName: selectedLead.brokerName,
      outcome: logOutcome,
      note: logNote,
    });
    setLogNote("");
    refresh();
  }, [selectedLead, logOutcome, logNote, refresh]);

  const visitProgress = Math.min(100, (today.uniqueVisits / FIELD_DAILY_TARGETS.brokerVisits) * 100);
  const demoProgress = Math.min(100, (today.demosDone / FIELD_DAILY_TARGETS.demos) * 100);

  return (
    <div className="min-h-screen bg-[#050505] pb-24 text-white">
      <LeciSurfaceBootstrap
        userRole="field_agent"
        draftSummary="Équipe démo terrain — visites courtiers LECIPM"
        sectionLabel="Field dashboard"
        focusTopic="field_demo"
      />

      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
            <Users className="h-3.5 w-3.5" />
            Field Demo Team
          </div>
          <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            Terrain <span className="text-[#D4AF37]">LECIPM</span>
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Leads à visiter, script pas à pas, support LECI (bulle en bas à droite), journal de résultats et objectifs du
            jour.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/marketing/demo-training"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              Formation démo complète →
            </Link>
            <Link
              href="/marketing/objections"
              className="rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-[#D4AF37]/20"
            >
              Objections →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-3 lg:px-6">
        {/* Leads */}
        <section className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
            Leads à visiter
          </h2>
          <div className="mt-4 space-y-3">
            {FIELD_MOCK_LEADS.map((lead) => (
              <LeadRow key={lead.id} lead={lead} onStartDemo={() => setDemoOpen(true)} />
            ))}
          </div>
        </section>

        {/* Daily + performance */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              Objectifs du jour
            </h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li>
                <div className="flex justify-between text-zinc-400">
                  <span>Visiter {FIELD_DAILY_TARGETS.brokerVisits} courtiers</span>
                  <span className="text-zinc-200">
                    {today.uniqueVisits}/{FIELD_DAILY_TARGETS.brokerVisits}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-500/80 transition-all" style={{ width: `${visitProgress}%` }} />
                </div>
              </li>
              <li>
                <div className="flex justify-between text-zinc-400">
                  <span>Lancer {FIELD_DAILY_TARGETS.demos} démos</span>
                  <span className="text-zinc-200">
                    {today.demosDone}/{FIELD_DAILY_TARGETS.demos}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#D4AF37]/80 transition-all" style={{ width: `${demoProgress}%` }} />
                </div>
              </li>
              <li className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-zinc-400">
                <span className="font-medium text-zinc-300">Relances notées aujourd’hui : </span>
                {today.followUps}
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              <BarChart3 className="h-3.5 w-3.5 text-[#D4AF37]" />
              Performance (7 jours)
            </h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-zinc-500">Démos complétées</dt>
                <dd className="font-bold text-white">{perf.demosDone}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-zinc-500">Conversions (intéressés)</dt>
                <dd className="font-bold text-emerald-300">{perf.conversions}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Activité (entrées)</dt>
                <dd className="font-bold text-zinc-200">{perf.activity}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {/* Demo script + start */}
      <section className="border-t border-white/10 bg-white/[0.02] py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Script démo terrain</h2>
              <p className="mt-1 text-sm text-zinc-500">Pas à pas, clics et phrases — même flux que la formation.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDemoStep(0);
                setDemoOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-5 py-3 text-sm font-bold text-amber-100 hover:bg-[#D4AF37]/25"
            >
              <Play className="h-4 w-4" />
              Start Demo
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#080808] p-5">
            <h3 className="text-sm font-bold text-[#D4AF37]">LECI — support live</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Ouvre l’assistant <strong className="text-zinc-200">LECI</strong> (icône message en bas à droite). En rendez-vous :
              demande quoi dire, réponses aux objections, ou simplification d’une clause.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
              <li className="rounded-lg border border-white/10 px-2 py-1">« Donne-moi 2 phrases pour l’accroche »</li>
              <li className="rounded-lg border border-white/10 px-2 py-1">« Il dit qu’il a déjà ses outils »</li>
              <li className="rounded-lg border border-white/10 px-2 py-1">« Explique garantie légale simplement »</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Result logging */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Journal après rencontre
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-zinc-500">Courtier</label>
            <select
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white"
              value={logLeadId}
              onChange={(e) => setLogLeadId(e.target.value)}
            >
              {FIELD_MOCK_LEADS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.brokerName}
                </option>
              ))}
            </select>

            <fieldset className="mt-4">
              <legend className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Résultat</legend>
              <div className="mt-2 space-y-2">
                {OUTCOMES.map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="radio"
                      name="outcome"
                      value={o.value}
                      checked={logOutcome === o.value}
                      onChange={() => setLogOutcome(o.value)}
                      className="border-white/30 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-zinc-500">Note (optionnel)</label>
            <textarea
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              rows={3}
              placeholder="Prochaine action, objection principale…"
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
            />
            <button
              type="button"
              onClick={submitLog}
              className="mt-4 w-full rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-sm font-bold text-emerald-100 hover:bg-emerald-500/25"
            >
              Enregistrer le résultat
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-zinc-300">Dernières entrées</h3>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
              {logs.length === 0 ? (
                <li className="text-zinc-500">Aucune entrée — loggue ta première visite.</li>
              ) : (
                logs.slice(0, 25).map((l) => (
                  <li key={l.id} className="rounded-lg border border-white/5 bg-black/30 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-medium text-zinc-200">{l.brokerName}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[#D4AF37]">
                        {l.outcome.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">{new Date(l.at).toLocaleString("fr-CA")}</p>
                    {l.note ? <p className="mt-1 text-xs text-zinc-400">{l.note}</p> : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Demo modal */}
      {demoOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={() => setDemoOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[#0a0a0a] shadow-2xl"
            role="dialog"
            aria-labelledby="field-demo-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 id="field-demo-title" className="text-lg font-black text-white">
                Démo — étape {demoStep + 1}/{DEMO_TRAINING_STEPS.length}
              </h2>
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {(() => {
                const s = DEMO_TRAINING_STEPS[demoStep];
                if (!s) return null;
                return (
                  <div className="space-y-3 text-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#D4AF37]">{s.title}</p>
                    <p className="leading-relaxed text-zinc-200">{s.script}</p>
                    {s.show ? (
                      <p className="text-zinc-500">
                        <span className="font-semibold text-zinc-400">À l’écran : </span>
                        {s.show}
                      </p>
                    ) : null}
                    {s.action ? (
                      <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-emerald-100/90">
                        <span className="font-semibold">Clic / geste : </span>
                        {s.action}
                      </p>
                    ) : null}
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-2 border-t border-white/10 p-4">
              <button
                type="button"
                disabled={demoStep === 0}
                onClick={() => setDemoStep((i) => Math.max(0, i - 1))}
                className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-zinc-300 disabled:opacity-30"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() =>
                  demoStep >= DEMO_TRAINING_STEPS.length - 1 ? setDemoOpen(false) : setDemoStep((i) => i + 1)
                }
                className="flex-1 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 py-2.5 text-sm font-bold text-amber-100"
              >
                {demoStep >= DEMO_TRAINING_STEPS.length - 1 ? "Terminer" : "Suivant"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LeadRow({ lead, onStartDemo }: { lead: FieldBrokerLead; onStartDemo: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-white">{lead.brokerName}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
          <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          {lead.phone}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {lead.location}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            lead.status === "qualifié"
              ? "bg-emerald-500/20 text-emerald-200"
              : lead.status === "relance"
                ? "bg-amber-500/20 text-amber-200"
                : lead.status === "perdu"
                  ? "bg-rose-500/20 text-rose-200"
                  : "bg-white/10 text-zinc-300"
          }`}
        >
          {lead.status}
        </span>
        <button
          type="button"
          onClick={onStartDemo}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-[#D4AF37]/20"
        >
          <Play className="h-3.5 w-3.5" />
          Start Demo
        </button>
        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600">
          <MessageCircle className="h-3 w-3" />
          LECI
        </span>
      </div>
    </div>
  );
}
