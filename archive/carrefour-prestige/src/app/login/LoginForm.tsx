"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      return;
    }
    const redirect = searchParams.get("redirect") ?? "/dashboard";
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-light text-white">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
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
          className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="rounded-full bg-[#d4af37] py-2 font-semibold text-[#030712]"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-emerald-200/60">
        No account?{" "}
        <Link href="/register" className="text-[#d4af37]">
          Register
        </Link>
      </p>
    </div>
  );
}
