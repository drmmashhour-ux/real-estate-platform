"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Activity, Bell, MessageSquare, Stethoscope, Video } from "lucide-react";

export type FamilyTile = {
  key: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: "camera" | "chat" | "alerts" | "health" | "services";
};

const ICONS: Record<FamilyTile["icon"], LucideIcon> = {
  camera: Video,
  chat: MessageSquare,
  alerts: Bell,
  health: Activity,
  services: Stethoscope,
};

export function FamilyTileGrid(props: { tiles: FamilyTile[]; basePath: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {props.tiles.map((t) => {
        const Icon = ICONS[t.icon];
        const href = t.href.startsWith("/") ? t.href : `${props.basePath.replace(/\/$/, "")}/${t.href}`;
        return (
          <Link
            key={t.key}
            href={href}
            className="group flex min-h-[140px] flex-col justify-between rounded-3xl border border-[#D4AF37]/22 bg-gradient-to-br from-[#101010] to-[#060606] p-6 shadow-lg shadow-black/40 transition hover:border-[#D4AF37]/55 hover:shadow-[#D4AF37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4AF37]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-2xl border border-[#D4AF37]/25 bg-black/50 p-3 text-[#D4AF37] transition group-hover:bg-[#D4AF37]/12">
                <Icon className="h-10 w-10" strokeWidth={1.5} aria-hidden />
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-white">{t.title}</h3>
              {t.subtitle ? (
                <p className="mt-2 text-sm leading-snug text-white/50">{t.subtitle}</p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
