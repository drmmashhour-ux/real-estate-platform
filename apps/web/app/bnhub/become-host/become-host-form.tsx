"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Condo",
  "Villa",
  "Cabin",
  "Other",
];

export function BecomeHostForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: "",
    location: "",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bnhub/host/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Application failed");
      router.push("/dashboard/bnhub/host?applied=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Phone
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Property type
        </label>
        <select
          value={form.propertyType}
          onChange={(e) =>
            setForm((f) => ({ ...f, propertyType: e.target.value }))
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        >
          <option value="">Select...</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Location
        </label>
        <input
          type="text"
          required
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          placeholder="City or address"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={4}
          placeholder="Tell us about your property..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-rose-500 py-3 font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
