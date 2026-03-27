export function UpgradeBenefitsList() {
  const items = [
    "Unlimited offer-strategy simulations",
    "Negotiation tools and scenario saves",
    "AI drafting for offers and follow-ups",
    "Priority usage without interruption after you’ve seen value",
  ];
  return (
    <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-slate-300">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}
