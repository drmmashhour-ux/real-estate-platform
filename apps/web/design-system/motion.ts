/** Durations in ms — smooth, no bounce (Part 6). */
export const motion = {
  hover: 150,
  sidebarCollapse: 280,
  modalOpen: 200,
  drawerSlide: 240,
  pageFade: 180,
  tabFade: 160,
  shimmer: 1.8,
} as const;

export const easing = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
} as const;
