import { describe, expect, it } from "vitest";
import {
  expectedLeadsByDay,
  expectedOperatorsByDay,
  getGtmPhase,
  KPI_MILESTONES,
} from "../growth-execution.service";

describe("growth-execution.service KPI ramps", () => {
  it("hits day-30 milestones at day 30", () => {
    expect(expectedOperatorsByDay(30)).toBeCloseTo(KPI_MILESTONES.day30.operators, 5);
    expect(expectedLeadsByDay(30)).toBeCloseTo(KPI_MILESTONES.day30.leads, 5);
  });

  it("hits day-60 milestones at day 60", () => {
    expect(expectedOperatorsByDay(60)).toBeCloseTo(KPI_MILESTONES.day60.operators, 5);
    expect(expectedLeadsByDay(60)).toBeCloseTo(KPI_MILESTONES.day60.leads, 5);
  });

  it("hits day-90 milestones at day 90", () => {
    expect(expectedOperatorsByDay(90)).toBeCloseTo(KPI_MILESTONES.day90.operators, 5);
    expect(expectedLeadsByDay(90)).toBeCloseTo(KPI_MILESTONES.day90.leads, 5);
  });

  it("maps phases", () => {
    expect(getGtmPhase(0)).toBe(1);
    expect(getGtmPhase(14)).toBe(1);
    expect(getGtmPhase(15)).toBe(2);
    expect(getGtmPhase(30)).toBe(2);
    expect(getGtmPhase(31)).toBe(3);
    expect(getGtmPhase(60)).toBe(3);
    expect(getGtmPhase(61)).toBe(4);
  });
});
