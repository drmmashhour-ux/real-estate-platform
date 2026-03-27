"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { HubSwitcher } from "./HubSwitcher";

type AppHeaderProps = {
  showAdminInSwitcher?: boolean;
};

export function AppHeader({ showAdminInSwitcher = false }: AppHeaderProps) {
  return (
    <header className="relative z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8">
        <div className="min-w-0 shrink-0">
          <Logo showName={true} className="text-slate-50" />
        </div>
        <nav className="flex flex-shrink-0 flex-wrap items-center justify-end gap-3 text-xs font-medium text-slate-300 sm:gap-4 sm:text-sm">
          <Link href="/" className="hover:text-emerald-300">
            Home
          </Link>
          <Link href="/projects" className="hover:text-emerald-300">
            Projects
          </Link>
          <Link href="/marketplace" className="hover:text-emerald-300">
            Marketplace
          </Link>
          <HubSwitcher showAdmin={showAdminInSwitcher} />
        </nav>
      </div>
    </header>
  );
}
