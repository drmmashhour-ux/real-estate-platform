"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EnforceableTemplateKind } from "@/lib/legal/enforceable-contract-templates";

type Props = {
  kind: EnforceableTemplateKind;
  /** FSBO listing id (seller flow). */
  fsboListingId?: string;
  /** Generic listing id (buyer offer, short-term stay). */
  listingId?: string;
  onSuccess?: (contractId: string) => void;
  className?: string;
};

/**
 * E-sign style capture: show text, require checkbox + typed legal name; optional drawn signature (data URL).
 */
export function ContractSign({ kind, fsboListingId, listingId, onSuccess, className = "" }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [agree, setAgree] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    clearCanvas();
  }, [clearCanvas]);

  function canvasPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = canvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = canvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function useCanvasSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL("image/png"));
  }

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/legal/enforceable-contract/template?kind=${encodeURIComponent(kind)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (typeof j.title === "string") setTitle(j.title);
        if (typeof j.body === "string") setBody(j.body);
        if (typeof j.version === "string") setVersion(j.version);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/legal/enforceable-contract/sign", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          agree,
          signerName,
          fsboListingId: fsboListingId ?? undefined,
          listingId: listingId ?? undefined,
          signatureData: signatureData ?? undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(typeof j.error === "string" ? j.error : "Could not sign");
      }
      if (typeof j.contractId === "string") {
        onSuccess?.(j.contractId);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-black/50 p-5 text-slate-200",
        className,
      ].join(" ")}
    >
      {loading ? (
        <p className="text-sm text-slate-500">Loading agreement…</p>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-[11px] text-slate-500">Version {version}</p>
          <div className="mt-4 max-h-[min(360px,50vh)] overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-slate-300">
            <pre className="whitespace-pre-wrap font-sans">{body}</pre>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black"
            />
            <span>
              <strong className="text-white">I agree</strong> — I have read this agreement and understand it is not legal
              advice.
            </span>
          </label>

          <label className="mt-3 block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full legal name</span>
            <input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-white"
              placeholder="Type your name as signature"
              autoComplete="name"
            />
          </label>

          <details className="mt-3 text-sm text-slate-500">
            <summary className="cursor-pointer text-slate-400">Optional drawn signature</summary>
            <p className="mt-2 text-xs">
              Draw below, then use signature — or paste a data URL. Typed legal name above is sufficient if you skip this.
            </p>
            <div className="mt-3 space-y-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="w-full max-w-md touch-none rounded-lg border border-white/15 bg-white"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCanvas();
                    setSignatureData(null);
                  }}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300"
                >
                  Clear pad
                </button>
                <button
                  type="button"
                  onClick={() => useCanvasSignature()}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white"
                >
                  Use drawn signature
                </button>
              </div>
              <textarea
                value={signatureData ?? ""}
                onChange={(e) => setSignatureData(e.target.value || null)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 font-mono text-[10px] text-slate-400"
                rows={2}
                placeholder="Or paste data:image/png;base64,..."
              />
            </div>
          </details>

          {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

          <button
            type="button"
            disabled={busy || !agree || signerName.trim().length < 2}
            onClick={() => void submit()}
            className="mt-4 w-full rounded-xl bg-[#C9A646] py-3 text-sm font-bold text-black disabled:opacity-40"
          >
            {busy ? "Saving…" : "Sign & continue"}
          </button>
        </>
      )}
    </div>
  );
}
