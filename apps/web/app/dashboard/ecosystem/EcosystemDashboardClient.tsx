"use client";

import { useMemo, useState } from "react";
import {
  ECOSYSTEM_LAYERS,
  type EcosystemLayerId,
  assessAdoptionDepth,
  assessNetworkEffects,
  assessValueLoopHealth,
  evaluateExpansion,
  summarizeInterdependencies,
  type AdoptionDepthInput,
  type NetworkActivitySnapshot,
  type ValueLoopHealthInput,
} from "@/modules/ecosystem";

export function EcosystemDashboardClient() {
  const [network, setNetwork] = useState<NetworkActivitySnapshot>({
    brokers: 140,
    leads: 920,
    deals: 155,
    interactions: 6400,
    prior: { brokers: 120, leads: 810, deals: 140, interactions: 5900 },
  });

  const [valueLoop, setValueLoop] = useState<ValueLoopHealthInput>({
    crossLayerAdoptionRate: 0.48,
    assistiveUtilizationRate: 0.36,
    outcomeQualityIndex: 0.58,
    satisfactionIndex: 0.64,
  });

  const [adoption, setAdoption] = useState<AdoptionDepthInput>({
    activeLayersUsed: 4,
    integrationEngagementRate: 0.32,
    crossModuleWorkflowRate: 0.41,
    weeklySessionsPerActiveUser: 5.5,
    dataPortabilityUsageRate: 0.22,
  });

  const [liveLayers, setLiveLayers] = useState<EcosystemLayerId[]>([
    "core",
    "intelligence",
    "marketplace",
    "infrastructure",
  ]);

  const [supportTickets, setSupportTickets] = useState(28);
  const [revenueStability, setRevenueStability] = useState(0.8);

  const interdep = useMemo(() => summarizeInterdependencies(), []);
  const networkMetrics = useMemo(() => assessNetworkEffects(network), [network]);
  const loop = useMemo(() => assessValueLoopHealth(valueLoop), [valueLoop]);
  const depth = useMemo(() => assessAdoptionDepth(adoption), [adoption]);
  const expansion = useMemo(
    () =>
      evaluateExpansion({
        networkActivityIndex: networkMetrics.networkActivityIndex,
        loopStrength: loop.loopStrength,
        adoptionDepthScore: depth.adoptionDepthScore,
        supportTicketsPer1kMau: supportTickets,
        revenueStabilityIndex: revenueStability,
        liveLayers,
      }),
    [networkMetrics.networkActivityIndex, loop.loopStrength, depth.adoptionDepthScore, supportTickets, revenueStability, liveLayers]
  );

  const toggleLayer = (id: EcosystemLayerId) => {
    setLiveLayers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-zinc-100">
      <header className="space-y-3 border-b border-[#D4AF37]/25 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Platform planning</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Ecosystem layers & organic network effects</h1>
        <div className="rounded-lg border border-[#D4AF37]/30 bg-[#1a1508] px-4 py-3 text-sm text-[#f5e6c8]">
          <strong className="text-[#D4AF37]">Ethical guardrails.</strong> This workspace is for structuring product value and
          measurement — not for anti-competitive tactics, forced lock-in, or artificial switching costs. Depth scores reward{" "}
          <em>voluntary</em> usage and transparency (including data portability).
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(ECOSYSTEM_LAYERS).map((layer) => (
          <div key={layer.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#D4AF37]">{layer.title}</h2>
                <p className="mt-1 text-xs text-zinc-500">{layer.summary}</p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-wide text-zinc-500">
                <input
                  type="checkbox"
                  className="rounded border-zinc-600"
                  checked={liveLayers.includes(layer.id)}
                  onChange={() => toggleLayer(layer.id)}
                />
                Live
              </label>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-zinc-400">
              {layer.capabilities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Layer connections</h2>
        <p className="mt-1 text-xs text-zinc-500">
          How modules reinforce each other when value is clear — illustrative data flows, not API contracts.
        </p>
        <div className="mt-4 space-y-4">
          {interdep.map((block) => (
            <div key={block.layer} className="rounded-lg border border-zinc-800 bg-black/25 p-4">
              <p className="text-sm font-semibold text-white">
                {block.title} <span className="text-zinc-500">({block.layer})</span>
              </p>
              {block.outgoing.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Reinforces →</p>
                  <ul className="mt-2 space-y-2 text-sm text-zinc-400">
                    {block.outgoing.map((e) => (
                      <li key={`${e.from}-${e.to}`}>
                        <span className="text-[#D4AF37]">{e.to}</span>: {e.reinforcement}{" "}
                        <span className="block text-[11px] text-zinc-500">Data: {e.dataFlow}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-[#D4AF37]">Network activity (inputs)</h2>
          <p className="mt-1 text-xs text-zinc-500">Counts you define — compared to a prior window if provided.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["brokers", "Brokers", network.brokers],
                ["leads", "Leads", network.leads],
                ["deals", "Deals", network.deals],
                ["interactions", "Interactions", network.interactions],
              ] as const
            ).map(([key, label, val]) => (
              <label key={key} className="text-xs text-zinc-500">
                {label}
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                  value={val}
                  onChange={(e) =>
                    setNetwork((n) => ({ ...n, [key]: Math.max(0, Number(e.target.value)) }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="mt-6 border-t border-zinc-800 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Prior window (optional)</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["brokers", "Brokers prior", network.prior?.brokers ?? ""],
                  ["leads", "Leads prior", network.prior?.leads ?? ""],
                  ["deals", "Deals prior", network.prior?.deals ?? ""],
                  ["interactions", "Interactions prior", network.prior?.interactions ?? ""],
                ] as const
              ).map(([key, label, val]) => (
                <label key={key} className="text-xs text-zinc-500">
                  {label}
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                    value={val === "" ? "" : val}
                    placeholder="optional"
                    onChange={(e) =>
                      setNetwork((n) => {
                        const v = e.target.value === "" ? undefined : Math.max(0, Number(e.target.value));
                        return { ...n, prior: { ...n.prior, [key]: v } };
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-zinc-300">
              Network activity index:{" "}
              <span className="font-semibold tabular-nums text-[#D4AF37]">{networkMetrics.networkActivityIndex}</span> / 100
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-500">
              {networkMetrics.narrative.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-[#D4AF37]">Value loop health</h2>
          <p className="mt-1 text-xs text-zinc-500">Users → data → intelligence → outcomes → organic return usage.</p>
          <div className="mt-4 space-y-3">
            {(
              [
                ["crossLayerAdoptionRate", "Cross-layer adoption (0–1)", valueLoop.crossLayerAdoptionRate],
                ["assistiveUtilizationRate", "Assistive utilization (0–1)", valueLoop.assistiveUtilizationRate],
                ["outcomeQualityIndex", "Outcome quality index (0–1)", valueLoop.outcomeQualityIndex],
                ["satisfactionIndex", "Satisfaction / trust proxy (0–1)", valueLoop.satisfactionIndex],
              ] as const
            ).map(([key, label, val]) => (
              <label key={key} className="block text-xs text-zinc-500">
                {label}
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={1}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                  value={val}
                  onChange={(e) =>
                    setValueLoop((v) => ({
                      ...v,
                      [key]: Math.min(1, Math.max(0, Number(e.target.value))),
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-300">
            Loop strength: <span className="font-semibold tabular-nums text-[#D4AF37]">{loop.loopStrength}</span> / 100
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-500">
            {loop.diagnosis.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-[#D4AF37]">Adoption depth (voluntary)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Formerly labeled “dependency” in strategy docs — here it means chosen embed depth, with portability rewarded.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Active layers used (1–5)
              <input
                type="number"
                min={1}
                max={5}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                value={adoption.activeLayersUsed}
                onChange={(e) =>
                  setAdoption((a) => ({
                    ...a,
                    activeLayersUsed: Math.min(5, Math.max(1, Number(e.target.value))),
                  }))
                }
              />
            </label>
            <label className="text-xs text-zinc-500">
              Weekly sessions / active user
              <input
                type="number"
                step={0.5}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                value={adoption.weeklySessionsPerActiveUser}
                onChange={(e) =>
                  setAdoption((a) => ({
                    ...a,
                    weeklySessionsPerActiveUser: Math.max(0, Number(e.target.value)),
                  }))
                }
              />
            </label>
            {(
              [
                ["integrationEngagementRate", "Integration engagement (0–1)", adoption.integrationEngagementRate],
                ["crossModuleWorkflowRate", "Cross-module workflows (0–1)", adoption.crossModuleWorkflowRate],
                ["dataPortabilityUsageRate", "Data portability usage (0–1)", adoption.dataPortabilityUsageRate],
              ] as const
            ).map(([key, label, val]) => (
              <label key={key} className="text-xs text-zinc-500 sm:col-span-2">
                {label}
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={1}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                  value={val}
                  onChange={(e) =>
                    setAdoption((a) => ({
                      ...a,
                      [key]: Math.min(1, Math.max(0, Number(e.target.value))),
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-300">
            Adoption depth score:{" "}
            <span className="font-semibold tabular-nums text-[#D4AF37]">{depth.adoptionDepthScore}</span> / 100
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-500">
            {depth.interpretation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-[#D4AF37]">Expansion decision</h2>
          <p className="mt-1 text-xs text-zinc-500">Breadth only when fundamentals and sustainability support it.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Support tickets / 1k MAU
              <input
                type="number"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                value={supportTickets}
                onChange={(e) => setSupportTickets(Math.max(0, Number(e.target.value)))}
              />
            </label>
            <label className="text-xs text-zinc-500">
              Revenue stability index (0–1)
              <input
                type="number"
                step={0.05}
                min={0}
                max={1}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                value={revenueStability}
                onChange={(e) =>
                  setRevenueStability(Math.min(1, Math.max(0, Number(e.target.value))))
                }
              />
            </label>
          </div>
          <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 px-4 py-3 text-sm">
            <p className="font-semibold text-white">
              Expand breadth:{" "}
              <span className={expansion.expandBreadthRecommended ? "text-emerald-400" : "text-amber-300"}>
                {expansion.expandBreadthRecommended ? "Recommended (heuristic)" : "Hold / deepen"}
              </span>
            </p>
            {expansion.candidateLayers.length > 0 && (
              <p className="mt-2 text-xs text-zinc-400">
                Candidate layers:{" "}
                <span className="text-zinc-200">{expansion.candidateLayers.join(", ")}</span>
              </p>
            )}
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-zinc-500">
            {expansion.reasoning.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-amber-200/80">
            {expansion.cautions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Value loop stages (reference)</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-zinc-400">
          {loop.stages.map((s) => (
            <li key={s.id}>
              <span className="font-medium text-zinc-200">{s.title}.</span> {s.description}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
