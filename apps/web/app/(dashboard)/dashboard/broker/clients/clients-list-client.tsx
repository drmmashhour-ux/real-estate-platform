"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BrokerClient, BrokerClientStatus } from "@prisma/client";
import { ClientStatusBadge } from "@/components/crm/broker-crm/ClientStatusBadge";
import { BrokerCrmStagingBadge } from "@/components/crm/broker-crm/BrokerCrmStagingBadge";

type Row = BrokerClient & {
  interactions: {
    id: string;
    type: string;
    title: string | null;
    message: string | null;
    createdAt: string;
    completedAt: string | null;
  }[];
};

export function BrokerClientsListClient({ isAdmin }: { isAdmin: boolean }) {
  const [clients, setClients] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [tags, setTags] = useState("");
  const [sort, setSort] = useState<"newest" | "updated">("newest");
  const [brokerId, setBrokerId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    if (tags.trim()) params.set("tags", tags.trim());
    params.set("sort", sort === "updated" ? "updated" : "newest");
    if (isAdmin && brokerId.trim()) params.set("brokerId", brokerId.trim());

    void fetch(`/api/broker/clients?${params.toString()}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; clients?: Row[]; error?: string }) => {
        if (!j.ok) {
          setErr(j.error ?? "Could not load");
          return;
        }
        setErr(null);
        setClients(j.clients ?? []);
      })
      .catch(() => setErr("Network error"));
  }

  useEffect(() => {
    load();
  }, [status, sort, isAdmin, brokerId]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [q, tags]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setCreating(true);
    setCreateErr(null);
    const body: Record<string, unknown> = { fullName: fullName.trim() };
    if (isAdmin && brokerId.trim()) body.brokerId = brokerId.trim();
    const res = await fetch("/api/broker/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; client?: { id: string }; error?: string };
    setCreating(false);
    if (!res.ok) {
      setCreateErr(j.error ?? "Could not create");
      return;
    }
    setShowCreate(false);
    setFullName("");
    if (j.client?.id) window.location.href = `/dashboard/broker/clients/${j.client.id}`;
    else load();
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Clients</h2>
          <p className="mt-1 text-sm text-slate-400">Search, filter, and open a record.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BrokerCrmStagingBadge />
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            New client
          </button>
        </div>
      </div>

      {showCreate ? (
        <form
          onSubmit={create}
          className="rounded-xl border border-white/10 bg-black/30 p-4"
        >
          <p className="text-sm font-medium text-white">Create client</p>
          {isAdmin ? (
            <label className="mt-3 block text-xs text-slate-400">
              Broker user ID
              <input
                className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
                value={brokerId}
                onChange={(e) => setBrokerId(e.target.value)}
                placeholder="Broker cuid (required for admin)"
                required={isAdmin}
              />
            </label>
          ) : null}
          <label className="mt-3 block text-xs text-slate-400">
            Full name
            <input
              className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          {createErr ? <p className="mt-2 text-sm text-red-300">{createErr}</p> : null}
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              className="text-sm text-slate-400 hover:text-white"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          placeholder="Search name, email, phone, city, tag…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="w-44 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          placeholder="Tags (comma)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <select
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All stages</option>
          <option value="LEAD">Lead</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="VIEWING">Viewing</option>
          <option value="NEGOTIATING">Negotiating</option>
          <option value="UNDER_CONTRACT">Under contract</option>
          <option value="CLOSED">Closed</option>
          <option value="LOST">Lost</option>
        </select>
        <select
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "updated")}
        >
          <option value="newest">Newest</option>
          <option value="updated">Recently updated</option>
        </select>
        {isAdmin ? (
          <input
            className="w-52 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white"
            placeholder="Filter broker ID"
            value={brokerId}
            onChange={(e) => setBrokerId(e.target.value)}
          />
        ) : null}
      </div>

      {err ? <p className="text-sm text-red-300">{err}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 bg-black/40 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Last activity</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const last = c.interactions[0];
              return (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/broker/clients/${c.id}`} className="font-medium text-emerald-300 hover:underline">
                      {c.fullName}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ClientStatusBadge status={c.status as BrokerClientStatus} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">{c.targetCity ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {c.budgetMin != null || c.budgetMax != null
                      ? `${c.budgetMin != null ? `$${c.budgetMin.toLocaleString()}` : "—"} – ${c.budgetMax != null ? `$${c.budgetMax.toLocaleString()}` : "—"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {last
                      ? `${last.type.replace(/_/g, " ")} · ${new Date(last.createdAt).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {c.tags?.length ? c.tags.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/broker/clients/${c.id}`}
                      className="text-xs font-medium text-emerald-400/90 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {clients.length === 0 && !err ? (
          <p className="p-6 text-center text-sm text-slate-500">No clients match.</p>
        ) : null}
      </div>
    </div>
  );
}
