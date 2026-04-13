"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION,
  renderHostLifecycleTemplate,
} from "@/lib/ai/messaging/templates";
import { GUEST_MESSAGE_TRIGGER_KEYS } from "@/lib/ai/messaging/trigger-config";

type Settings = {
  autopilotEnabled: boolean;
  autopilotMode: string;
  preferences: {
    autoPricing: boolean;
    autoMessaging: boolean;
    autoPromotions: boolean;
    autoListingOptimization: boolean;
  };
  lastAutopilotRunAt: string | null;
  guestMessaging: {
    autoGuestMessagingEnabled: boolean;
    guestMessageMode: "draft_only" | "auto_send_safe";
    triggers: Record<string, { enabled: boolean }>;
    hostInternalChecklistEnabled: boolean;
  };
};

const TRIGGER_LABELS: Record<string, string> = {
  booking_confirmed: "Booking confirmed",
  pre_checkin: "Pre-check-in (~24h before)",
  checkin: "Check-in welcome",
  checkout: "Checkout reminder",
  post_checkout: "Post-stay thank you",
};

type ActionRow = {
  id: string;
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  status: string;
  createdAt: string;
};

type RecRow = {
  id: string;
  agentKey: string;
  title: string;
  description: string;
  targetEntityType: string;
  targetEntityId: string;
  createdAt: Date | string;
};

type ApprovalRow = {
  id: string;
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  createdAt: Date | string;
  payload: unknown;
};

const MODES = [
  { id: "OFF", label: "Off", hint: "No autopilot runs." },
  { id: "ASSIST", label: "Assist", hint: "Suggestions & notifications only." },
  { id: "SAFE_AUTOPILOT", label: "Safe autopilot", hint: "May auto-apply listing copy when enabled below — never payouts/refunds." },
  { id: "FULL_AUTOPILOT_APPROVAL", label: "Full (approvals)", hint: "Side effects require your approval first." },
] as const;

export function HostAutopilotClient({
  initialSettings,
  initialActions,
  initialRecommendations,
  initialApprovals,
}: {
  initialSettings: Settings;
  initialActions: ActionRow[];
  initialRecommendations: RecRow[];
  initialApprovals: ApprovalRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);

  const previewSample = useMemo(
    () => ({
      guestName: "Alex",
      listingTitle: "Sample listing",
      checkInLabel: "Jun 1, 2026",
      checkOutLabel: "Jun 5, 2026",
      nights: 4,
    }),
    []
  );

  const patch = (body: Record<string, unknown>) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/ai/host-autopilot/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSettings(data.settings);
      router.refresh();
    });
  };

  const runScan = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/ai/host-autopilot/run", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Run failed");
        return;
      }
      router.refresh();
    });
  };

  const reviewApproval = (id: string, decision: "approve" | "reject") => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/ai/host-autopilot/approvals/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Review failed");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-10 text-slate-200">
      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Master switch</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manual override: turn everything off instantly. Financial actions (refunds, payouts, legal) never auto-run from
          Autopilot.
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-600 bg-slate-900"
            checked={settings.autopilotEnabled}
            disabled={pending}
            onChange={(e) => patch({ autopilotEnabled: e.target.checked })}
          />
          <span>Enable host AI Autopilot</span>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Mode</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 ${
                settings.autopilotMode === m.id ? "border-amber-500/60 bg-amber-950/20" : "border-slate-800 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="autopilotMode"
                  value={m.id}
                  checked={settings.autopilotMode === m.id}
                  disabled={pending || !settings.autopilotEnabled}
                  onChange={() => patch({ autopilotMode: m.id })}
                />
                <span className="font-medium text-white">{m.label}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{m.hint}</p>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Capabilities</h2>
        <p className="mt-1 text-sm text-slate-500">Toggle what the engine may work on. Pricing is suggest-only or approval — never silent price changes.</p>
        <ul className="mt-4 space-y-3">
          {(
            [
              ["autoListingOptimization", "Listing optimization (title & description)"],
              ["autoPricing", "Pricing insights"],
              ["autoMessaging", "Guest message drafts"],
              ["autoPromotions", "Promotion ideas"],
            ] as const
          ).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-4 rounded-lg border border-slate-800/80 px-3 py-2">
              <span className="text-sm">{label}</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-600 bg-slate-900"
                checked={settings.preferences[key]}
                disabled={pending || !settings.autopilotEnabled}
                onChange={(e) => patch({ [key]: e.target.checked })}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-950/10 p-6">
        <h2 className="text-lg font-semibold text-white">Guest messaging automation</h2>
        <p className="mt-2 text-sm text-amber-200/80">{PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION}</p>
        <p className="mt-3 text-sm text-slate-500">
          Default is safe: drafts first. Enable automation only when you want templated messages in the booking thread
          (subject to your toggles and platform safety checks).
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-600 bg-slate-900"
            checked={settings.guestMessaging.autoGuestMessagingEnabled}
            disabled={pending}
            onChange={(e) => patch({ autoGuestMessagingEnabled: e.target.checked })}
          />
          <span>Enable guest lifecycle messaging</span>
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer flex-col rounded-xl border p-4 ${
              settings.guestMessaging.guestMessageMode === "draft_only"
                ? "border-emerald-500/50 bg-emerald-950/20"
                : "border-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="guestMessageMode"
                checked={settings.guestMessaging.guestMessageMode === "draft_only"}
                disabled={pending || !settings.guestMessaging.autoGuestMessagingEnabled}
                onChange={() => patch({ guestMessageMode: "draft_only" })}
              />
              <span className="font-medium text-white">Draft only (recommended)</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Creates drafts and notifies you — nothing auto-sent to guests.</p>
          </label>
          <label
            className={`flex cursor-pointer flex-col rounded-xl border p-4 ${
              settings.guestMessaging.guestMessageMode === "auto_send_safe"
                ? "border-amber-500/50 bg-amber-950/20"
                : "border-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="guestMessageMode"
                checked={settings.guestMessaging.guestMessageMode === "auto_send_safe"}
                disabled={pending || !settings.guestMessaging.autoGuestMessagingEnabled}
                onChange={() => patch({ guestMessageMode: "auto_send_safe" })}
              />
              <span className="font-medium text-white">Auto-send (safe)</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Sends from your host account only when guardrails pass.</p>
          </label>
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Triggers</p>
        <ul className="mt-2 space-y-2">
          {GUEST_MESSAGE_TRIGGER_KEYS.map((key) => (
            <li key={key} className="flex items-center justify-between gap-4 rounded-lg border border-slate-800/80 px-3 py-2">
              <span className="text-sm">{TRIGGER_LABELS[key] ?? key}</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-600 bg-slate-900"
                checked={Boolean(settings.guestMessaging.triggers[key]?.enabled)}
                disabled={pending || !settings.guestMessaging.autoGuestMessagingEnabled}
                onChange={(e) => patch({ guestMessageTriggers: { [key]: { enabled: e.target.checked } } })}
              />
            </li>
          ))}
        </ul>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-600 bg-slate-900"
            checked={settings.guestMessaging.hostInternalChecklistEnabled}
            disabled={pending || !settings.guestMessaging.autoGuestMessagingEnabled}
            onChange={(e) => patch({ hostInternalChecklistEnabled: e.target.checked })}
          />
          <span className="text-sm">Internal host checklist reminders (not sent to guests)</span>
        </label>
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Preview (English, sample dates)</p>
          <div className="mt-2 space-y-2 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Confirmation · </span>
              {renderHostLifecycleTemplate("booking_confirmation", "en", previewSample)}
            </p>
            <p>
              <span className="text-slate-500">Pre-check-in · </span>
              {renderHostLifecycleTemplate("pre_checkin", "en", previewSample)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Run checks</h2>
            <p className="text-sm text-slate-500">Stalled bookings, payout readiness, low-activity listings.</p>
          </div>
          <button
            type="button"
            disabled={pending || !settings.autopilotEnabled || settings.autopilotMode === "OFF"}
            onClick={() => runScan()}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40"
          >
            Run now
          </button>
        </div>
        {settings.lastAutopilotRunAt ? (
          <p className="mt-2 text-xs text-slate-600">Last run: {new Date(settings.lastAutopilotRunAt).toLocaleString()}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Pending approvals</h2>
        {initialApprovals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">None — you’re caught up.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {initialApprovals.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-800 p-4">
                <p className="text-sm font-medium text-white">{a.actionKey}</p>
                <p className="text-xs text-slate-500">
                  {a.targetEntityType} · {a.targetEntityId.slice(0, 12)}…
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => reviewApproval(a.id, "approve")}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => reviewApproval(a.id, "reject")}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Active AI suggestions</h2>
        {initialRecommendations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No open recommendations.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {initialRecommendations.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-800/80 p-3">
                <p className="font-medium text-amber-200/90">{r.title}</p>
                <p className="mt-1 text-slate-400">{r.description.slice(0, 280)}{r.description.length > 280 ? "…" : ""}</p>
                <p className="mt-2 text-xs text-slate-600">
                  {r.agentKey} · {r.targetEntityType}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Recent AI actions (audit)</h2>
        <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto text-xs font-mono text-slate-400">
          {initialActions.map((a) => (
            <li key={a.id} className="border-b border-slate-800/60 py-2">
              <span className="text-amber-500/90">{a.createdAt}</span> · {a.actionKey} · {a.status} · {a.targetEntityType}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
