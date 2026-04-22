"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Grid3X3, MessageSquare, Video } from "lucide-react";

type Item = { href: string; label: string; icon: typeof Video };

export function SoinsBottomNav(props: { basePath: string }) {
  const pathname = usePathname();
  const root = props.basePath.replace(/\/$/, "");

  const items: Item[] = [
    { href: `${root}/family`, label: "Accueil", icon: Grid3X3 },
    { href: `${root}/family/camera`, label: "Caméra", icon: Video },
    { href: `${root}/family/alerts`, label: "Alertes", icon: Bell },
    { href: `${root}/family/chat`, label: "Messages", icon: MessageSquare },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D4AF37]/25 bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Navigation Soins famille"
    >
      <ul className="mx-auto flex max-w-lg justify-around px-2 pt-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                  active ? "text-[#D4AF37]" : "text-white/45"
                }`}
              >
                <Icon className="h-7 w-7" strokeWidth={1.6} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
