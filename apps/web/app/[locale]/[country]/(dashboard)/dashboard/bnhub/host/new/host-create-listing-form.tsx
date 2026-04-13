"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function HostCreateListingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    maxGuests: "4",
    images: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const price = parseFloat(form.price);
      if (Number.isNaN(price) || price < 0) {
        throw new Error("Enter a valid price");
      }
      const images = form.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/bnhub/host/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          location: form.location.trim(),
          price,
          maxGuests: parseInt(form.maxGuests, 10) || 4,
          images,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      router.push("/dashboard/bnhub/host");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5"
    >
      <div>
        <label className="mb-1 block text-sm font-medium opacity-80">Title</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Cozy downtown apartment"
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium opacity-80">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={4}
          placeholder="Describe your property..."
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium opacity-80">
          Location
        </label>
        <input
          type="text"
          required
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          placeholder="City or full address"
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium opacity-80">
            Price per night ($)
          </label>
          <input
            type="number"
            required
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="120"
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium opacity-80">
            Max guests
          </label>
          <input
            type="number"
            min={1}
            value={form.maxGuests}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxGuests: e.target.value }))
            }
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium opacity-80">
          Image URLs
        </label>
        <input
          type="text"
          value={form.images}
          onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
          placeholder="https://...jpg, https://...jpg"
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
        />
        <p className="mt-1 text-xs opacity-60">Comma-separated list of image URLs</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--hub-accent)" }}
        >
          {loading ? "Creating..." : "Create listing"}
        </button>
        <Link
          href="/dashboard/bnhub/host"
          className="text-sm font-medium opacity-80 hover:opacity-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
