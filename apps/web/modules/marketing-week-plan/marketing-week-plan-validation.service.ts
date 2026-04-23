import type { WeeklyContentItem } from "./marketing-week-plan.types";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateContentItem(item: WeeklyContentItem): ValidationResult {
  const errors: string[] = [];

  if (!item.hook || item.hook.length < 10) {
    errors.push("Hook is too short or missing.");
  }

  if (!item.cta) {
    errors.push("CTA is missing.");
  }

  if (!item.caption.toLowerCase().includes(item.city.toLowerCase())) {
    errors.push(`City reference (${item.city}) is missing in caption.`);
  }

  if (item.caption.length < 20) {
    errors.push("Caption is too short.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateWeeklyPlan(items: WeeklyContentItem[]): ValidationResult {
  const allErrors: string[] = [];
  const titles = new Set<string>();

  items.forEach((item, idx) => {
    const res = validateContentItem(item);
    if (!res.ok) {
      allErrors.push(`Item ${idx + 1} (${item.title}): ${res.errors.join(", ")}`);
    }

    if (titles.has(item.title)) {
      allErrors.push(`Duplicate title found: ${item.title}`);
    }
    titles.add(item.title);
  });

  return {
    ok: allErrors.length === 0,
    errors: allErrors,
  };
}
