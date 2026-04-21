"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useCallback, useState } from "react";
import { BrokerVerificationBadge } from "@/components/brokers/BrokerVerificationBadge";

const STEP_COUNT = 7;

type Props = {
  initialName: string | null;
  initialEmail: string;
  initialPhone: string | null;
};

async function postEvent(body: Record<string, unknown>) {
  await fetch("/api/onboarding/broker/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
}

export function BrokerLecipmOnboardingWizard({ initialName, initialEmail, initialPhone }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [agency, setAgency] = useState("");
  const [experience, setExperience] = useState("");

  const progressPct = Math.round(((step + 1) / STEP_COUNT) * 100);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  }, []);

  const onSkipStep = useCallback(async () => {
    setError(null);
    try {
      await postEvent({ kind: "step_complete", stepIndex: step, payload: { skipped: true } });
    } catch {
      /* non-blocking */
    }
    goNext();
  }, [goNext, step]);

  const onExit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await postEvent({ kind: "skip_flow", fromStepIndex: step });
      router.push("/dashboard/broker");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not exit");
    } finally {
      setSaving(false);
    }
  }, [router, step]);

  const saveAccountAndContinue = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          marketplacePersona: "BROKER",
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not save");
      await postEvent({
        kind: "step_complete",
        stepIndex: 0,
        payload: { hasName: Boolean(name.trim()), hasPhone: Boolean(phone.trim()) },
      });
      goNext();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [goNext, name, phone, router]);

  const onContinue = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      await postEvent({
        kind: "step_complete",
        stepIndex: step,
        payload:
          step === 1
            ? {
                hasLicense: Boolean(licenseNumber.trim()),
                hasAgency: Boolean(agency.trim()),
                hasExperience: Boolean(experience.trim()),
              }
            : {},
      });
      goNext();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [agency, experience, goNext, licenseNumber, step]);

  const onFinish = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await postEvent({
        kind: "complete",
        payload: {
          licenseNumber: licenseNumber.trim() || undefined,
          agency: agency.trim() || undefined,
          experience: experience.trim() || undefined,
        },
      });
      const res = await fetch("/api/me/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ marketplacePersona: "BROKER" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not finalize");
      }
      router.push("/dashboard/broker");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [agency, experience, licenseNumber, router]);

  const navLinkClass = "text-sm font-medium text-premium-gold hover:text-amber-300";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-2 flex-1 min-w-[120px] max-w-md overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-premium-gold transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-xs text-slate-500">
          Step {step + 1} of {STEP_COUNT}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={`${navLinkClass}`} onClick={() => void onExit()} disabled={saving}>
          Exit to dashboard
        </button>
        <button type="button" className="text-sm text-slate-500 hover:text-slate-300" onClick={() => void onSkipStep()} disabled={saving}>
          Skip this step
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {step === 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Account setup</h2>
          <p className="text-sm text-slate-400">Confirm how clients reach you — max one or two actions per screen.</p>
          <label className="block text-sm text-slate-300">
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-amber-500/30 focus:ring-2"
              autoComplete="name"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Email
            <input
              value={initialEmail}
              readOnly
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-slate-400"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-amber-500/30 focus:ring-2"
              autoComplete="tel"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveAccountAndContinue()}
            className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Broker profile</h2>
          <p className="text-sm text-slate-400">Professional details help trust and routing (stored with your completion event).</p>
          <label className="block text-sm text-slate-300">
            License number
            <input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-amber-500/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Agency / brokerage
            <input
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-amber-500/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Experience (years or summary)
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-amber-500/30 focus:ring-2"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onContinue()}
            className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Insurance & Professional coverage</h2>
          <p className="text-sm text-slate-400">
            Maintain valid errors & omissions (E&O) and provincial obligations. Below is your verification badge when available.
          </p>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
            <p className="font-semibold text-emerald-50">Insured broker mindset</p>
            <p className="mt-1 text-emerald-100/90">
              LECIPM surfaces trust signals for consumers. Keep coverage current — this summary is informational, not a certificate.
            </p>
          </div>
          <BrokerVerificationBadge />
          <button
            type="button"
            disabled={saving}
            onClick={() => void onContinue()}
            className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Connect listings</h2>
          <p className="text-sm text-slate-400">
            Use LECIPM alongside your MLS workflow (e.g. Centris). Publish select inventory here to reach AI-forward buyers and
            capture structured leads.
          </p>
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-300">
            <li>Keep your authoritative listing on your board tools.</li>
            <li>Mirror or promote on LECIPM for narrative, scoring, and conversion.</li>
          </ul>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onContinue()}
            className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">First listing (guided)</h2>
          <p className="text-sm text-slate-400">
            Use the AI-assisted listing flow to generate title, description, and pricing suggestions — review before publish.
          </p>
          <Link
            href="/dashboard/seller/listings/new"
            className="inline-flex rounded-xl border border-premium-gold/50 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
          >
            Open listing wizard
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onContinue()}
            className="block rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            I’m ready — continue tour
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Your dashboard</h2>
          <p className="text-sm text-slate-400">Three surfaces you will use every week:</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "Leads", desc: "Inquiry CRM & follow-ups", href: "/dashboard/crm" },
              { title: "Deals", desc: "Offers through closing", href: "/dashboard/deals" },
              { title: "AI suggestions", desc: "Autopilot & scoring", href: "/dashboard/broker" },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-4 text-sm hover:border-premium-gold/40"
              >
                <p className="font-semibold text-white">{c.title}</p>
                <p className="mt-1 text-xs text-slate-400">{c.desc}</p>
              </Link>
            ))}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onContinue()}
            className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 6 ? (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-white">First action</h2>
          <p className="text-sm text-slate-400">Pick one — both drive activation metrics.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={saving}
              className="rounded-xl bg-premium-gold px-5 py-3 text-center text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              onClick={async () => {
                await postEvent({ kind: "activation_cta", cta: "first_listing" });
                router.push("/dashboard/seller/listings/new");
              }}
            >
              Generate your first AI listing
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-xl border border-premium-gold/50 px-5 py-3 text-center text-sm font-semibold text-premium-gold hover:bg-premium-gold/10 disabled:opacity-50"
              onClick={async () => {
                await postEvent({ kind: "activation_cta", cta: "first_lead" });
                router.push("/dashboard/crm");
              }}
            >
              View your leads
            </button>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onFinish()}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
          >
            Finish onboarding
          </button>
        </section>
      ) : null}
    </div>
  );
}
