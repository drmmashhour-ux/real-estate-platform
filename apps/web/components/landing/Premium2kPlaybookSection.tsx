import {
  PREMIUM_2K_GOAL,
  PREMIUM_2K_MESSAGES,
  PREMIUM_2K_POSITIONING,
  PREMIUM_2K_RULES,
  SYSTEM_SNAPSHOT_ROWS,
} from "@/lib/growth/premium-2k-booking-content";

function Msg({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-200">
        {text}
      </pre>
    </div>
  );
}

/** DM templates for ~$2K+ premium positioning (operating playbook on /landing). */
export function Premium2kPlaybookSection() {
  return (
    <section className="mx-auto mt-14 w-full max-w-2xl border-t border-zinc-200 pt-10 text-left dark:border-zinc-800">
      <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">Close $2,000+ bookings (premium flow)</h2>
      <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
        You are not “{PREMIUM_2K_POSITIONING.not}.” You are {PREMIUM_2K_POSITIONING.are}.
      </p>

      <div className="mt-8 space-y-5">
        <Msg label="Step 1 — Premium opening" text={PREMIUM_2K_MESSAGES.opening} />
        <Msg label="Step 2 — Qualify" text={PREMIUM_2K_MESSAGES.qualify} />
        <Msg label="Step 3 — Present (2 options max)" text={PREMIUM_2K_MESSAGES.present} />
        <p className="text-xs text-amber-900/90 dark:text-amber-200/80">{PREMIUM_2K_RULES.maxOptions}</p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{PREMIUM_2K_RULES.key}</p>
        <Msg label="Step 4 — Close with authority" text={PREMIUM_2K_MESSAGES.close} />
        <Msg label="Objection — “It’s expensive”" text={PREMIUM_2K_MESSAGES.objectionExpensive} />
        <Msg label="Objection — “I’ll think about it”" text={PREMIUM_2K_MESSAGES.objectionThink} />
      </div>

      <div className="mt-8 rounded-lg border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100/90">
        <p className="font-medium">Goal (illustrative)</p>
        <p className="mt-1 text-amber-900/90 dark:text-amber-100/85">{PREMIUM_2K_GOAL}</p>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Platform snapshot</p>
        <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800/60">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Level</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Capability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {SYSTEM_SNAPSHOT_ROWS.map((row) => (
                <tr key={row.level} className="bg-white/80 dark:bg-zinc-950/30">
                  <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{row.level}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.capability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          On-site: premium trust copy appears on the book flow via <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">PremiumTrust</code>.
        </p>
      </div>
    </section>
  );
}
