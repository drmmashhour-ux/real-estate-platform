"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type FamilyRow = {
  id: string;
  canViewCamera: boolean;
  canChat: boolean;
  canReceiveAlerts: boolean;
  familyUser: { id: string; email: string | null; name: string | null };
};

type ResidentVm = {
  id: string;
  careLevel: string;
  user: { email: string | null; name: string | null };
  residence: { title: string; city: string };
  familyAccess: FamilyRow[];
};

type EventVm = {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  resident: {
    user: { name: string | null };
    residence: { title: string };
  };
};

export function AdminSoinsLuxuryClient(props: {
  adminBase: string;
  residents: ResidentVm[];
  recentEvents: EventVm[];
  residenceCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function patchFamily(
    residentId: string,
    familyUserId: string,
    patch: Partial<Pick<FamilyRow, "canViewCamera" | "canChat" | "canReceiveAlerts">>,
    current: Pick<FamilyRow, "canViewCamera" | "canChat" | "canReceiveAlerts">,
  ) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/soins/admin/family-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId,
          familyUserId,
          canViewCamera: patch.canViewCamera ?? current.canViewCamera,
          canChat: patch.canChat ?? current.canChat,
          canReceiveAlerts: patch.canReceiveAlerts ?? current.canReceiveAlerts,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j.error === "string" ? j.error : "Update failed");
      } else {
        window.location.reload();
      }
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF37]/20 pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]/75">LECIPM Command</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Soins Hub</h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Residents, escalations, and family permission overrides. Events fan out via push, email, SMS (when
            configured).
          </p>
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/18 bg-[#0D0D0D] px-5 py-3 text-right">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">Care residences</div>
          <div className="text-2xl font-semibold text-[#D4AF37]">{props.residenceCount}</div>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/25 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">Residents</h2>
          <div className="mt-4 space-y-4">
            {props.residents.length === 0 ? (
              <p className="text-sm text-white/45">No resident profiles yet.</p>
            ) : (
              props.residents.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[22px] border border-[#D4AF37]/14 bg-[#080808] p-5 shadow-inner shadow-black/40"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <div className="text-lg font-medium">{r.residence.title}</div>
                      <div className="text-xs text-white/45">
                        {r.residence.city} · {r.careLevel}
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        {r.user.name ?? r.user.email ?? "Resident"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/35">Family access</div>
                    <div className="mt-3 space-y-3">
                      {r.familyAccess.length === 0 ? (
                        <p className="text-xs text-white/40">No linked family accounts.</p>
                      ) : (
                        r.familyAccess.map((f) => (
                          <div
                            key={f.id}
                            className="flex flex-col gap-2 rounded-xl border border-white/8 bg-black/30 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="text-white/80">{f.familyUser.email ?? f.familyUser.id}</div>
                            <div className="flex flex-wrap gap-3 text-xs">
                              <label className="flex cursor-pointer items-center gap-1.5 text-white/60">
                                <input
                                  type="checkbox"
                                  className="accent-[#D4AF37]"
                                  checked={f.canViewCamera}
                                  disabled={pending}
                                  onChange={(e) =>
                                    patchFamily(r.id, f.familyUser.id, { canViewCamera: e.target.checked }, f)
                                  }
                                />
                                Camera
                              </label>
                              <label className="flex cursor-pointer items-center gap-1.5 text-white/60">
                                <input
                                  type="checkbox"
                                  className="accent-[#D4AF37]"
                                  checked={f.canChat}
                                  disabled={pending}
                                  onChange={(e) =>
                                    patchFamily(r.id, f.familyUser.id, { canChat: e.target.checked }, f)
                                  }
                                />
                                Chat
                              </label>
                              <label className="flex cursor-pointer items-center gap-1.5 text-white/60">
                                <input
                                  type="checkbox"
                                  className="accent-[#D4AF37]"
                                  checked={f.canReceiveAlerts}
                                  disabled={pending}
                                  onChange={(e) =>
                                    patchFamily(r.id, f.familyUser.id, { canReceiveAlerts: e.target.checked }, f)
                                  }
                                />
                                Alerts
                              </label>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">Recent care events</h2>
          <div className="mt-4 max-h-[720px] space-y-2 overflow-y-auto pr-1">
            {props.recentEvents.length === 0 ? (
              <p className="text-sm text-white/45">No events logged.</p>
            ) : (
              props.recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-[#D4AF37]/12 bg-[#0D0D0D] px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-white/45">
                    <span>
                      {ev.type} · <span className="text-[#D4AF37]/90">{ev.severity}</span>
                    </span>
                    <span>{new Date(ev.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-white/85">{ev.message}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {ev.resident.residence.title} · {ev.resident.user.name ?? "Resident"}
                  </p>
                </div>
              ))
            )}
          </div>
          <p className="mt-6 text-xs text-white/35">
            API :{" "}
            <code className="text-white/50">
              GET /api/mobile/soins/events?residentId=…
            </code>
          </p>
        </section>
      </div>
    </div>
  );
}
