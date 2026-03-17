"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type DemoUser = { id: string; email: string; name: string | null; role: string };

function BNHubLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/bnhub";
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/demo-users")
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLSelectElement)?.value;
    if (!email) {
      setError("Select a user");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/demo-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/bnhub"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to BNHub
          </Link>
        </div>
      </section>
      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-slate-100">Sign in to book</h1>
          <p className="mt-1 text-sm text-slate-400">
            Choose a demo account to continue. (Production will use auth-service.)
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Account
              </label>
              <select
                name="email"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                <option value="">Select user…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.name ?? u.email} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || submitting || users.length === 0}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {!loading && users.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">
              No demo users. Run <code className="rounded bg-slate-800 px-1">npx prisma db seed</code> in
              apps/web-app.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default function BNHubLoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="bg-slate-950/90">
          <div className="mx-auto max-w-md px-4 py-12 text-center text-slate-400">
            Loading…
          </div>
        </section>
      </main>
    }>
      <BNHubLoginForm />
    </Suspense>
  );
}
