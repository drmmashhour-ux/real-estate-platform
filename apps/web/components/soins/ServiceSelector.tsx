"use client";

import type { CareServiceKind } from "@prisma/client";

export type ServiceOption = {
  id: string;
  name: string;
  type: CareServiceKind;
  price: number;
  selected?: boolean;
  disabled?: boolean;
};

const typeLabel: Record<CareServiceKind, string> = {
  MEDICAL: "Médical",
  DAILY_LIVING: "Quotidien",
  SAFETY: "Sécurité",
};

export function ServiceSelector(props: {
  services: ServiceOption[];
  onToggle: (id: string, selected: boolean) => void;
  currency?: string;
}) {
  const cur = props.currency ?? "CAD";

  return (
    <ul className="space-y-3" role="list">
      {props.services.map((s) => (
        <li key={s.id}>
          <label
            className={`flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 transition ${
              s.selected
                ? "border-[#D4AF37]/45 bg-[#D4AF37]/8"
                : "border-white/12 bg-[#0D0D0D] hover:border-[#D4AF37]/25"
            } ${s.disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <input
              type="checkbox"
              className="mt-1 h-6 w-6 shrink-0 accent-[#D4AF37]"
              checked={!!s.selected}
              disabled={s.disabled}
              onChange={(e) => props.onToggle(s.id, e.target.checked)}
            />
            <span className="flex-1">
              <span className="block text-lg font-medium text-white">{s.name}</span>
              <span className="mt-0.5 block text-sm text-[#EAB308]/90">{typeLabel[s.type]}</span>
              <span className="mt-2 block text-sm text-white/50">
                {s.price.toLocaleString(undefined, { style: "currency", currency: cur })}
                <span className="text-white/35"> / mois</span>
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
