"use client";

import * as React from "react";
import Link from "next/link";
import { SIGNATURE_CENTER_BROKER_ACK_TEXT } from "@/lib/approval/signature-center-ack";
import type {
  SignatureCenterItem,
  SignatureCenterNotification,
  SignatureCenterRisk,
  SignatureCenterSectionKey,
  SignatureCenterSnapshot,
  SignatureCenterUrgency,
} from "@/modules/signature-center/signature-center.types";

const SECTION_ORDER: SignatureCenterSectionKey[] = ["deals", "documents", "investor", "closing", "financial"];

const SECTION_LABEL: Record<SignatureCenterSectionKey, string> = {
  deals: "Deals awaiting signature",
  documents: "Documents awaiting signature",
  investor: "Investor actions awaiting signature",
  closing: "Closing steps awaiting signature",
  financial: "Financial actions awaiting signature",
};

function statusLabel(s: SignatureCenterItem["status"]): string {
  switch (s) {
    case "pending_signature":
      return "Pending signature";
    case "signed":
      return "Signed";
    case "executed":
      return "Executed";
    case "rejected":
      return "Rejected";
    default:
      return s;
  }
}

function riskPill(risk: SignatureCenterRisk): string {
  if (risk === "high") return "bg-rose-500/20 text-rose-200 border-rose-500/40";
  if (risk === "medium") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-emerald-500/15 text-emerald-100 border-emerald-500/30";
}

function urgencyPill(u: SignatureCenterUrgency): string | null {
  if (u === "urgent") return "Urgent";
  if (u === "soon") return "Soon";
  return null;
}

function clientFilter(
  items: SignatureCenterItem[],
  type: SignatureCenterSectionKey | "all",
  risk: SignatureCenterRisk | "all",
  urgency: SignatureCenterUrgency | "all",
  minDealValueCad: number | null,
): SignatureCenterItem[] {
  return items.filter((i) => {
    if (type !== "all" && i.section !== type) return false;
    if (risk !== "all" && i.riskLevel !== risk) return false;
    if (urgency !== "all" && i.urgency !== urgency) return false;
    if (minDealValueCad != null && minDealValueCad > 0) {
      const v = (i.dealValueCents ?? 0) / 100;
      if (v < minDealValueCad) return false;
    }
    return true;
  });
}

export function SignatureCenterDashboard() {
  const [snapshot, setSnapshot] = React.useState<SignatureCenterSnapshot | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<SignatureCenterItem | null>(null);
  const [filterType, setFilterType] = React.useState<SignatureCenterSectionKey | "all">("all");
  const [filterRisk, setFilterRisk] = React.useState<SignatureCenterRisk | "all">("all");
  const [filterUrgency, setFilterUrgency] = React.useState<SignatureCenterUrgency | "all">("all");
  const [minDealValue, setMinDealValue] = React.useState<string>("");
  const [signOpen, setSignOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [oaciq, setOaciq] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/broker/signature-center", { credentials: "include" });
      const data = (await res.json()) as SignatureCenterSnapshot & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setSnapshot(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const minCad = minDealValue.trim() === "" ? null : Number(minDealValue);
  const filtered = React.useMemo(() => {
    if (!snapshot) return [];
    return clientFilter(
      snapshot.items,
      filterType,
      filterRisk,
      filterUrgency,
      minCad != null && Number.isFinite(minCad) ? minCad : null,
    );
  }, [snapshot, filterType, filterRisk, filterUrgency, minCad]);

  const grouped = React.useMemo(() => {
    const m = new Map<SignatureCenterSectionKey, SignatureCenterItem[]>();
    for (const k of SECTION_ORDER) m.set(k, []);
    for (const i of filtered) {
      const arr = m.get(i.section) ?? [];
      arr.push(i);
      m.set(i.section, arr);
    }
    return m;
  }, [filtered]);

  const isApprovalItem = selected?.itemKey.startsWith("approval:") ?? false;

  async function postAction(action: "sign" | "reject") {
    if (!selected) return;
    setBusy(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/broker/signature-center/action", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "sign" ?
            {
              itemKey: selected.itemKey,
              action: "sign",
              oaciqAcknowledged: true,
              ackText: SIGNATURE_CENTER_BROKER_ACK_TEXT,
            }
          : {
              itemKey: selected.itemKey,
              action: "reject",
              rejectionReason: rejectReason,
            },
        ),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setSignOpen(false);
      setRejectOpen(false);
      setOaciq(false);
      setRejectReason("");
      setSelected(null);
      await reload();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-amber-50">Signature control center</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Live queue of deal, document, investor, closing, and financial steps that need broker review before execution.
              Nothing here auto-executes without your sign-off path.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Refresh
          </button>
        </header>

        {snapshot?.notifications && snapshot.notifications.length > 0 ?
          <div className="mt-6 space-y-2">
            {snapshot.notifications.map((n: SignatureCenterNotification) => (
              <div
                key={n.id}
                role="status"
                className={
                  n.severity === "critical" ?
                    "rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100"
                  : n.severity === "warning" ?
                    "rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-100"
                  : "rounded-xl border border-sky-500/30 bg-sky-950/20 px-4 py-3 text-sm text-sky-100"
                }
              >
                <p className="font-semibold">{n.title}</p>
                <p className="mt-1 text-xs opacity-90">{n.message}</p>
              </div>
            ))}
          </div>
        : null}

        {loadError ?
          <p className="mt-6 text-sm text-rose-300" role="alert">
            {loadError}
          </p>
        : null}

        <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <label className="text-xs text-zinc-500">
            Type
            <select
              className="ml-2 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as SignatureCenterSectionKey | "all")}
            >
              <option value="all">All</option>
              {SECTION_ORDER.map((k) => (
                <option key={k} value={k}>
                  {SECTION_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Risk
            <select
              className="ml-2 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as SignatureCenterRisk | "all")}
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Urgency
            <select
              className="ml-2 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value as SignatureCenterUrgency | "all")}
            >
              <option value="all">All</option>
              <option value="normal">Normal</option>
              <option value="soon">Soon</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Min deal value (CAD)
            <input
              type="number"
              min={0}
              className="ml-2 w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
              value={minDealValue}
              onChange={(e) => setMinDealValue(e.target.value)}
              placeholder="0"
            />
          </label>
          <span className="self-end text-xs text-zinc-500">{filtered.length} item(s) match filters</span>
        </div>

        {snapshot?.disclaimer ?
          <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">{snapshot.disclaimer}</p>
        : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            {SECTION_ORDER.map((section) => {
              const rows = grouped.get(section) ?? [];
              if (filterType !== "all" && filterType !== section) return null;
              return (
                <section key={section}>
                  <h2 className="font-serif text-xl text-amber-100/90">{SECTION_LABEL[section]}</h2>
                  {rows.length === 0 ?
                    <p className="mt-3 text-sm text-zinc-500">No items in this lane.</p>
                  : <ul className="mt-4 space-y-3">
                      {rows.map((item) => (
                        <li key={item.itemKey}>
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              selected?.itemKey === item.itemKey ?
                                "border-amber-500/50 bg-amber-950/20"
                              : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">
                                {item.actionType}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${riskPill(item.riskLevel)}`}
                              >
                                Risk: {item.riskLevel}
                              </span>
                              {urgencyPill(item.urgency) ?
                                <span className="rounded-full border border-orange-500/40 bg-orange-950/30 px-2 py-0.5 text-[10px] text-orange-100">
                                  {urgencyPill(item.urgency)}
                                </span>
                              : null}
                              <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300">
                                {statusLabel(item.status)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-zinc-200">{item.summary}</p>
                            <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{item.aiReasoning}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.financialImpactCad != null ?
                                <span className="text-xs text-zinc-400">
                                  Financial exposure:{" "}
                                  <span className="font-mono text-zinc-200">
                                    ${item.financialImpactCad.toLocaleString()}
                                  </span>
                                </span>
                              : null}
                              {item.complianceFlags.slice(0, 3).map((f) => (
                                <span
                                  key={f}
                                  className="rounded-md border border-violet-500/30 bg-violet-950/25 px-2 py-0.5 text-[10px] text-violet-100"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  }
                </section>
              );
            })}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/40">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Review panel</h3>
              {!selected ?
                <p className="mt-4 text-sm text-zinc-500">Select an action card to preview context.</p>
              : <>
                  <p className="mt-3 text-xs font-medium text-amber-200/90">{selected.actionType}</p>
                  <p className="mt-2 text-sm text-zinc-200">{selected.summary}</p>

                  <div className="mt-4 space-y-3 text-xs text-zinc-400">
                    <div>
                      <p className="font-semibold text-zinc-300">Deal</p>
                      <p>
                        {selected.dealCode ?? selected.dealId}{" "}
                        <Link href={selected.editHref} className="text-amber-400 hover:text-amber-300">
                          Open workspace →
                        </Link>
                      </p>
                    </div>
                    {selected.pricingSummary ?
                      <div>
                        <p className="font-semibold text-zinc-300">Pricing</p>
                        <p>{selected.pricingSummary}</p>
                      </div>
                    : null}
                    {selected.investorStructureSummary ?
                      <div>
                        <p className="font-semibold text-zinc-300">Investor structure</p>
                        <p>{selected.investorStructureSummary}</p>
                      </div>
                    : null}
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-zinc-300">Document / draft preview</p>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-[10px] leading-relaxed text-zinc-400 whitespace-pre-wrap">
                      {selected.previewHint}
                    </pre>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 border-t border-zinc-800 pt-4">
                    {isApprovalItem ?
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setActionMsg(null);
                            setSignOpen(true);
                          }}
                          className="rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
                        >
                          Sign &amp; execute
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setActionMsg(null);
                            setRejectOpen(true);
                          }}
                          className="rounded-lg border border-rose-500/50 bg-rose-950/30 px-3 py-2.5 text-sm font-medium text-rose-100 hover:bg-rose-950/50"
                        >
                          Reject
                        </button>
                      </>
                    : null}
                    <Link
                      href={selected.editHref}
                      className="block rounded-lg border border-zinc-600 px-3 py-2.5 text-center text-sm text-zinc-200 hover:bg-zinc-800"
                    >
                      Edit before sign
                    </Link>
                    {!isApprovalItem ?
                      <p className="text-[11px] text-zinc-500">
                        Hub signing applies to broker approval rows. Use the workspace link to execute document, closing, or
                        payment steps in context.
                      </p>
                    : null}
                    {actionMsg ?
                      <p className="text-sm text-rose-300" role="alert">
                        {actionMsg}
                      </p>
                    : null}
                  </div>
                </>
              }
            </div>
          </aside>
        </div>
      </div>

      {signOpen && selected ?
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-zinc-50">Confirm signature</h4>
            <p className="mt-2 text-xs text-zinc-400">{selected.summary}</p>
            <label className="mt-4 flex cursor-pointer gap-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0"
                checked={oaciq}
                onChange={(e) => setOaciq(e.target.checked)}
              />
              <span>{SIGNATURE_CENTER_BROKER_ACK_TEXT}</span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200"
                onClick={() => setSignOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !oaciq}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                onClick={() => void postAction("sign")}
              >
                {busy ? "Signing…" : "Sign & execute"}
              </button>
            </div>
          </div>
        </div>
      : null}

      {rejectOpen && selected ?
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-zinc-50">Reject action</h4>
            <textarea
              className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (audit trail)"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200"
                onClick={() => setRejectOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || rejectReason.trim().length < 4}
                className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                onClick={() => void postAction("reject")}
              >
                {busy ? "Submitting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      : null}
    </div>
  );
}
