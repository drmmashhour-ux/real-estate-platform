"use client";

import * as React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function Tabs({
  defaultValue,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string }) {
  const [active, setActive] = React.useState(defaultValue ?? "");

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

const TabsContext = React.createContext<{
  active: string;
  setActive: (v: string) => void;
}>({ active: "", setActive: () => {} });

function useTabsContext() {
  return React.useContext(TabsContext);
}

function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-white/5 p-1 text-white/60",
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}

function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { active, setActive } = useTabsContext();
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active === value}
      onClick={() => setActive(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
        active === value
          ? "bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm"
          : "text-white/60 hover:text-white/80",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { active } = useTabsContext();
  if (active !== value) return null;
  return (
    <div
      role="tabpanel"
      className={cn("mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
