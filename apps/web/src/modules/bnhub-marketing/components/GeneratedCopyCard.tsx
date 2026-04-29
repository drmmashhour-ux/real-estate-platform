"use client";

import { useState } from "react";
import type { BnhubMarketingAsset } from "@/types/bnhub-client-models";
import { m } from "./marketing-ui-classes";

export function GeneratedCopyCard({
  asset,
  onSave,
}: {
  asset: BnhubMarketingAsset;
  onSave?: (id: string, content: string) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(asset.content);

  const copy = async () => {
    await navigator.clipboard.writeText(asset.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={m.cardMuted}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-500/90">
          {asset.assetType.replace(/_/g, " ")}
        </span>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{asset.languageCode}</span>
        {asset.aiGenerated ? (
          <span className="rounded bg-violet-950/60 px-1.5 py-0.5 text-[10px] text-violet-300">AI</span>
        ) : null}
        {asset.humanEdited ? (
          <span className="rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] text-amber-200">Edited</span>
        ) : null}
      </div>
      {asset.title ? <p className="mb-1 text-sm font-medium text-white">{asset.title}</p> : null}
      {editing ? (
        <textarea
          className={`${m.input} min-h-[120px] font-mono text-xs`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-sm text-zinc-300">{asset.content}</pre>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={m.btnGhost} onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
        {onSave ? (
          editing ? (
            <button
              type="button"
              className={m.btnPrimary}
              onClick={async () => {
                await onSave(asset.id, draft);
                setEditing(false);
              }}
            >
              Save
            </button>
          ) : (
            <button type="button" className={m.btnGhost} onClick={() => setEditing(true)}>
              Edit
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
