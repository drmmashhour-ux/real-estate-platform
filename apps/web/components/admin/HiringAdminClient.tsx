"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HIRING_ROLES, HIRING_STAGES } from "@/src/modules/hiring/constants";

type Cand = { id: string; name: string; email: string };

export function HiringAdminClient({ candidates }: { candidates: Cand[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function post(url: string, body: object) {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function patch(url: string, body: object) {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {err ? (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</p>
      ) : null}

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">Add candidate</h3>
        <form
          className="mt-3 grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void post("/api/admin/hiring/candidates", {
              name: fd.get("name"),
              email: fd.get("email"),
              role: fd.get("role"),
              notes: fd.get("notes") || "",
            });
            e.currentTarget.reset();
          }}
        >
          <input name="name" required placeholder="Name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="Email" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <select name="role" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            {HIRING_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input name="notes" placeholder="Notes" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
          >
            Create
          </button>
        </form>
      </div>

      {candidates.length > 0 ? (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-white">Stage / interaction / rubric</h3>
            <form
              className="mt-3 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const cid = String(fd.get("cid"));
                void patch(`/api/admin/hiring/candidates/${cid}/stage`, { stage: fd.get("stage") });
              }}
            >
              <select name="cid" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Candidate…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="stage" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                {HIRING_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={busy} className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white disabled:opacity-50">
                Update stage
              </button>
            </form>
            <form
              className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const cid = String(fd.get("cid"));
                void post(`/api/admin/hiring/candidates/${cid}/interactions`, {
                  type: fd.get("itype"),
                  summary: fd.get("summary"),
                });
              }}
            >
              <select name="cid" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Candidate…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="itype" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="message">message</option>
                <option value="call">call</option>
                <option value="interview">interview</option>
              </select>
              <textarea name="summary" required rows={2} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <button type="submit" disabled={busy} className="rounded-lg bg-sky-700 px-3 py-2 text-sm text-white disabled:opacity-50">
                Log interaction
              </button>
            </form>
            <form
              className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const cid = String(fd.get("cid"));
                void post(`/api/admin/hiring/candidates/${cid}/evaluate`, {
                  communication: Number(fd.get("c")),
                  speed: Number(fd.get("sp")),
                  clarity: Number(fd.get("cl")),
                  closing: Number(fd.get("cl2")),
                });
              }}
            >
              <select name="cid" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Candidate…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <input name="c" type="number" min={0} max={10} placeholder="comm" required className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" />
                <input name="sp" type="number" min={0} max={10} placeholder="speed" required className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" />
                <input name="cl" type="number" min={0} max={10} placeholder="clarity" required className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" />
                <input name="cl2" type="number" min={0} max={10} placeholder="closing" required className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" />
              </div>
              <button type="submit" disabled={busy} className="rounded-lg bg-violet-700 px-3 py-2 text-sm text-white disabled:opacity-50">
                Save evaluation
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-white">Trial tasks</h3>
            <p className="mt-1 text-xs text-slate-500">Assign real tasks; submit results + quality (0–10) via task id from DB or list below.</p>
            <form
              className="mt-3 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const cid = String(fd.get("cid"));
                void post(`/api/admin/hiring/candidates/${cid}/trial`, { taskKey: fd.get("taskKey") });
              }}
            >
              <select name="cid" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="taskKey" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="contact_leads">contact_leads</option>
                <option value="close_one_user">close_one_user</option>
              </select>
              <button type="submit" disabled={busy} className="rounded-lg bg-amber-700 px-3 py-2 text-sm text-white disabled:opacity-50">
                Assign task
              </button>
            </form>
            <form
              className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const taskId = String(fd.get("taskId"));
                void patch(`/api/admin/hiring/trial/${taskId}`, {
                  resultSummary: fd.get("resultSummary"),
                  responseQuality: fd.get("rq") ? Number(fd.get("rq")) : null,
                });
              }}
            >
              <input
                name="taskId"
                required
                placeholder="Trial task UUID"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs"
              />
              <textarea name="resultSummary" required rows={2} placeholder="Results / evidence" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input name="rq" type="number" min={0} max={10} placeholder="response quality 0–10" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <button type="submit" disabled={busy} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:opacity-50">
                Submit trial results
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
