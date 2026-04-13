"use client";

import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { formatTikTokScriptSections, type TikTokScriptsPayload } from "@/lib/bnhub/tiktok-scripts";

type ListingOption = {
  id: string;
  listingCode: string | null;
  title: string;
  city: string;
  listingStatus: string;
};

type ApiOk = TikTokScriptsPayload & {
  ok: true;
  listing: { id: string; listingCode: string | null; title: string; city: string };
};

function scriptBlockText(s: TikTokScriptsPayload["scripts"][0]): string {
  return formatTikTokScriptSections(s);
}

function buildContentPack(
  listing: ApiOk["listing"],
  data: TikTokScriptsPayload
): string {
  const lines: string[] = [
    `BNHUB TikTok content pack`,
    `Listing: ${listing.title}`,
    `Code: ${listing.listingCode ?? listing.id}`,
    `City: ${listing.city}`,
    ``,
    `--- SCRIPTS ---`,
    ``,
  ];
  data.scripts.forEach((s, i) => {
    lines.push(`## ${i + 1}. ${s.style.replace(/_/g, " ")}`, scriptBlockText(s), ``);
  });
  lines.push(`--- CAPTIONS ---`, ``);
  data.captions.forEach((c, i) => {
    lines.push(`### Caption ${i + 1}`, c, ``);
  });
  lines.push(`--- HASHTAGS ---`, data.hashtags.join(" "));
  return lines.join("\n");
}

export function ContentGeneratorClient({ listings }: { listings: ListingOption[] }) {
  const { showToast } = useToast();
  const [listingId, setListingId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiOk | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedLabel = useMemo(() => {
    const row = listings.find((l) => l.id === listingId);
    if (!row) return "";
    const code = row.listingCode ? `${row.listingCode} · ` : "";
    return `${code}${row.title} — ${row.city}`;
  }, [listings, listingId]);

  const generate = useCallback(async () => {
    if (!listingId) {
      showToast("Choose a listing first.", "info");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/content-generator/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string } & Partial<ApiOk>;
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Generation failed");
        return;
      }
      if (json.ok && json.scripts && json.captions && json.hashtags && json.listing) {
        setResult(json as ApiOk);
        showToast("TikTok pack generated.", "success");
      } else {
        setError("Unexpected response");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [listingId, showToast]);

  const copyText = useCallback(
    async (label: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`Copied ${label}`, "success");
      } catch {
        showToast("Could not copy", "info");
      }
    },
    [showToast]
  );

  const downloadPack = useCallback(() => {
    if (!result) return;
    const body = buildContentPack(result.listing, result);
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeCode = (result.listing.listingCode ?? result.listing.id).replace(/[^\w-]+/g, "-");
    a.href = url;
    a.download = `bnhub-tiktok-${safeCode}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Download started", "success");
  }, [result, showToast]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="listing-select" className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            BNHUB listing
          </label>
          <select
            id="listing-select"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="w-full max-w-xl rounded-lg border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-premium-gold/50"
          >
            <option value="">Select a listing…</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {(l.listingCode ? `${l.listingCode} · ` : "") + l.title} — {l.city} ({l.listingStatus})
              </option>
            ))}
          </select>
          {selectedLabel ? <p className="truncate text-xs text-slate-500">{selectedLabel}</p> : null}
        </div>
        <button
          type="button"
          disabled={loading || !listingId}
          onClick={() => void generate()}
          className="shrink-0 rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Generating…" : "Generate TikTok content"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      {result ? (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Generated pack</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyText("full pack", buildContentPack(result.listing, result))}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
              >
                Copy full pack
              </button>
              <button
                type="button"
                onClick={downloadPack}
                className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-3 py-1.5 text-xs font-semibold text-premium-gold hover:bg-premium-gold/15"
              >
                Download content pack
              </button>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Scripts (5)</h3>
            <div className="grid gap-4 lg:grid-cols-1">
              {result.scripts.map((s, i) => (
                <div
                  key={`${s.style}-${i}`}
                  className="rounded-xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-premium-gold/90">
                      {i + 1}. {s.style.replace(/_/g, " ")}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyText(`script ${i + 1}`, scriptBlockText(s))}
                      className="rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10"
                    >
                      Copy script
                    </button>
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-slate-200">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Hook (first ~2 sec)</p>
                      <p className="mt-0.5 leading-relaxed">{s.hook}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Visual</p>
                      <p className="mt-0.5 leading-relaxed text-slate-300">{s.visual}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Value</p>
                      <p className="mt-0.5 leading-relaxed text-slate-300">{s.value}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">CTA (link in bio)</p>
                      <p className="mt-0.5 leading-relaxed">{s.cta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Captions</h3>
              <button
                type="button"
                onClick={() => void copyText("captions", result.captions.join("\n\n---\n\n"))}
                className="text-xs font-medium text-premium-gold hover:underline"
              >
                Copy all captions
              </button>
            </div>
            <ul className="space-y-2">
              {result.captions.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200 whitespace-pre-wrap"
                >
                  {c}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hashtags</h3>
              <button
                type="button"
                onClick={() => void copyText("hashtags", result.hashtags.join(" "))}
                className="text-xs font-medium text-premium-gold hover:underline"
              >
                Copy hashtags
              </button>
            </div>
            <p className="flex flex-wrap gap-2 text-sm leading-relaxed text-slate-300">
              {result.hashtags.map((h) => (
                <span key={h} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">
                  {h}
                </span>
              ))}
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
