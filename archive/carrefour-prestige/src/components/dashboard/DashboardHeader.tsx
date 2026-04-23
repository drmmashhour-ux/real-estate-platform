"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-emerald-900/50 bg-[#061510] px-4 py-3">
      <Link href="/dashboard" className="text-sm font-semibold text-[#d4af37]">
        Dashboard
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-xs text-emerald-200/70 hover:text-white"
      >
        Sign out
      </button>
    </header>
  );
}
