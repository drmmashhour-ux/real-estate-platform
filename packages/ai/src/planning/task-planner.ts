import type { TaskNode } from "./task-graph";
import { topologicalOrder } from "./task-graph";

export function buildTaskPlanFromGoals(goals: string[]): TaskNode[] {
  const nodes: TaskNode[] = goals.map((g, i) => ({
    id: `t-${i}`,
    dependsOn: i > 0 ? [`t-${i - 1}`] : [],
    toolKey: g,
  }));
  return topologicalOrder(nodes);
}
