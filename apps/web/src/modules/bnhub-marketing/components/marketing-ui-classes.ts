/** Shared BNHub / LECIPM marketing surfaces: black + gold premium. */
export const m = {
  page: "min-h-screen bg-zinc-950 text-zinc-100",
  card: "rounded-2xl border border-amber-500/20 bg-zinc-900/60 p-5 shadow-lg shadow-black/40 backdrop-blur-sm",
  cardMuted: "rounded-xl border border-zinc-800 bg-zinc-900/40 p-4",
  title: "text-lg font-semibold tracking-tight text-white",
  subtitle: "text-sm text-zinc-400",
  accent: "text-amber-400",
  btnPrimary:
    "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-zinc-950 shadow hover:from-amber-400 hover:to-amber-500",
  btnGhost:
    "inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-amber-500/40 hover:text-white",
  input:
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30",
  label: "mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500",
} as const;
