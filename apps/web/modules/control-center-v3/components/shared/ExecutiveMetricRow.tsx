"use client";

import Link from "next/link";

export function ExecutiveMetricRow({
  items,
}: {
  items: { label: string; value: string; href: string | null }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {items.map((k) => (
        <div key={k.label} className="rounded-lg border border-zinc-800 bg-zinc-900/20 px-3 py-2">
          <p className="text-[10px] text-zinc-500">{k.label}</p>
          <p className="mt-1 text-sm font-medium text-zinc-100">
            {k.href ? (
              <Link href={k.href} className="text-amber-300/90 hover:text-amber-200">
                {k.value}
              </Link>
            ) : (
              k.value
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
