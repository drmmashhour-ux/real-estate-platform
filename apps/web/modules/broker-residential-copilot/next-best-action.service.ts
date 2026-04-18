import type { ResidentialPriorityItem } from "./broker-residential-copilot.types";

export function mergePriorityCap(items: ResidentialPriorityItem[], max = 10): ResidentialPriorityItem[] {
  return items
    .sort((a, b) => a.rank - b.rank)
    .slice(0, max)
    .map((x, i) => ({ ...x, rank: i + 1 }));
}
