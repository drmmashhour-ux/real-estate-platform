import { describe, expect, it } from "vitest";
import {
  buildExecutionPlannerNavigationHref,
  navigationPayloadFromSurface,
} from "@/modules/growth/growth-task-navigation";

describe("safe navigation payload", () => {
  it("includes from and taskId in growth surface href", () => {
    const { href, query } = navigationPayloadFromSurface(
      "en",
      "ca",
      "task-1",
      "growth:capital_allocation",
    );
    expect(query.from).toBe("execution-planner");
    expect(query.taskId).toBe("task-1");
    expect(href).toContain("from=execution-planner");
    expect(href).toContain("taskId=task-1");
    expect(href).toContain("#growth-mc-capital-allocation");
  });

  it("buildExecutionPlannerNavigationHref matches payload href for base case", () => {
    const direct = buildExecutionPlannerNavigationHref({
      locale: "fr",
      country: "ca",
      taskId: "t2",
      targetSurface: "growth:revenue",
    });
    const { href } = navigationPayloadFromSurface("fr", "ca", "t2", "growth:revenue");
    expect(direct).toBe(href);
  });
});
