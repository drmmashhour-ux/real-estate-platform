/**
 * Plain-language copy — avoid jargon on family-facing surfaces.
 */

export function careLevelFriendly(code: string): string {
  const u = code.toUpperCase().replace(/\s/g, "_");
  switch (u) {
    case "AUTONOMOUS":
      return "You can live on your own here. Help is there if you ask.";
    case "SEMI_AUTONOMOUS":
      return "Some daily help is built in, with room to stay independent.";
    case "ASSISTED":
      return "Staff help with daily tasks like meals and medications.";
    case "FULL_CARE":
      return "Around-the-clock care for people who need hands-on help every day.";
    default:
      return "Ask the residence how care is set up for your situation.";
  }
}

export function careLevelShortLabel(code: string): string {
  const u = code.toUpperCase().replace(/\s/g, "_");
  switch (u) {
    case "AUTONOMOUS":
      return "Independent living";
    case "SEMI_AUTONOMOUS":
      return "Some help available";
    case "ASSISTED":
      return "Assisted daily care";
    case "FULL_CARE":
      return "Full daily care";
    default:
      return code.replace(/_/g, " ");
  }
}

export function serviceCategoryFriendly(cat: string): string {
  const u = cat.toUpperCase();
  if (u === "MEDICAL") return "Health support";
  if (u === "WELLNESS") return "Well-being";
  if (u === "DAILY_LIFE") return "Daily living";
  return cat;
}
