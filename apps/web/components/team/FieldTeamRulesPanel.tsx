import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const DOS = [
  "Keep demo under 10 min",
  "Follow script",
  "Use LECI if stuck",
  "Always push to trial",
];

const DONTS = ["No legal advice", "No improvisation", "No promises"];

export function FieldTeamRulesPanel() {
  return (
    <Card variant="default" className="border-white/10 bg-[#121212]">
      <CardHeader>
        <CardTitle className="text-lg text-white">Field rules</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Do</h4>
          <ul className="space-y-2 text-sm text-white/80">
            {DOS.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-emerald-400">✔</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400/90">Don&apos;t</h4>
          <ul className="space-y-2 text-sm text-white/80">
            {DONTS.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-red-400">❌</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
