"use client";

import { useEffect, useRef, useState } from "react";
import { PrintPageButton } from "@/components/ui/PrintPageButton";

export function ClientSignatureActions(props: {
  submissionId: string;
  initialStatus: string;
  initialClientName: string | null;
}) {
  const [status, setStatus] = useState(props.initialStatus);
  const [signerName, setSignerName] = useState(props.initialClientName ?? "");
  const [signatureText, setSignatureText] = useState(props.initialClientName ?? "");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#020617";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#f8fafc";
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.lineJoin = "round";
  }, []);

  async function confirmSignature() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/forms/${props.submissionId}/confirm-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, signatureText, signatureDataUrl, returnNote }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error ?? "Could not sign and return the file.");
        return;
      }
      setStatus(typeof data?.status === "string" ? data.status : "completed");
      setMessage("Signed and returned successfully.");
    } catch {
      setMessage("Could not sign and return the file.");
    } finally {
      setBusy(false);
    }
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function beginDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getCanvasPoint(event);
    if (!canvas || !context || !point) return;
    isDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getCanvasPoint(event);
    if (!canvas || !context || !point) return;
    context.lineTo(point.x, point.y);
    context.stroke();
    setSignatureDataUrl(canvas.toDataURL("image/png"));
  }

  function endDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    isDrawingRef.current = false;
  }

  function clearSignaturePad() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#020617";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#f8fafc";
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.lineJoin = "round";
    setSignatureDataUrl("");
  }

  const isCompleted = status === "completed";

  return (
    <div className="print:hidden mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-emerald-100">Signature actions</h2>
          <p className="mt-1 text-sm text-slate-400">
            The client can sign and return this file directly from the platform.
          </p>
        </div>
        <PrintPageButton
          label="Print client file"
          className="rounded-lg border border-emerald-400/40 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/10"
        />
      </div>

      <div className="mt-4 max-w-xl space-y-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Signer name</label>
          <input
            type="text"
            value={signerName}
            onChange={(event) => setSignerName(event.target.value)}
            disabled={isCompleted}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400 disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Digital signature
          </label>
          <input
            type="text"
            value={signatureText}
            onChange={(event) => setSignatureText(event.target.value)}
            disabled={isCompleted}
            placeholder="Type your full name as signature"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400 disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-slate-500">
            Type your name or draw it below. Either method can be returned with the client file.
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-200">
              Draw signature
            </label>
            <button
              type="button"
              onClick={clearSignaturePad}
              disabled={isCompleted}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-emerald-400 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={720}
            height={220}
            onPointerDown={beginDrawing}
            onPointerMove={draw}
            onPointerUp={endDrawing}
            onPointerLeave={endDrawing}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 touch-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Your drawn signature is stored with the return record.
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Return note
          </label>
          <textarea
            value={returnNote}
            onChange={(event) => setReturnNote(event.target.value)}
            disabled={isCompleted}
            placeholder="Optional note to broker or admin"
            className="min-h-[96px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={confirmSignature}
            disabled={
              busy ||
              isCompleted ||
              !signerName.trim() ||
              (!signatureText.trim() && !signatureDataUrl)
            }
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {isCompleted ? "Signed and returned" : busy ? "Sending..." : "Sign and return"}
          </button>
          <span className="text-sm text-slate-400">Current status: {status}</span>
        </div>
        {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      </div>
    </div>
  );
}
