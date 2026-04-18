"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type TabsCtx = { value: string; setValue: (v: string) => void };

const Ctx = createContext<TabsCtx | null>(null);

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  children,
  className = "",
}: {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;
  const setValue = useCallback(
    (v: string) => {
      if (!isControlled) setUncontrolled(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange],
  );
  const ctx = useMemo(() => ({ value, setValue }), [value, setValue]);
  return (
    <Ctx.Provider value={ctx}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={[
        "flex flex-wrap gap-1 rounded-xl border border-ds-border bg-ds-surface p-1",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = "",
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("TabsTrigger must be inside Tabs");
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={[
        "min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold transition",
        active ? "bg-ds-card text-ds-text shadow-ds-soft" : "text-ds-text-secondary hover:text-ds-text",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = "",
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("TabsContent must be inside Tabs");
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={["mt-4 animate-ds-fade-in", className].join(" ")}>
      {children}
    </div>
  );
}
