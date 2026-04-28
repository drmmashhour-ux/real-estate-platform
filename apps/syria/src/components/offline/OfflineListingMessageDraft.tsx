"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { enqueueAction, putMessage } from "@repo/offline";
import { SYRIA_OFFLINE_NAMESPACE } from "@/lib/offline/constants";

export function OfflineListingMessageDraft(props: { listingId: string; disabled?: boolean }) {
  const { listingId, disabled } = props;
  const t = useTranslations("Offline");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const id = window.setTimeout(() => setSaved(false), 4000);
    return () => window.clearTimeout(id);
  }, [saved]);

  async function persist() {
    const trimmed = text.trim();
    const draftKey = crypto.randomUUID();
    await putMessage(SYRIA_OFFLINE_NAMESPACE, draftKey, {
      listingId,
      text: trimmed,
      pendingSync: true,
      savedAt: Date.now(),
    });
    await enqueueAction(SYRIA_OFFLINE_NAMESPACE, {
      id: crypto.randomUUID(),
      type: "message",
      payload: { draftKey },
      clientVersion: 1,
    });
    setSaved(true);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 [dir=rtl]:text-right">
      <label className="block text-xs font-medium text-neutral-600">{t("draftMessagePlaceholder")}</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={3}
        className="mt-1 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-sm text-neutral-900 outline-none ring-amber-500/30 focus:border-amber-300 focus:ring-2 disabled:opacity-60"
      />
      <button
        type="button"
        disabled={disabled || !text.trim()}
        className="mt-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40"
        onClick={() => void persist()}
      >
        {saved ? t("draftMessageSaved") : t("draftSaveCta")}
      </button>
    </div>
  );
}
