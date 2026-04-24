"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PreferenceRow = {
  id: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailAddress: string | null;
  phoneNumber: string | null;
  alertNewDeals: boolean;
  alertPriceDrop: boolean;
  alertScoreChange: boolean;
  alertBuyBox: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  consentGranted: boolean;
  emailOptIn: boolean;
  smsOptIn: boolean;
};

const defaultForm: PreferenceRow = {
  id: "",
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  emailAddress: null,
  phoneNumber: null,
  alertNewDeals: true,
  alertPriceDrop: true,
  alertScoreChange: true,
  alertBuyBox: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  consentGranted: false,
  emailOptIn: false,
  smsOptIn: false,
};

export default function NotificationSettingsPage() {
  const [form, setForm] = useState<PreferenceRow>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications/preferences", { credentials: "include" });
      const data = (await res.json()) as { preference?: PreferenceRow | null; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not load preferences");
        return;
      }
      if (data.preference) {
        setForm({ ...defaultForm, ...data.preference });
      } else {
        setForm(defaultForm);
      }
    } catch {
      setError("Could not load preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (key: keyof PreferenceRow) => {
    setForm((prev) => {
      const cur = prev[key];
      if (typeof cur === "boolean") {
        return { ...prev, [key]: !cur };
      }
      return prev;
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEnabled: form.emailEnabled,
          smsEnabled: form.smsEnabled,
          pushEnabled: form.pushEnabled,
          emailAddress: form.emailAddress,
          phoneNumber: form.phoneNumber,
          alertNewDeals: form.alertNewDeals,
          alertPriceDrop: form.alertPriceDrop,
          alertScoreChange: form.alertScoreChange,
          alertBuyBox: form.alertBuyBox,
          quietHoursStart: form.quietHoursStart,
          quietHoursEnd: form.quietHoursEnd,
          consentGranted: form.consentGranted,
          emailOptIn: form.emailOptIn,
          smsOptIn: form.smsOptIn,
        }),
      });
      const data = (await res.json()) as { preference?: PreferenceRow; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (data.preference) setForm({ ...defaultForm, ...data.preference });
      setMessage("Saved.");
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        <p className="text-white/60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-[#D4AF37]">Notification settings</h1>
        <Link href="/dashboard/broker/alerts" className="text-sm text-[#D4AF37]/80 underline-offset-4 hover:underline">
          Alert center
        </Link>
      </div>

      <p className="text-white/60">Choose channels, alert categories, and quiet hours. Delivery runs when `LECIPM_NOTIFICATION_DELIVERY_V1=true`.</p>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}

      <section className="mt-8 space-y-3 rounded-lg border border-white/10 bg-black/40 p-4">
        <h2 className="text-sm font-medium text-white/90">Consent</h2>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.consentGranted} onChange={() => toggle("consentGranted")} />
          I agree to receive property and investor alerts on the channels I enable below.
        </label>
      </section>

      <section className="mt-6 space-y-3 rounded-lg border border-white/10 bg-black/40 p-4">
        <h2 className="text-sm font-medium text-white/90">Channels</h2>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.emailEnabled} onChange={() => toggle("emailEnabled")} />
          Email
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.emailOptIn} onChange={() => toggle("emailOptIn")} />
          Email opt-in (required to send investor alerts by email)
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.smsEnabled} onChange={() => toggle("smsEnabled")} />
          SMS
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.smsOptIn} onChange={() => toggle("smsOptIn")} />
          SMS opt-in (phone must be verified on your account)
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.pushEnabled} onChange={() => toggle("pushEnabled")} />
          Push (browser / in-app via web push)
        </label>
      </section>

      <section className="mt-6 grid gap-3 rounded-lg border border-white/10 bg-black/40 p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-white/70">Override email</span>
          <input
            className="mt-1 w-full rounded border border-white/15 bg-black/60 px-3 py-2 text-sm text-white"
            value={form.emailAddress ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, emailAddress: e.target.value || null }))}
            placeholder="Leave blank to use account email"
            type="email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-white/70">Override phone (E.164)</span>
          <input
            className="mt-1 w-full rounded border border-white/15 bg-black/60 px-3 py-2 text-sm text-white"
            value={form.phoneNumber ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value || null }))}
            placeholder="+1…"
            type="tel"
          />
        </label>
      </section>

      <section className="mt-6 space-y-3 rounded-lg border border-white/10 bg-black/40 p-4">
        <h2 className="text-sm font-medium text-white/90">Alert categories</h2>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.alertNewDeals} onChange={() => toggle("alertNewDeals")} />
          New deals / listing status
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.alertPriceDrop} onChange={() => toggle("alertPriceDrop")} />
          Price drops
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.alertScoreChange} onChange={() => toggle("alertScoreChange")} />
          Score and confidence changes
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.alertBuyBox} onChange={() => toggle("alertBuyBox")} />
          Buy box / opportunity signals
        </label>
      </section>

      <section className="mt-6 grid gap-3 rounded-lg border border-white/10 bg-black/40 p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-white/70">Quiet hours start (hour 0–23)</span>
          <input
            className="mt-1 w-full rounded border border-white/15 bg-black/60 px-3 py-2 text-sm text-white"
            value={form.quietHoursStart ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, quietHoursStart: v === "" ? null : Number(v) }));
            }}
            placeholder="e.g. 22"
            type="number"
            min={0}
            max={23}
          />
        </label>
        <label className="block text-sm">
          <span className="text-white/70">Quiet hours end (hour 0–23)</span>
          <input
            className="mt-1 w-full rounded border border-white/15 bg-black/60 px-3 py-2 text-sm text-white"
            value={form.quietHoursEnd ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, quietHoursEnd: v === "" ? null : Number(v) }));
            }}
            placeholder="e.g. 7"
            type="number"
            min={0}
            max={23}
          />
        </label>
      </section>

      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="mt-8 rounded bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </div>
  );
}
