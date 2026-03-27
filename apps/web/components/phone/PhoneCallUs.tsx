"use client";

import { useEffect, useState } from "react";

type Config = { phoneNumber: string; phoneTelLink: string; hasPhone: boolean };

export function PhoneCallUs({
  className = "",
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch("/api/config", { credentials: "same-origin" })
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  if (!config?.hasPhone) return null;

  return (
    <span className={className}>
      {showLabel && <span className="text-slate-400">{config.phoneNumber}</span>}
      {" "}
      <a
        href={config.phoneTelLink}
        className="font-medium text-emerald-400 hover:text-emerald-300"
      >
        Call Us
      </a>
    </span>
  );
}
