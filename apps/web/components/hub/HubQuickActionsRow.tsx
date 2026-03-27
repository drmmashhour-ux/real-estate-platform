import type { ReactNode } from "react";

type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type HubQuickActionsRowProps = {
  actions: Action[];
  accent?: string;
  children?: ReactNode;
  className?: string;
};

export function HubQuickActionsRow({
  actions,
  accent = "#1e3a8a",
  children,
  className = "",
}: HubQuickActionsRowProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {children}
      {actions.map((a) =>
        a.href ? (
          <a
            key={a.label}
            href={a.href}
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${accent}20, ${accent}12)`,
              color: accent,
              border: `1px solid ${accent}30`,
              boxShadow: `0 8px 22px ${accent}14`,
            }}
          >
            {a.label}
          </a>
        ) : (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${accent}20, ${accent}12)`,
              color: accent,
              border: `1px solid ${accent}30`,
              boxShadow: `0 8px 22px ${accent}14`,
            }}
          >
            {a.label}
          </button>
        )
      )}
    </div>
  );
}
