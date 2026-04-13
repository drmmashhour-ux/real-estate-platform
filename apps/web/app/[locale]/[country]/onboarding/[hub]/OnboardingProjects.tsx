import Link from "next/link";

export function OnboardingProjects({ accentColor }: { accentColor: string }) {
  const steps = [
    { label: "Company name & registration", href: "/dashboard/projects", desc: "Add company and registration number" },
    { label: "Project details", href: "/dashboard/projects", desc: "Submit project details for verification" },
  ];
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-200">Projects (Developer) – onboarding steps</h2>
      <ul className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.href + i}>
            <Link
              href={s.href}
              className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/60 p-4 transition-colors hover:bg-slate-800"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white" style={{ backgroundColor: accentColor }}>
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-slate-200">{s.label}</p>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
              <span className="ml-auto text-slate-500">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
