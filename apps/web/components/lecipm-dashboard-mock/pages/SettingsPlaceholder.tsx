import { MockCard } from "@/components/lecipm-dashboard-mock/mock-ui";

export function SettingsPlaceholder() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ds-text-secondary">Workspace preferences (mock)</p>
      </div>
      <MockCard className="space-y-4">
        {["Notifications", "Syndication defaults", "AI suggestion intensity", "Compliance reminders"].map((label) => (
          <label
            key={label}
            className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-ds-border px-3 py-2 transition hover:border-ds-gold/35"
          >
            <span className="text-sm text-white">{label}</span>
            <input type="checkbox" defaultChecked={label !== "Compliance reminders"} className="accent-ds-gold" />
          </label>
        ))}
      </MockCard>
    </div>
  );
}
