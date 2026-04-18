"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CommandCenterV2TabId } from "../company-command-center-v2.types";

const TABS: { id: CommandCenterV2TabId; label: string }[] = [
  { id: "executive", label: "Executive" },
  { id: "growth", label: "Growth" },
  { id: "ranking", label: "Ranking" },
  { id: "brain", label: "Brain" },
  { id: "swarm", label: "Swarm" },
  { id: "rollouts", label: "Rollouts" },
];

function parseTab(raw: string | null): CommandCenterV2TabId {
  const ok = TABS.some((t) => t.id === raw);
  return ok ? (raw as CommandCenterV2TabId) : "executive";
}

export function CompanyCommandCenterTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: CommandCenterV2TabId;
  onTabChange?: (id: CommandCenterV2TabId) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(id: CommandCenterV2TabId) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    onTabChange?.(id);
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-px">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => select(t.id)}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === t.id
              ? "bg-zinc-900 text-amber-300"
              : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function useCommandCenterV2TabFromUrl(): CommandCenterV2TabId {
  const searchParams = useSearchParams();
  return parseTab(searchParams.get("tab"));
}
