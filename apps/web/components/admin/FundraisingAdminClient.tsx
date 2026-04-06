"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FUNDRAISING_STAGES,
  INVESTOR_COMMITMENT_STATUSES,
} from "@/src/modules/fundraising/constants";

type Inv = {
  id: string;
  name: string;
  email: string;
  firm: string;
  stage: string;
  nextFollowUpAt: string | null;
  _count: { interactions: number; deals: number };
};

export function FundraisingAdminClient({
  investors,
  roundId,
}: {
  investors: Inv[];
  roundId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    router.refresh();
  }

  async function postJson(url: string, body: object) {
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
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function patchJson(url: string, body: object) {
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
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {err ? (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-violet-900/50 bg-violet-950/20 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">$100K round — commitment</h3>
          <p className="mt-1 text-xs text-slate-500">
            Creates a row tied to the open $100K round (round is created automatically if missing).
          </p>
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const body: Record<string, unknown> = {
                investorId: fd.get("investorId"),
                amount: Number(fd.get("amount")),
                status: fd.get("cstatus") || "interested",
              };
              if (roundId) body.roundId = roundId;
              void postJson("/api/admin/fundraising/commitments", body);
              e.currentTarget.reset();
            }}
          >
            <select
              name="investorId"
              required
              disabled={investors.length === 0}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Investor…</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              min={0}
              step={1000}
              required
              placeholder="Amount"
              className="w-32 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <select
              name="cstatus"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              {INVESTOR_COMMITMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy || investors.length === 0}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              Add commitment
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-violet-900/50 bg-violet-950/20 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">Update commitment</h3>
          <p className="mt-1 text-xs text-slate-500">
            Paste commitment id from the table above to change status or amount (re-syncs round total).
          </p>
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const id = String(fd.get("commitmentId") ?? "").trim();
              const status = fd.get("newStatus");
              const amtRaw = fd.get("newAmount");
              const body: Record<string, unknown> = {};
              if (status) body.status = status;
              if (amtRaw != null && String(amtRaw).trim() !== "") {
                body.amount = Number(amtRaw);
              }
              void patchJson(`/api/admin/fundraising/commitments/${id}`, body);
              e.currentTarget.reset();
            }}
          >
            <input
              name="commitmentId"
              required
              placeholder="Commitment UUID"
              className="min-w-[240px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs"
            />
            <select
              name="newStatus"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">Status (optional)</option>
              {INVESTOR_COMMITMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              name="newAmount"
              type="number"
              min={0}
              step={1000}
              placeholder="New amount"
              className="w-36 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg border border-violet-600 px-4 py-2 text-sm text-violet-200 hover:bg-violet-950 disabled:opacity-50"
            >
              Update
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Add investor</h3>
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void postJson("/api/admin/fundraising/investors", {
                name: fd.get("name"),
                email: fd.get("email"),
                firm: fd.get("firm") || "",
                stage: fd.get("stage") || "contacted",
                notes: fd.get("notes") || "",
              });
              e.currentTarget.reset();
            }}
          >
            <input
              name="name"
              required
              placeholder="Name"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              name="firm"
              placeholder="Firm"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <select name="stage" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              {FUNDRAISING_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <textarea
              name="notes"
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Save investor
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Log interaction / outreach</h3>
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const investorId = String(fd.get("investorId") ?? "");
              const mode = String(fd.get("mode") ?? "interaction");
              if (mode === "interaction") {
                void postJson(`/api/admin/fundraising/investors/${investorId}/interactions`, {
                  type: fd.get("itype"),
                  summary: fd.get("summary"),
                });
              } else {
                void postJson("/api/admin/fundraising/outreach", {
                  investorId,
                  action: fd.get("action"),
                  message: fd.get("summary"),
                  nextFollowUpAt: fd.get("nextFollowUpAt") || undefined,
                });
              }
              e.currentTarget.reset();
            }}
          >
            <select
              name="investorId"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">Select investor…</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — {i.firm || i.email}
                </option>
              ))}
            </select>
            <select name="mode" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option value="interaction">Typed interaction</option>
              <option value="outreach">Outreach / response / follow-up</option>
            </select>
            <select name="itype" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option value="email">email</option>
              <option value="call">call</option>
              <option value="meeting">meeting</option>
            </select>
            <select name="action" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option value="outreach">outreach message</option>
              <option value="response">response</option>
              <option value="followup">follow-up</option>
            </select>
            <input
              type="datetime-local"
              name="nextFollowUpAt"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <textarea
              name="summary"
              required
              placeholder="Summary / message"
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              Log
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Deal</h3>
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void postJson("/api/admin/fundraising/deals", {
                investorId: fd.get("investorId"),
                amount: Number(fd.get("amount")),
                status: fd.get("status") || "open",
              });
              e.currentTarget.reset();
            }}
          >
            <select
              name="investorId"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">Select investor…</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              min={0}
              step={1000}
              required
              placeholder="Amount"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <select name="status" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option value="open">open</option>
              <option value="committed">committed</option>
              <option value="closed">closed</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              Create deal
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Update stage / deal status</h3>
          <div className="mt-3 space-y-4">
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const id = String(fd.get("investorId") ?? "");
                void patchJson(`/api/admin/fundraising/investors/${id}/stage`, { stage: fd.get("stage") });
              }}
            >
              <select
                name="investorId"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Investor…</option>
                {investors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <select name="stage" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                {FUNDRAISING_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Set stage
              </button>
            </form>
            <form
              className="space-y-2 border-t border-slate-800 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const id = String(fd.get("dealId") ?? "");
                void patchJson(`/api/admin/fundraising/deals/${id}`, { status: fd.get("dstatus") });
              }}
            >
              <input
                name="dealId"
                required
                placeholder="Deal UUID"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs"
              />
              <select name="dstatus" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="open">open</option>
                <option value="committed">committed</option>
                <option value="closed">closed</option>
              </select>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Update deal
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
