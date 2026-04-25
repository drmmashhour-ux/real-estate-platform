"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DAY1_SIMULATION_NODES,
  KEY_LESSONS,
  defaultChoiceId,
  type ChoiceOption,
  type SimNode,
} from "@/modules/field/field-day1-simulation.data";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles, XCircle, Minus, AlertCircle, RotateCcw, Play } from "lucide-react";

type Selections = Record<string, string>;

type FeedItem = {
  id: string;
  time: string;
  title: string;
  outcomeLabel: string;
  body: { role: "broker" | "agent" | "sys"; text: string }[];
};

function outcomeStyle(o: string) {
  switch (o) {
    case "success":
      return "text-emerald-300 border-emerald-500/30 bg-emerald-500/5";
    case "lost":
    case "weak":
      return "text-rose-200 border-rose-500/30 bg-rose-500/5";
    case "neutral":
      return "text-amber-200 border-amber-500/30 bg-amber-500/5";
    case "info":
      return "text-sky-200 border-sky-500/30 bg-sky-500/5";
    default:
      return "text-zinc-200 border-zinc-700 bg-zinc-900/50";
  }
}

function pickIcon(outcome: string) {
  if (outcome === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (outcome === "lost" || outcome === "weak") return <XCircle className="h-4 w-4 text-rose-400" />;
  if (outcome === "neutral") return <Minus className="h-4 w-4 text-amber-300" />;
  return <AlertCircle className="h-4 w-4 text-zinc-400" />;
}

function feedFromChoice(node: SimNode & { type: "choice" }, opt: ChoiceOption): FeedItem {
  return {
    id: `${node.id}-${opt.id}`,
    time: node.timeLabel,
    title: node.blockTitle,
    outcomeLabel: opt.outcomeLabel,
    body: [
      { role: "broker", text: node.brokerLine },
      { role: "agent", text: opt.agentLine },
      {
        role: "sys",
        text: `Résultat: ${opt.outcomeLabel}\n\n${opt.feedbackLines.map((l) => `· ${l}`).join("\n")}`,
      },
    ],
  };
}

function feedFromNarrative(node: Extract<SimNode, { type: "narrative" }>): FeedItem {
  const parts: { role: "broker" | "agent" | "sys"; text: string }[] = [];
  if (node.brokerLine) parts.push({ role: "broker", text: node.brokerLine });
  if (node.agentLine) parts.push({ role: "agent", text: node.agentLine });
  parts.push({
    role: "sys",
    text: `Résultat: ${node.outcomeLabel}\n\n${node.feedbackLines.map((l) => `· ${l}`).join("\n")}`,
  });
  return {
    id: node.id,
    time: node.timeLabel,
    title: node.blockTitle,
    outcomeLabel: node.outcomeLabel,
    body: parts,
  };
}

function buildCoaching(selections: Selections) {
  let overExplain = 0;
  let noDemo = 0;
  let noQuestions = 0;
  let bookFast = 0;
  let scriptBrief = 0;
  for (const node of DAY1_SIMULATION_NODES) {
    if (node.type !== "choice") continue;
    const id = selections[node.id];
    const opt = node.options.find((o) => o.id === id);
    if (!opt) continue;
    for (const t of opt.tags) {
      if (t.mistake === "over_explain") overExplain++;
      if (t.mistake === "no_demo_book") noDemo++;
      if (t.mistake === "no_questions") noQuestions++;
      if (t.win === "book_demo_fast") bookFast++;
      if (t.win === "script_bref") scriptBrief++;
    }
  }
  const biggestMistake =
    overExplain >= 1
      ? { en: "Explaining too much", fr: "Trop t’expliquer au lieu d’enchaîner sur un créneau concret (démo, date/heure)." }
      : noDemo >= 1
        ? { en: "Not booking the demo first", fr: "Laisser repartir avec « envoie l’info » sans ancrer un rendez-vous." }
        : noQuestions >= 1
          ? { en: "Talking instead of asking", fr: "Quand c’est calme côté courtier, poser 1 question plutôt que de remplir le vide en parlant." }
          : { en: "Clarity and next step", fr: "Recadrer: vitesse, calendrier, preuve courte — puis prochaine étape." };

  const bestMove = bookFast
    ? { en: "Booking the demo fast", fr: "Ancre date + heure tout de suite (avant le PDF et le long discours)." }
    : scriptBrief
      ? { en: "Short hook then calendar", fr: "Rester bref, proposer 10 min calibrées, puis cadrer l’horaire." }
      : { en: "Own the next step", fr: "Garder la main sur l’essai, le dossier, ou le prochain rendez-vous." };
  return { biggestMistake, bestMove, overExplain, bookFast };
}

export function FieldDay1SimulationClient() {
  const [selections, setSelections] = useState<Selections>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const choiceOnly = useMemo(() => DAY1_SIMULATION_NODES.filter((n) => n.type === "choice"), []);
  const choiceCount = choiceOnly.length;

  const doneCount = useMemo(
    () => choiceOnly.filter((n) => selections[n.id]).length,
    [selections, choiceOnly],
  );

  const allChoicesDone = doneCount === choiceCount && choiceCount > 0;

  const playCanon = useCallback(() => {
    const newSelections: Selections = {};
    const newFeed: FeedItem[] = [];
    for (const node of DAY1_SIMULATION_NODES) {
      if (node.type === "choice") {
        const id = defaultChoiceId(node);
        newSelections[node.id] = id;
        const opt = node.options.find((o) => o.id === id)!;
        newFeed.push(feedFromChoice(node, opt));
      } else if (node.type === "narrative") {
        newFeed.push(feedFromNarrative(node));
      }
    }
    setSelections(newSelections);
    setFeed(newFeed);
    setActiveIdx(DAY1_SIMULATION_NODES.length - 1);
  }, []);

  const resetDay = useCallback(() => {
    setSelections({});
    setFeed([]);
    setActiveIdx(0);
  }, []);

  const applyChoice = useCallback(
    (node: SimNode & { type: "choice" }, opt: ChoiceOption) => {
      setSelections((s) => ({ ...s, [node.id]: opt.id }));
      setFeed((f) => [...f, feedFromChoice(node, opt)]);
    },
    [],
  );

  const appendNarrative = useCallback((node: Extract<SimNode, { type: "narrative" }>) => {
    setFeed((f) => [...f, feedFromNarrative(node)]);
  }, []);

  const advance = useCallback(() => {
    setActiveIdx((i) => Math.min(i + 1, DAY1_SIMULATION_NODES.length - 1));
  }, []);

  const showSummary =
    activeIdx === DAY1_SIMULATION_NODES.length - 1 && DAY1_SIMULATION_NODES[activeIdx]!.type === "summary";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playCanon}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/20"
        >
          <Play className="h-3.5 w-3.5" />
          Jouer la journée (canon)
        </button>
        <button
          type="button"
          onClick={resetDay}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Recommencer
        </button>
        <p className="text-[11px] text-zinc-500">Canon = script court, 2ᵉ appel perdu, démo 2 en erreur (comme l’histoire cible).</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),340px]">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Chronologie (jour 1)</h2>
          <div className="space-y-3">
            {DAY1_SIMULATION_NODES.map((node, i) => (
              <div
                key={node.id}
                className={cn(
                  "rounded-xl border p-3 transition",
                  i === activeIdx ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/30 opacity-80",
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className="w-full text-left"
                >
                  <span className="font-mono text-xs text-amber-200/80">{node.timeLabel}</span>
                  <span className="ml-2 text-sm text-zinc-200">{node.blockTitle}</span>
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <h3 className="text-xs font-bold uppercase text-zinc-500">Scène active</h3>
            <ActiveNode
              node={DAY1_SIMULATION_NODES[activeIdx]!}
              selection={selections[DAY1_SIMULATION_NODES[activeIdx]!.id]}
              onSelect={(n, o) => {
                if (selections[n.id]) return;
                applyChoice(n, o);
                advance();
              }}
              onAckNarrative={(n) => {
                appendNarrative(n);
                advance();
              }}
            />
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Fil & résultats</h2>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/20 p-3">
            {feed.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Choisis des réponses dans chaque scène, ou lance <strong>Jouer la journée (canon)</strong>.
              </p>
            ) : (
              feed.map((m) => (
                <div key={m.id} className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-2 text-sm">
                  <p className="text-[10px] font-mono text-zinc-500">
                    {m.time} — {m.title}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-zinc-300">→ {m.outcomeLabel}</p>
                  {m.body.map((b, j) => (
                    <p
                      key={j}
                      className={cn(
                        "mt-2 whitespace-pre-wrap rounded p-2 text-xs",
                        b.role === "broker" && "border-l-2 border-sky-500/50 pl-2 text-sky-100",
                        b.role === "agent" && "border-l-2 border-amber-500/50 pl-2 text-amber-50",
                        b.role === "sys" && "text-zinc-400",
                      )}
                    >
                      {b.role === "broker" && <span className="text-sky-500/80">Courtier: </span>}
                      {b.role === "agent" && <span className="text-amber-500/80">Toi: </span>}
                      {b.text}
                    </p>
                  ))}
                </div>
              ))
            )}
          </div>

          {showSummary && <SummaryCard />}

          {allChoicesDone && (
            <div className="rounded-2xl border border-zinc-800 p-3">
              <h3 className="text-xs font-bold uppercase text-zinc-500">Bilan (tes choix)</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-zinc-300">
                {choiceOnly.map((c) => {
                  const o = c.options.find((x) => x.id === selections[c.id]!);
                  if (!o) return null;
                  return (
                    <li key={c.id} className="flex flex-wrap items-baseline gap-1">
                      <span className="font-mono text-zinc-500">{c.timeLabel}</span>
                      <span>{o.outcomeLabel}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-200">
              <Sparkles className="h-4 w-4" /> Coaching (jumeau)
            </h3>
            {!allChoicesDone ? (
              <p className="mt-2 text-xs text-zinc-500">Termine les 3 scènes à choix (ou lance le canon) pour le bilan personnalisé.</p>
            ) : (
              <CoachingBlock selections={selections} />
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 p-3">
            <h3 className="text-xs font-bold uppercase text-zinc-500">Leçons clés</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {KEY_LESSONS.map((k) => (
                <li key={k}>· {k}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveNode({
  node,
  selection,
  onSelect,
  onAckNarrative,
}: {
  node: SimNode;
  selection: string | undefined;
  onSelect: (n: SimNode & { type: "choice" }, o: ChoiceOption) => void;
  onAckNarrative: (n: Extract<SimNode, { type: "narrative" }>) => void;
}) {
  if (node.type === "summary") {
    return <SummaryCard />;
  }
  if (node.type === "narrative") {
    return (
      <div className="mt-2 space-y-2">
        {node.brokerLine && <p className="text-sm text-sky-100/90">« {node.brokerLine} »</p>}
        {node.agentLine && node.agentLine !== "—" && <p className="text-sm text-amber-50/90">{node.agentLine}</p>}
        <div className={cn("flex items-center gap-1.5 rounded border p-2 text-sm", outcomeStyle(node.outcome))}>
          {pickIcon(node.outcome)} <span className="font-medium">{node.outcomeLabel}</span>
        </div>
        <ul className="text-xs text-zinc-400">
          {node.feedbackLines.map((f) => (
            <li key={f}>· {f}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onAckNarrative(node)}
          className="rounded bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900"
        >
          Ajouter au fil →
        </button>
      </div>
    );
  }
  const selectedOpt = selection ? node.options.find((o) => o.id === selection) : undefined;
  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm text-sky-100/90">{node.brokerLine}</p>
      {node.context && <p className="text-xs text-zinc-500">{node.context}</p>}
      <p className="text-[10px] font-bold uppercase text-zinc-500">Choix</p>
      <div className="space-y-2">
        {node.options.map((o) => {
          const picked = selection === o.id;
          return (
            <button
              key={o.id}
              type="button"
              disabled={!!selection}
              onClick={() => onSelect(node, o)}
              className={cn(
                "w-full rounded-lg border p-2 text-left text-sm transition",
                selectedOpt && (picked ? "border-amber-500/50 bg-amber-500/10" : "opacity-40"),
                !selectedOpt && "border-zinc-800 bg-zinc-900/30 hover:border-zinc-600",
                !selection && "cursor-pointer",
                selection && "cursor-default",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {selectedOpt && (
        <div className="mt-2 space-y-1 rounded border border-zinc-800/80 p-2 text-xs text-zinc-300">
          <p>
            <span className="text-amber-500/80">Toi: </span>
            {selectedOpt.agentLine}
          </p>
          <div className={cn("mt-1 inline-flex items-center gap-1 rounded border px-2 py-0.5", outcomeStyle(selectedOpt.outcome))}>
            {pickIcon(selectedOpt.outcome)} <span>{selectedOpt.outcomeLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard() {
  const s = DAY1_SIMULATION_NODES.find((n) => n.type === "summary") as Extract<SimNode, { type: "summary" }> | undefined;
  if (!s) return null;
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <h3 className="text-sm font-medium text-emerald-200">Fin de journée</h3>
      <p className="mt-1 text-xs text-zinc-500">Objectif pédago — chiffres indicatifs de la scénarisation (jour 1 type).</p>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-zinc-500">Appels</dt>
          <dd className="font-mono text-zinc-100">{s.defaultStats.calls}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Démos</dt>
          <dd className="font-mono text-zinc-100">{s.defaultStats.demos}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Leads forts</dt>
          <dd className="font-mono text-zinc-100">{s.defaultStats.strongLeads}</dd>
        </div>
      </dl>
    </div>
  );
}

function CoachingBlock({ selections }: { selections: Selections }) {
  const c = useMemo(() => buildCoaching(selections), [selections]);
  return (
    <div className="mt-2 space-y-2 text-sm text-zinc-200">
      <p>
        <span className="text-rose-200/90">Plus gros piège: </span>
        <span className="block font-medium text-zinc-100">{c.biggestMistake.en}</span>
        <span className="mt-0.5 block text-xs text-zinc-400">{c.biggestMistake.fr}</span>
      </p>
      <p>
        <span className="text-emerald-200/90">Meilleur geste: </span>
        <span className="block font-medium text-zinc-100">{c.bestMove.en}</span>
        <span className="mt-0.5 block text-xs text-zinc-400">{c.bestMove.fr}</span>
      </p>
    </div>
  );
}
