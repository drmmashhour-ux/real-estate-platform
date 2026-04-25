export type TaskNode = {
  id: string;
  dependsOn: string[];
  toolKey: string;
};

export function topologicalOrder(nodes: TaskNode[]): TaskNode[] {
  const done = new Set<string>();
  const out: TaskNode[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  function visit(id: string) {
    if (done.has(id)) return;
    const n = byId.get(id);
    if (!n) return;
    for (const d of n.dependsOn) visit(d);
    done.add(id);
    out.push(n);
  }
  for (const n of nodes) visit(n.id);
  return out;
}
