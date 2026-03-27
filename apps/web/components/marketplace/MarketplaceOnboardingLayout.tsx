import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export function MarketplaceOnboardingLayout({ title, description, children }: Props) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-lg">
        <Link href="/dashboard" className="text-sm text-amber-400/90 hover:text-amber-300">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
        {children}
      </div>
    </main>
  );
}
