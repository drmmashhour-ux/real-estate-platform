"use client";

import { useMemo, useState } from "react";

type InsightCard = {
  type: "retention" | "feedback" | "revenue";
  summary: string;
  metric: number;
};

type ActionCard = {
  id: string;
  priority: "low" | "medium" | "high";
  area: "product" | "growth" | "retention";
  title: string;
  description: string;
  suggestedAction: string;
  kind: "reengage_users" | "manual";
};

type HistoryRow = {
  id: string;
  type: string;
  message: string;
  priority: string;
  createdAt: string;
};

type InactiveUserOption = { id: string; email: string };

function priorityPill(p: string) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (p === "high") return `${base} bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40`;
  if (p === "medium") return `${base} bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35`;
  return `${base} bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-600/50`;
}

function insightTypeBadge(t: string) {
  const m: Record<string, string> = {
    retention: "text-sky-300",
    feedback: "text-violet-300",
    revenue: "text-emerald-300",
  };
  return <span className={`text-xs font-semibold uppercase ${m[t] ?? "text-zinc-400"}`}>{t}</span>;
}

function copy(locale: string) {
  const ar = locale.startsWith("ar");
  return {
    run: ar ? "تنفيذ" : "Run",
    sendNudge: ar ? "إرسال التذكير" : "Send Nudge",
    cancel: ar ? "إلغاء" : "Cancel",
    understood: ar ? "تم" : "Got it",
    confirmCheckbox:
      ar ?
        "أؤكد أنني أرسل تذكيراً واحداً داخل التطبيق لهذا المستخدم فقط (لا إرسال جماعي)."
      : "I confirm I am sending one in-app nudge to this user only (no bulk send).",
    segmentLabel: ar ? "الشريحة" : "Segment",
    segmentInactive:
      ar ? "مستخدمون غير نشطين (٣+ أيام) — اختر مستخدماً واحداً" : "Inactive users (3+ days) — pick one user",
    bulkOff: ar ? "لا يوجد إرسال جماعي افتراضياً — مستخدم واحد في كل مرة." : "Bulk sending is off — one user per action.",
    pickUser: ar ? "المستخدم" : "User",
    manualHint:
      ar ?
        "إجراء يدوي خارج هذه الشاشة — راجع الاقتراح أدناه."
      : "Manual follow-up outside this button — review the suggestion below.",
    sending: ar ? "جاري الإرسال…" : "Sending…",
    sentOk: ar ? "تم إرسال التذكير." : "Nudge sent.",
    sentErr: ar ? "تعذّر الإرسال." : "Could not send.",
    pickUserErr: ar ? "اختر مستخدماً." : "Pick a user.",
  };
}

export function ProductIntelligenceAdminTabs(props: {
  locale: string;
  insights: InsightCard[];
  actions: ActionCard[];
  history: HistoryRow[];
  inactiveUsers: InactiveUserOption[];
}) {
  const { locale, insights, actions, history, inactiveUsers } = props;
  const t = useMemo(() => copy(locale), [locale]);
  const [tab, setTab] = useState<"overview" | "history">("overview");

  const [modalAction, setModalAction] = useState<ActionCard | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const repeatedHint =
    history.length > 0 ?
      (() => {
        const counts = new Map<string, number>();
        for (const r of history) {
          const key = `${r.type}::${r.message.slice(0, 120)}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const top = [...counts.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])[0];
        return top ? `Repeated ≥3×: ${top[0].split("::")[0]} — ${top[0].split("::")[1]?.slice(0, 80)}…` : null;
      })()
    : null;

  function openRun(a: ActionCard) {
    setBanner(null);
    setConfirmed(false);
    setSelectedUserId("");
    setModalAction(a);
  }

  function closeModal() {
    if (sending) return;
    setModalAction(null);
  }

  async function submitReengage() {
    if (!selectedUserId) {
      setBanner({ tone: "err", text: t.pickUserErr });
      return;
    }
    if (!confirmed) return;
    setSending(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/product-intelligence/retention-nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setBanner({ tone: "err", text: data.error ?? t.sentErr });
        return;
      }
      setBanner({ tone: "ok", text: t.sentOk });
      setModalAction(null);
    } catch {
      setBanner({ tone: "err", text: t.sentErr });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      {banner ?
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            banner.tone === "ok" ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-100" : "border-rose-500/35 bg-rose-950/30 text-rose-100"
          }`}
        >
          {banner.text}
        </div>
      : null}

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "overview" ? "bg-zinc-800 text-white ring-1 ring-zinc-600" : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "history" ? "bg-zinc-800 text-white ring-1 ring-zinc-600" : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          History
        </button>
        <span className="ms-auto text-xs text-zinc-600">
          SYBNB-AI-120 / SYBNB-AI-121 — manual Run · insight history
        </span>
      </div>

      {tab === "overview" ? (
        <>
          <section
            className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/40 to-zinc-950/40 p-5 md:p-6"
            aria-labelledby="daily-operator-flow-heading"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/90">Order SYBNB-AI-122</p>
            <h2 id="daily-operator-flow-heading" className="mt-2 text-lg font-bold text-zinc-100">
              Daily operator flow
            </h2>
            <p className="mt-1 text-sm text-zinc-400">Make product intelligence part of your routine — one deliberate step at a time.</p>

            <ol className="mt-5 list-decimal space-y-2.5 ps-5 text-sm leading-relaxed text-zinc-200">
              <li>Open this dashboard.</li>
              <li>
                Read insights — about <span className="whitespace-nowrap text-zinc-100">2–3 minutes</span> max.
              </li>
              <li>
                Pick <strong className="text-zinc-100">one</strong> action only (see examples).
              </li>
              <li>
                Use <strong className="text-zinc-100">Run</strong> only after you intend to act — confirmations protect users.
              </li>
              <li>Next day: observe what moved — one calm check, not a frenzy.</li>
            </ol>

            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">Example actions (pick one)</h3>
            <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-zinc-300">
              <li>Fix onboarding confusion (where users drop or get stuck)</li>
              <li>Message inactive users (thoughtful, personal outreach)</li>
              <li>Improve listings (quality, photos, or clarity in bulk)</li>
            </ul>

            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/95">Rule</p>
              <p className="mt-1.5 text-sm text-zinc-200">
                <strong className="text-amber-100/95">1 action per day max.</strong> No overreaction to a single bad number.
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-sky-500/25 bg-sky-950/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-200/90">Success</p>
              <p className="mt-1.5 text-sm text-zinc-200">
                Steady improvement over time — <strong className="text-sky-100/90">no chaos</strong>, no constant strategy pivots.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Insights</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {insights.map((ins, i) => (
                <div key={`${ins.type}-${i}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  {insightTypeBadge(ins.type)}
                  <p className="mt-2 text-sm text-zinc-200">{ins.summary}</p>
                  <p className="mt-2 font-mono text-lg tabular-nums text-[#D4AF37]">{ins.metric}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recommended actions</h2>
            <ul className="mt-3 divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
              {actions.map((a) => (
                <li key={a.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={priorityPill(a.priority)}>{a.priority}</span>
                        <span className="text-xs text-zinc-500">{a.area}</span>
                        {a.kind === "reengage_users" ?
                          <span className="rounded bg-sky-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-300/95">
                            reengage_users
                          </span>
                        : null}
                      </div>
                      <h3 className="mt-2 font-medium text-zinc-100">{a.title}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{a.description}</p>
                      <p className="mt-2 text-sm text-zinc-300">
                        <span className="text-zinc-500">Suggest: </span>
                        {a.suggestedAction}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openRun(a)}
                      className="shrink-0 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c29f32]"
                    >
                      {t.run}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-600">
              SYBNB-AI-120 — Run opens a confirmation flow. Retention nudge calls{" "}
              <code className="font-mono">sendRetentionWeMissYouNudge(userId)</code> after admin confirmation (single user).
            </p>
          </section>
        </>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Insight history</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Every run of product insights appends rows — scan for repeated problems and trends over time.
            </p>
            {repeatedHint ?
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/95">
                {repeatedHint}
              </p>
            : null}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
              <thead className="bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {history.length === 0 ?
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                      No history yet — open Overview after data lands, or call GET /api/ai/product-intelligence.
                    </td>
                  </tr>
                : history.map((row) => (
                    <tr key={row.id} className="align-top hover:bg-zinc-900/40">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-400">
                        {new Date(row.createdAt).toISOString().slice(0, 19).replace("T", " ")}
                      </td>
                      <td className="px-4 py-3">{insightTypeBadge(row.type)}</td>
                      <td className="px-4 py-3">
                        <span className={priorityPill(row.priority)}>{row.priority}</span>
                      </td>
                      <td className="max-w-xl px-4 py-3 text-zinc-300">{row.message}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modalAction ?
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-50">{modalAction.title}</h3>

            {modalAction.kind === "reengage_users" ?
              <>
                <p className="mt-2 text-sm text-zinc-400">{modalAction.description}</p>
                <p className="mt-3 text-xs text-amber-200/90">{t.bulkOff}</p>

                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">{t.segmentLabel}</p>
                <p className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300">{t.segmentInactive}</p>

                <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-zinc-500">{t.pickUser}</label>
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  aria-label={t.pickUser}
                >
                  <option value="">{locale.startsWith("ar") ? "— اختر —" : "— Select —"}</option>
                  {inactiveUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email || u.id}
                    </option>
                  ))}
                </select>
                {inactiveUsers.length === 0 ?
                  <p className="mt-2 text-xs text-amber-300/95">
                    {locale.startsWith("ar") ?
                      "لا يوجد مستخدمون غير نشطين في القائمة حالياً."
                    : "No inactive users in the current cohort snapshot."}
                  </p>
                : null}

                <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>{t.confirmCheckbox}</span>
                </label>

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={sending}
                    className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitReengage()}
                    disabled={sending || !selectedUserId || !confirmed}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? t.sending : t.sendNudge}
                  </button>
                </div>
              </>
            : <>
                <p className="mt-2 text-sm text-zinc-400">{modalAction.description}</p>
                <p className="mt-3 text-xs text-zinc-500">{t.manualHint}</p>
                <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-300">{modalAction.suggestedAction}</p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
                  >
                    {t.understood}
                  </button>
                </div>
              </>
            }
          </div>
        </div>
      : null}
    </div>
  );
}
