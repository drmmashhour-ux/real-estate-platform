"use client";

import { useState } from "react";

type HostApp = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  documentUrl: string | null;
  status: string;
  createdAt: Date;
  user: { id: string; name: string | null; email: string };
};

type BrokerApp = {
  id: string;
  fullName: string;
  email: string;
  licenseNumber: string;
  authority: string;
  status: string;
  createdAt: Date;
  user: { id: string; name: string | null; email: string };
};

type DeveloperApp = {
  id: string;
  companyName: string;
  registrationNumber: string;
  email: string;
  status: string;
  createdAt: Date;
  user: { id: string; name: string | null; email: string };
};

export function ProfessionalVerificationsClient({
  hostApplications,
  brokerApplications,
  developerApplications,
}: {
  hostApplications: HostApp[];
  brokerApplications: BrokerApp[];
  developerApplications: DeveloperApp[];
}) {
  const [hostApps, setHostApps] = useState(hostApplications);
  const [brokerApps, setBrokerApps] = useState(brokerApplications);
  const [devApps, setDevApps] = useState(developerApplications);
  const [loading, setLoading] = useState<string | null>(null);

  const totalPending = hostApps.filter((a) => a.status === "pending").length
    + brokerApps.filter((a) => a.status === "pending").length
    + devApps.filter((a) => a.status === "pending").length;

  async function approve(type: "host" | "broker" | "developer", id: string) {
    const base = type === "host" ? "/api/admin/host/applications"
      : type === "broker" ? "/api/admin/brokers/applications"
      : "/api/admin/developer/applications";
    setLoading(`${type}-${id}`);
    try {
      const res = await fetch(`${base}/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      if (type === "host") setHostApps((prev) => prev.filter((a) => a.id !== id));
      else if (type === "broker") setBrokerApps((prev) => prev.filter((a) => a.id !== id));
      else setDevApps((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // keep list on error
    } finally {
      setLoading(null);
    }
  }

  async function reject(type: "host" | "broker" | "developer", id: string) {
    const base = type === "host" ? "/api/admin/host/applications"
      : type === "broker" ? "/api/admin/brokers/applications"
      : "/api/admin/developer/applications";
    setLoading(`reject-${type}-${id}`);
    try {
      const res = await fetch(`${base}/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "" }),
      });
      if (!res.ok) throw new Error("Failed");
      if (type === "host") setHostApps((prev) => prev.filter((a) => a.id !== id));
      else if (type === "broker") setBrokerApps((prev) => prev.filter((a) => a.id !== id));
      else setDevApps((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // keep list on error
    } finally {
      setLoading(null);
    }
  }

  const pendingHost = hostApps.filter((a) => a.status === "pending");
  const pendingBroker = brokerApps.filter((a) => a.status === "pending");
  const pendingDev = devApps.filter((a) => a.status === "pending");

  return (
    <section className="border-b border-slate-800 px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="text-lg font-semibold text-slate-200">Professional applications</h2>
      <p className="mt-1 text-sm text-slate-400">
        Approve or reject host, broker, and developer applications. Approved → account active; Rejected → restricted.
      </p>
      {totalPending === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No pending applications.</p>
      ) : (
        <div className="mt-4 space-y-6">
          {pendingHost.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-400">Host (BNHUB)</h3>
              <ul className="mt-2 space-y-2">
                {pendingHost.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                    <span className="text-slate-200">{a.fullName} — {a.email}</span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approve("host", a.id)}
                        disabled={loading !== null}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reject("host", a.id)}
                        disabled={loading !== null}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pendingBroker.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-amber-400">Broker (Real Estate)</h3>
              <ul className="mt-2 space-y-2">
                {pendingBroker.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                    <span className="text-slate-200">{a.fullName} — {a.email} — {a.licenseNumber} ({a.authority})</span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approve("broker", a.id)}
                        disabled={loading !== null}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reject("broker", a.id)}
                        disabled={loading !== null}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pendingDev.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-emerald-400">Developer (Projects)</h3>
              <ul className="mt-2 space-y-2">
                {pendingDev.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                    <span className="text-slate-200">{a.companyName} — {a.registrationNumber} — {a.email}</span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approve("developer", a.id)}
                        disabled={loading !== null}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reject("developer", a.id)}
                        disabled={loading !== null}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
