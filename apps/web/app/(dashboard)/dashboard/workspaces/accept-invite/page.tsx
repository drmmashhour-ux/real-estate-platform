"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    if (!token) {
      setStatus("err");
      setMessage("Missing invite token in URL.");
      return;
    }
    setStatus("working");
    setMessage(null);
    try {
      const res = await fetch("/api/workspaces/invites/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { error?: string; workspaceId?: string };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error ?? "Could not accept invite.");
        return;
      }
      setWorkspaceId(data.workspaceId ?? null);
      setStatus("ok");
      setMessage("You have joined the workspace.");
    } catch {
      setStatus("err");
      setMessage("Network error.");
    }
  }, [token]);

  useEffect(() => {
    if (started.current) return;
    if (!token) {
      setStatus("err");
      setMessage("Missing invite token.");
      return;
    }
    started.current = true;
    void run();
  }, [token, run]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-slate-100">
      <h1 className="text-xl font-semibold">Accept workspace invite</h1>
      {status === "working" ? <p className="mt-4 text-sm text-slate-400">Confirming…</p> : null}
      {message ? (
        <p className={`mt-4 text-sm ${status === "ok" ? "text-emerald-400" : "text-amber-200"}`}>{message}</p>
      ) : null}
      {status === "ok" && workspaceId ? (
        <Link
          href={`/dashboard/workspaces/${workspaceId}/team`}
          className="mt-6 inline-block rounded-md bg-emerald-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Open team dashboard
        </Link>
      ) : null}
      <p className="mt-8 text-xs text-slate-500">You must be signed in with the same email the invite was sent to.</p>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <Suspense fallback={<p className="p-8 text-slate-400">Loading…</p>}>
        <AcceptInviteInner />
      </Suspense>
    </div>
  );
}
