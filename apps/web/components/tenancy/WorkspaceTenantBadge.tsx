"use client";

import { useEffect, useState } from "react";

type TenantInfo = { id: string; name: string; slug: string };

/**
 * Shows the active workspace name in hub headers. Reads tenant via cookie (httpOnly) on the server route.
 */
export function WorkspaceTenantBadge(props: { className?: string }) {
  const [tenant, setTenant] = useState<TenantInfo | null | undefined>(undefined);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tenants/current", { credentials: "include" });
        const j = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (j?.invalid) setInvalid(true);
        setTenant(j?.tenant ?? null);
      } catch {
        if (!cancelled) setTenant(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (tenant === undefined) {
    return (
      <span className={`text-xs text-slate-500 ${props.className ?? ""}`} aria-hidden>
        Workspace…
      </span>
    );
  }

  if (invalid) {
    return (
      <span className={`text-xs text-amber-400/90 ${props.className ?? ""}`} title="Select a workspace">
        Workspace unavailable
      </span>
    );
  }

  if (!tenant) {
    return (
      <span className={`text-xs text-slate-500 ${props.className ?? ""}`} title="No workspace selected">
        No workspace
      </span>
    );
  }

  return (
    <span
      className={`max-w-[14rem] truncate rounded border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-slate-200 ${props.className ?? ""}`}
      title={`Workspace: ${tenant.name}`}
    >
      <span className="text-slate-500">Workspace · </span>
      {tenant.name}
    </span>
  );
}
