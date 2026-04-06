"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { AIChatWindow } from "./AIChatWindow";

const GOLD = "#D4AF37";

export function AIAssistantPanel({
  title = "LECIPM Manager AI",
  subtitle = "AI-managed real estate & stays marketplace",
  context,
  agentKey,
}: {
  title?: string;
  subtitle?: string;
  context: { listingId?: string; bookingId?: string; role?: string; surface?: string };
  agentKey?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4 text-white shadow-lg">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: GOLD }}>
            {title}
          </h2>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
        <span className="text-xs text-white/40">{open ? t("ai.chatPanelHide") : t("ai.chatPanelOpen")}</span>
      </button>
      {open ? (
        <div className="mt-4">
          <AIChatWindow context={context} agentKey={agentKey} className="min-h-[220px]" />
        </div>
      ) : null}
    </section>
  );
}
