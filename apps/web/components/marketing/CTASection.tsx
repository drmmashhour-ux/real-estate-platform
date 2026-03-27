"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

export function CTASection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg(null);
    try {
      const res = await fetch("/api/marketing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role: role.trim() || undefined }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setStatus("err");
        setMsg(j.error ?? "Could not submit. Try again.");
        return;
      }
      setStatus("ok");
      setMsg("Thanks — we’ll be in touch.");
      setName("");
      setEmail("");
      setRole("");
    } catch {
      setStatus("err");
      setMsg("Network error.");
    }
  }

  return (
    <section id="cta" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Get started"
          title="Start listing with confidence"
          subtitle="Get your first property verified in minutes. Request access — we’ll follow up with onboarding and next steps."
        />
        <AnimatedReveal>
          <div className="mx-auto max-w-xl rounded-3xl border border-[#C9A646]/25 bg-gradient-to-br from-[#C9A646]/10 to-transparent p-8 shadow-2xl">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/#cta"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#C9A646] px-6 py-3 text-sm font-semibold text-black min-w-[140px] hover:brightness-110"
              >
                Get Early Access
              </Link>
              <Link
                href="/contact"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white min-w-[140px] hover:border-[#C9A646]/50"
              >
                Book a Demo
              </Link>
            </div>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Name</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#C9A646]/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Email *</label>
                <input
                  required
                  type="email"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#C9A646]/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="lead-role">
                  Role (optional)
                </label>
                <select
                  id="lead-role"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#C9A646]/50"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="">Select…</option>
                  <option value="broker">Broker</option>
                  <option value="agency">Agency</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-white py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:opacity-50"
              >
                {status === "loading" ? "Sending…" : "Request access"}
              </button>
              {msg ? <p className="text-center text-sm text-slate-400">{msg}</p> : null}
            </form>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
