"use client";

import { useMemo, useState } from "react";
import type { EntityType, LegacyOfficeEntity, LegacyOfficeState } from "@/modules/legacy-office/entity.types";
import { createDefaultLegacyOfficeState } from "@/modules/legacy-office/default-legacy-state";
import {
  buildOwnershipGraph,
  computeEffectiveOwnership,
  getChildren,
  type OwnershipGraph,
} from "@/modules/legacy-office/ownership-graph.service";
import type { ControlRules } from "@/modules/legacy-office/control-rules.service";
import { emptyControlRules, resolveControlRules, upsertControlRules } from "@/modules/legacy-office/control-rules.service";
import {
  createDefaultCapitalBuckets,
  DEFAULT_LEGACY_CAPITAL_BUCKET_LABELS,
  type LegacyCapitalBucket,
} from "@/modules/legacy-office/capital-buckets.service";
import { buildContinuitySnapshot } from "@/modules/legacy-office/continuity.service";
import { buildLegacyRiskView } from "@/modules/legacy-office/risk.service";

const ENTITY_LABELS: Record<EntityType, string> = {
  FAMILY_OFFICE: "Family office",
  HOLDING: "Holding",
  OPERATING: "Operating",
  INVESTMENT_VEHICLE: "Investment vehicle",
  TRUST_LIKE_INFO: "Trust-like (informational)",
};

function EntityTree({
  graph,
  entityId,
  depth,
  onSelect,
  selectedId,
}: {
  graph: OwnershipGraph;
  entityId: string;
  depth: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const node = graph.nodesById.get(entityId);
  if (!node) return null;
  const kids = getChildren(graph, entityId);
  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => onSelect(entityId)}
        className={`rounded px-2 py-1 text-left text-sm ${
          selectedId === entityId ? "bg-amber-500/20 text-amber-100" : "text-zinc-300 hover:bg-zinc-800"
        }`}
        style={{ marginLeft: depth * 12 }}
      >
        <span className="font-medium text-white">{node.name}</span>
        <span className="ml-2 text-xs text-zinc-500">{ENTITY_LABELS[node.entityType]}</span>
      </button>
      {kids.length > 0 && (
        <ul className="mt-1 border-l border-zinc-800 pl-2">
          {kids.map((k) => (
            <EntityTree
              key={k.id}
              graph={graph}
              entityId={k.id}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LegacyOfficeDashboardClient() {
  const [state, setState] = useState<LegacyOfficeState>(() => createDefaultLegacyOfficeState());
  const [capitalBuckets, setCapitalBuckets] = useState<LegacyCapitalBucket[]>(() => createDefaultCapitalBuckets());
  const [controlRules, setControlRules] = useState<ControlRules[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>("fo-1");
  const [globalSuccessorNotes, setGlobalSuccessorNotes] = useState("");
  const [globalKeyPersonNotes, setGlobalKeyPersonNotes] = useState("");

  const graph = useMemo(() => buildOwnershipGraph(state), [state]);
  const effective = useMemo(
    () => (selectedId ? computeEffectiveOwnership(graph, selectedId) : null),
    [graph, selectedId]
  );
  const continuity = useMemo(
    () => buildContinuitySnapshot(state, controlRules, { globalSuccessorNotes, globalKeyPersonNotes }),
    [state, controlRules, globalSuccessorNotes, globalKeyPersonNotes]
  );
  const riskView = useMemo(
    () => buildLegacyRiskView(state, controlRules, capitalBuckets, { globalSuccessorNotes, globalKeyPersonNotes }),
    [state, controlRules, capitalBuckets, globalSuccessorNotes, globalKeyPersonNotes]
  );

  const selectedEntity = selectedId ? state.entities.find((e) => e.id === selectedId) : undefined;
  const rulesForSelected = selectedId ? resolveControlRules(controlRules, selectedId) : emptyControlRules("_");

  const updateRules = (next: ControlRules) => {
    setControlRules((r) => upsertControlRules(r, next));
  };

  const updateEntityField = (id: string, patch: Partial<LegacyOfficeEntity>) => {
    setState((s) => ({
      ...s,
      entities: s.entities.map((e) => (e.id === id ? ({ ...e, ...patch } as LegacyOfficeEntity) : e)),
    }));
  };

  const operatingCos = state.entities.filter((e) => e.entityType === "OPERATING");
  const investments = state.entities.filter((e) => e.entityType === "INVESTMENT_VEHICLE");

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-zinc-100">
      <header className="space-y-3 border-b border-teal-500/20 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-400/90">Informational structure map</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Legacy office & multi-entity control</h1>
        <div
          role="note"
          className="rounded-lg border border-teal-500/30 bg-teal-950/40 px-4 py-3 text-sm leading-relaxed text-teal-100/90"
        >
          <strong className="text-teal-200">Not legal or tax advice.</strong> This view is for operational clarity and
          editable notes only. It does not create trusts, corporations, or fiduciary duties and does not replace counsel.
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-medium text-white">Entity tree</h2>
          <p className="mt-1 text-xs text-zinc-500">Click an entity to edit governance notes and control fields.</p>
          <ul className="mt-4">
            {graph.rootIds.map((rid) => (
              <EntityTree
                key={rid}
                graph={graph}
                entityId={rid}
                depth={0}
                onSelect={setSelectedId}
                selectedId={selectedId}
              />
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-medium text-white">Ownership graph (edges)</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {state.entities
              .filter((e) => e.parentEntityId)
              .map((e) => {
                const p = state.entities.find((x) => x.id === e.parentEntityId);
                return (
                  <li key={e.id} className="rounded border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
                    <span className="text-zinc-300">{p?.name ?? e.parentEntityId}</span>
                    <span className="mx-2 text-zinc-600">→</span>
                    <span className="text-white">{e.name}</span>
                    {e.informationalParentHeldFraction != null && (
                      <span className="ml-2 text-xs text-teal-400/90">
                        (informational held: {(e.informationalParentHeldFraction * 100).toFixed(0)}%)
                      </span>
                    )}
                  </li>
                );
              })}
            {state.entities.every((e) => !e.parentEntityId) && (
              <li className="text-zinc-500">No parent links — add parentEntityId on entities to build a graph.</li>
            )}
          </ul>

          {effective && selectedId && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm">
              <div className="font-medium text-zinc-200">Effective interest (selected)</div>
              <p className="mt-1 text-xs text-zinc-500">
                Product of informational fractions up the parent chain — not legal beneficial ownership.
              </p>
              <dl className="mt-2 space-y-1 text-zinc-300">
                <div className="flex justify-between gap-4">
                  <dt>Entity</dt>
                  <dd className="text-white">{state.entities.find((e) => e.id === effective.entityId)?.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Root</dt>
                  <dd>{effective.rootId ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Effective (modeled)</dt>
                  <dd className="tabular-nums text-teal-200/90">
                    {effective.effectiveEconomicInterestFromRoot == null
                      ? "Incomplete fractions"
                      : `${(effective.effectiveEconomicInterestFromRoot * 100).toFixed(2)}%`}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </section>
      </div>

      {selectedEntity && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-white">Entity detail & governance (editable)</h2>
          <p className="text-sm text-zinc-500">{ENTITY_LABELS[selectedEntity.entityType]}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-xs text-zinc-500">
              Name
              <input
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={selectedEntity.name}
                onChange={(e) => updateEntityField(selectedEntity.id, { name: e.target.value })}
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Parent entity id
              <input
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={selectedEntity.parentEntityId ?? ""}
                placeholder="empty = root"
                onChange={(e) =>
                  updateEntityField(selectedEntity.id, {
                    parentEntityId: e.target.value.trim() || null,
                  })
                }
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Jurisdiction (informational)
              <input
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={selectedEntity.jurisdiction ?? ""}
                onChange={(e) => updateEntityField(selectedEntity.id, { jurisdiction: e.target.value || null })}
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Informational parent-held fraction (0–1)
              <input
                type="number"
                step={0.01}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={selectedEntity.informationalParentHeldFraction ?? ""}
                onChange={(e) =>
                  updateEntityField(selectedEntity.id, {
                    informationalParentHeldFraction:
                      e.target.value === "" ? null : Math.max(0, Math.min(1, Number(e.target.value))),
                  })
                }
              />
            </label>
            <label className="md:col-span-2 block text-xs text-zinc-500">
              Ownership notes (informational)
              <textarea
                className="mt-1 min-h-[72px] w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={selectedEntity.ownershipNotes ?? ""}
                onChange={(e) => updateEntityField(selectedEntity.id, { ownershipNotes: e.target.value || null })}
              />
            </label>
            <label className="md:col-span-2 block text-xs text-zinc-500">
              Governance notes (informational)
              <textarea
                className="mt-1 min-h-[72px] w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={selectedEntity.governanceNotes ?? ""}
                onChange={(e) => updateEntityField(selectedEntity.id, { governanceNotes: e.target.value || null })}
              />
            </label>
          </div>

          <h3 className="mt-8 text-sm font-semibold text-zinc-200">Control rules (same entity)</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(
              [
                ["votingControlNotes", "Voting / control"],
                ["reservedMattersNotes", "Reserved matters"],
                ["capitalAllocationAuthorityNotes", "Capital allocation authority"],
                ["successionNotes", "Succession"],
                ["boardOrManagerRolesNotes", "Board / manager roles"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-xs text-zinc-500 md:col-span-2">
                {label}
                <textarea
                  className="mt-1 min-h-[64px] w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                  value={(rulesForSelected[key] as string) ?? ""}
                  onChange={(e) => updateRules({ ...rulesForSelected, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-white">Capital buckets (stewardship)</h2>
        <p className="mt-1 text-xs text-zinc-500">Self-reported amounts for planning visibility — not GAAP or tax basis.</p>
        <div className="mt-4 space-y-4">
          {capitalBuckets.map((b, i) => (
            <div key={b.key} className="grid gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3 md:grid-cols-[1fr,160px]">
              <div>
                <div className="text-sm font-medium text-zinc-200">{DEFAULT_LEGACY_CAPITAL_BUCKET_LABELS[b.key]}</div>
                <textarea
                  className="mt-2 min-h-[56px] w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300"
                  placeholder="Policy / purpose notes"
                  value={b.notes ?? ""}
                  onChange={(e) => {
                    const next = [...capitalBuckets];
                    next[i] = { ...b, notes: e.target.value };
                    setCapitalBuckets(next);
                  }}
                />
              </div>
              <label className="text-xs text-zinc-500">
                Amount (USD)
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-white"
                  value={b.amountCents != null ? b.amountCents / 100 : ""}
                  onChange={(e) => {
                    const next = [...capitalBuckets];
                    const v = e.target.value;
                    next[i] = { ...b, amountCents: v === "" ? null : Math.round(Number(v) * 100) };
                    setCapitalBuckets(next);
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-white">Major operating companies</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            {operatingCos.map((e) => (
              <li key={e.id}>
                <button type="button" className="text-left text-teal-400/90 hover:underline" onClick={() => setSelectedId(e.id)}>
                  {e.name}
                </button>
                {e.jurisdiction && <span className="text-zinc-500"> — {e.jurisdiction}</span>}
              </li>
            ))}
            {operatingCos.length === 0 && <li className="text-zinc-500">No operating entities in model.</li>}
          </ul>
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-white">Major investments (vehicles)</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            {investments.map((e) => (
              <li key={e.id}>
                <button type="button" className="text-left text-teal-400/90 hover:underline" onClick={() => setSelectedId(e.id)}>
                  {e.name}
                </button>
                {e.jurisdiction && <span className="text-zinc-500"> — {e.jurisdiction}</span>}
              </li>
            ))}
            {investments.length === 0 && <li className="text-zinc-500">No investment vehicles in model.</li>}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-white">Succession & continuity (notes)</h2>
        <label className="mt-3 block text-xs text-zinc-500">
          Global successor / continuity notes
          <textarea
            className="mt-1 min-h-[80px] w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            value={globalSuccessorNotes}
            onChange={(e) => setGlobalSuccessorNotes(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-xs text-zinc-500">
          Global key-person / operator notes
          <textarea
            className="mt-1 min-h-[80px] w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            value={globalKeyPersonNotes}
            onChange={(e) => setGlobalKeyPersonNotes(e.target.value)}
          />
        </label>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Continuity flags</h3>
            <ul className="mt-2 space-y-2 text-sm text-zinc-400">
              {continuity.continuityRisks.map((r, i) => (
                <li key={i} className="rounded border border-zinc-800 bg-zinc-950/50 px-2 py-2">
                  <span className="text-xs uppercase text-zinc-500">{r.severity}</span>
                  <p className="mt-1">{r.message}</p>
                </li>
              ))}
              {continuity.continuityRisks.length === 0 && <li className="text-zinc-500">None from current heuristics.</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Concentration (continuity)</h3>
            <ul className="mt-2 space-y-2 text-sm text-zinc-400">
              {continuity.concentrationRisks.map((r, i) => (
                <li key={i} className="rounded border border-zinc-800 bg-zinc-950/50 px-2 py-2">
                  <span className="text-xs uppercase text-zinc-500">{r.severity}</span>
                  <p className="mt-1">{r.message}</p>
                </li>
              ))}
              {continuity.concentrationRisks.length === 0 && <li className="text-zinc-500">None from current heuristics.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-white">Risk view (discussion only)</h2>
        <p className="mt-1 text-xs text-zinc-500">Updated {new Date(riskView.generatedAt).toLocaleString()}</p>
        <div className="mt-4 space-y-4">
          {riskView.items.map((item, i) => (
            <div
              key={`${item.category}-${i}`}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-300"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">{item.category.replace(/_/g, " ")}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    item.severity === "HIGH"
                      ? "bg-amber-500/20 text-amber-200"
                      : item.severity === "MEDIUM"
                        ? "bg-yellow-500/15 text-yellow-200"
                        : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {item.severity}
                </span>
              </div>
              <p className="mt-2 text-zinc-400">{item.summary}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-500">
                {item.detailNotes.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {state.trustLikeProfiles.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-white">Trust-like profiles (informational)</h2>
          {state.trustLikeProfiles.map((t) => (
            <div key={t.id} className="mt-4 rounded border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
              <p className="text-xs uppercase text-teal-500/90">informationalOnly: true</p>
              <p className="mt-2 text-zinc-300">{t.summaryNotes}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
