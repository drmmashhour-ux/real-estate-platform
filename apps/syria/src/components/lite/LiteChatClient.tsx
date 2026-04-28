"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { listMessages } from "@repo/offline";
import { SYRIA_OFFLINE_NAMESPACE } from "@/lib/offline/constants";

type Row = { id: string; text: string; savedAt?: number };

export function LiteChatClient() {
  const t = useTranslations("UltraLite");
  const [lines, setLines] = useState<Row[]>([]);

  useEffect(() => {
    void (async () => {
      const raw = await listMessages(SYRIA_OFFLINE_NAMESPACE);
      const next: Row[] = [];
      for (const row of raw) {
        const v = row.value as { text?: unknown; savedAt?: unknown };
        if (typeof v.text === "string" && v.text.trim()) {
          next.push({
            id: row.id,
            text: v.text.trim(),
            savedAt: typeof v.savedAt === "number" ? v.savedAt : row.updatedAt,
          });
        }
      }
      setLines(next);
    })();
  }, []);

  return (
    <div>
      <p className="mb-3 text-[12px] text-neutral-700">{t("chatIntro")}</p>
      <ul className="list-none space-y-2 p-0">
        {lines.map((l) => (
          <li key={l.id} className="rounded border border-neutral-200 bg-white px-2 py-1 text-[12px]">
            <span className="font-semibold text-neutral-800">{t("chatUserLabel")}:</span> {l.text}
          </li>
        ))}
      </ul>
      {lines.length === 0 ? <p className="text-neutral-500">{t("chatEmpty")}</p> : null}
    </div>
  );
}
