/**
 * CTA placement suggestions — UX hints, not automatic UI changes.
 */
export function suggestPrimaryCtaCopy(audience: "buyer" | "seller" | "host" | "broker") {
  switch (audience) {
    case "buyer":
      return { primary: "Browse listings", secondary: "Save favorites" };
    case "seller":
      return { primary: "List your property", secondary: "Talk to a broker" };
    case "host":
      return { primary: "List your stay", secondary: "See host tools" };
    case "broker":
      return { primary: "Open CRM workspace", secondary: "Import a lead" };
    default:
      return { primary: "Get started", secondary: "Learn more" };
  }
}
