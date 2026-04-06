import type { ReactNode } from "react";

export default function HubEngineLayout({ children }: { children: ReactNode }) {
  return <div className="hub-engine-root">{children}</div>;
}
