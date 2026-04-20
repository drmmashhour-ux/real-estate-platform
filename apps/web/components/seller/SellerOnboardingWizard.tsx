"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSuppressFooterHistoryNav } from "@/components/layout/FooterHistoryNavContext";

const STEPS = ["Basic info", "Property address", "Ownership", "ID check", "Selling mode"] as const;
type SellHubMode = "FREE_HUB" | "PLATFORM_BROKER" | "PREFERRED_BROKER";

export function SellerOnboardingWizard() {
  useSuppressFooterHistoryNav(true);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [legalRiskAlert, setLegalRiskAlert] = useState<string | null>(null);
  const [brokerVerified, setBrokerVerified] = useState(false);
  const [basicInfo, setBasicInfo] = useState({ fullName: "", phone: "" });
  const [propertyAddress, setPropertyAddress] = useState({
    line1: "",
    city: "",
    region: "",
    postal: "",
    country: "",
  });
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [idPlaceholderDone, setIdPlaceholderDone] = useState(false);
  const [sellingMode, setSellingMode] = useState<SellHubMode>("FREE_HUB");

  const load = useCallback(async () => {
    const res = await fetch("/api/seller/onboarding", { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const o = (data.onboarding ?? {}) as Record<string, unknown>;
    const bi = (o.basicInfo as { fullName?: string; phone?: string }) ?? {};
    const pa = (o.propertyAddress as typeof propertyAddress) ?? {};
    setBasicInfo({ fullName: bi.fullName ?? "", phone: bi.phone ?? "" });
    setPropertyAddress({
      line1: pa.line1 ?? "",
      city: pa.city ?? "",
      region: pa.region ?? "",
      postal: pa.postal ?? "",
      country: pa.country ?? "",
    });
    setOwnershipConfirmed(o.ownershipConfirmed === true);
    setIdPlaceholderDone(typeof o.idVerifiedAt === "string");
    setBrokerVerified(data.brokerVerified === true);
    if (
      data.sellingMode === "FREE_HUB" ||
      data.sellingMode === "PLATFORM_BROKER" ||
      data.sellingMode === "PREFERRED_BROKER"
    ) {
      setSellingMode(data.sellingMode);
    }
    if (typeof o.lastStep === "number" && o.lastStep >= 1 && o.lastStep <= STEPS.length) {
      setStep(o.lastStep);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(partial: Record<string, unknown>, nextStep?: number) {
    setLoading(true);
    setErr(null);
    setInfo(null);
    setLegalRiskAlert(null);
    try {
      const res = await fetch("/api/seller/onboarding", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...partial, step: nextStep ?? step }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Save failed");
        return false;
      }
      if (typeof data.warning === "string" && data.warning.trim()) {
        setInfo(data.warning);
      }
      if (typeof data.legalRiskAlert === "string" && data.legalRiskAlert.trim()) {
        setLegalRiskAlert(data.legalRiskAlert.trim());
      }
      if (typeof data.brokerVerified === "boolean") {
        setBrokerVerified(data.brokerVerified);
      }
      if (
        data.sellingMode === "FREE_HUB" ||
        data.sellingMode === "PLATFORM_BROKER" ||
        data.sellingMode === "PREFERRED_BROKER"
      ) {
        setSellingMode(data.sellingMode);
      }
      return true;
    } finally {
      setLoading(false);
    }
  }

  async function onNext() {
    setErr(null);
    if (step === 1) {
      if (!basicInfo.fullName?.trim() || !basicInfo.phone?.trim()) {
        setErr("Name and phone are required.");
        return;
      }
      const ok = await save({ basicInfo }, 2);
      if (ok) setStep(2);
      return;
    }
    if (step === 2) {
      if (!propertyAddress.line1?.trim() || !propertyAddress.city?.trim()) {
        setErr("Street address and city are required.");
        return;
      }
      const ok = await save({ propertyAddress }, 3);
      if (ok) setStep(3);
      return;
    }
    if (step === 3) {
      if (!ownershipConfirmed) {
        setErr("Confirm that you are the owner or authorized to sell.");
        return;
      }
      const ok = await save({ ownershipConfirmed: true }, 4);
      if (ok) setStep(4);
      return;
    }
    if (step === 4) {
      const ok = await save({ idVerificationPlaceholder: true }, 5);
      if (ok) {
        setIdPlaceholderDone(true);
        setStep(5);
      }
      return;
    }
    if (step === 5) {
      const ok = await save({ sellingMode, completed: true }, 5);
      if (ok) {
        router.push("/seller/create-listing");
        router.refresh();
      }
    }
  }

  function onBack() {
    setErr(null);
    setStep((s) => Math.max(1, s - 1));
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href="/seller/dashboard" className="text-sm text-premium-gold hover:underline">
        ← Seller dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-white">Sell Hub onboarding</h1>
      <p className="mt-2 text-sm text-slate-400">
        A few steps to set up your seller profile. ID verification below is a placeholder for a future KYC flow.
      </p>
      {!brokerVerified ? (
        <p className="mt-2 text-xs text-amber-300">
          Broker paths require a verified broker license. Until that verification is approved, you can continue in Sell Hub free / non-broker mode.
        </p>
      ) : null}

      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-premium-gold transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Step {step} of {STEPS.length}: {STEPS[step - 1]}
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-5">
        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-slate-400">Full name</span>
              <input
                value={basicInfo.fullName}
                onChange={(e) => setBasicInfo((b) => ({ ...b, fullName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Phone</span>
              <input
                value={basicInfo.phone}
                onChange={(e) => setBasicInfo((b) => ({ ...b, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-slate-400">Street address</span>
              <input
                value={propertyAddress.line1}
                onChange={(e) => setPropertyAddress((p) => ({ ...p, line1: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">City</span>
              <input
                value={propertyAddress.city}
                onChange={(e) => setPropertyAddress((p) => ({ ...p, city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-slate-400">Region / state</span>
                <input
                  value={propertyAddress.region}
                  onChange={(e) => setPropertyAddress((p) => ({ ...p, region: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-400">Postal code</span>
                <input
                  value={propertyAddress.postal}
                  onChange={(e) => setPropertyAddress((p) => ({ ...p, postal: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-slate-400">Country</span>
              <input
                value={propertyAddress.country}
                onChange={(e) => setPropertyAddress((p) => ({ ...p, country: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={ownershipConfirmed}
              onChange={(e) => setOwnershipConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>I confirm I am the legal owner of this property, or I am authorized to represent the owner in selling it.</span>
          </label>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              Identity verification will be connected to a KYC provider in production. For now, acknowledge this step to continue.
            </p>
            {idPlaceholderDone ? (
              <p className="text-emerald-400/90">Recorded — you can proceed.</p>
            ) : (
              <p className="text-slate-500">Click Continue to mark this placeholder step complete.</p>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-400">Choose your Sell Hub path.</p>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 p-3 text-white">
              <input
                type="radio"
                name="mode"
                checked={sellingMode === "FREE_HUB"}
                onChange={() => setSellingMode("FREE_HUB")}
              />
              Sell Hub Free
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 p-3 text-white">
              <input
                type="radio"
                name="mode"
                checked={sellingMode === "PLATFORM_BROKER"}
                onChange={() => setSellingMode("PLATFORM_BROKER")}
                disabled={!brokerVerified}
              />
              Sell Hub with platform broker
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 p-3 text-white">
              <input
                type="radio"
                name="mode"
                checked={sellingMode === "PREFERRED_BROKER"}
                onChange={() => setSellingMode("PREFERRED_BROKER")}
                disabled={!brokerVerified}
              />
              Sell Hub with preferred real estate broker
            </label>
            {!brokerVerified ? (
              <p className="text-xs text-amber-300">
                Broker license verification is still missing or not approved, so broker listing modes are disabled.
              </p>
            ) : null}
          </div>
        )}

        {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}
        {info ? <p className="mt-4 text-sm text-amber-300">{info}</p> : null}
        {legalRiskAlert ? (
          <p className="mt-4 rounded-lg border border-amber-500/40 bg-red-950/40 px-3 py-2 text-sm text-amber-200">
            {legalRiskAlert}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            disabled={loading}
            onClick={() => void onNext()}
            className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? "…" : step === 5 ? "Finish" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
