"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OnboardingMarketplacePersona } from "@/lib/marketplace/persona";
import { SELLER_PLANS } from "@/lib/marketplace/seller-plan";

type Props = {
  persona: OnboardingMarketplacePersona;
  redirectPath: string;
  showSellerPlan?: boolean;
};

export function MarketplaceOnboardingForm({ persona, redirectPath, showSellerPlan }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [sellerPlan, setSellerPlan] = useState<string>("basic");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/me/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplacePersona: persona,
          ...(showSellerPlan ? { sellerPlan } : {}),
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save");
        return;
      }
      router.push(redirectPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="mob-name" className="block text-sm font-medium text-slate-300">
          Name <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="mob-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-amber-500/30 focus:ring-2"
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="mob-phone" className="block text-sm font-medium text-slate-300">
          Phone <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="mob-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-amber-500/30 focus:ring-2"
          autoComplete="tel"
        />
      </div>

      {persona === "SELLER_DIRECT" ? (
        <div>
          <label htmlFor="mob-address" className="block text-sm font-medium text-slate-300">
            Address <span className="text-slate-500">(recommended)</span>
          </label>
          <textarea
            id="mob-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 outline-none ring-amber-500/30 focus:ring-2"
            placeholder="Street, city, postal code"
          />
        </div>
      ) : null}

      {showSellerPlan ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-300">Seller plan</legend>
          <p className="text-xs text-slate-500">You can change this later in account settings.</p>
          <div className="space-y-2">
            {SELLER_PLANS.map((id) => (
              <label
                key={id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:border-slate-600"
              >
                <input
                  type="radio"
                  name="sellerPlan"
                  value={id}
                  checked={sellerPlan === id}
                  onChange={() => setSellerPlan(id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium capitalize text-slate-200">{id}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {id === "basic" && "List yourself — lowest cost."}
                    {id === "assisted" && "AI guidance + support."}
                    {id === "premium" && "Platform broker option + priority."}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Continue to dashboard"}
      </button>
    </form>
  );
}
