"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const roles = ["BUYER", "SELLER", "BROKER", "INVESTOR"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("BUYER");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-light text-white">Create account</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof roles)[number])}
          className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="rounded-full bg-[#d4af37] py-2 font-semibold text-[#030712]"
        >
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-emerald-200/60">
        Already have an account? <Link href="/login" className="text-[#d4af37]">Login</Link>
      </p>
    </div>
  );
}
