import type { ReactNode } from "react";

type Props = {
  sidebar: ReactNode;
  main: ReactNode;
  wide: ReactNode;
};

/** Phone: stacked sections. Tablet+: filters left, list center/detail right or map. */
export function MobileTabletSplit({ sidebar, main, wide }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_1fr_1fr] lg:gap-0 lg:rounded-2xl lg:border lg:border-white/10 lg:overflow-hidden">
      <aside className="lg:border-r lg:border-white/10 lg:bg-black/40">{sidebar}</aside>
      <section className="lg:border-r lg:border-white/10 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">{main}</section>
      <section className="hidden min-h-[240px] lg:block lg:bg-[#070707] lg:p-4">{wide}</section>
    </div>
  );
}
