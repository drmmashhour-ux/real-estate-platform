import {
  AUTHORITY_PHRASES,
  CONCIERGE_GOAL,
  CONCIERGE_POSITIONING,
  CONCIERGE_RULES,
  DAILY_SOCIAL_POST_AUTHORITY,
  DAILY_TARGETS,
  MESSAGES,
  SCALED_REVENUE_NOTE,
  TARGET_USER_CRITERIA,
  WHY_CLOSE_WORKS,
} from "@/lib/growth/concierge-booking-content";

function CopyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="text-left">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-200">
        {text}
      </pre>
    </div>
  );
}

export function ConciergePlaybookSections() {
  return (
    <section className="mx-auto mt-14 w-full max-w-2xl border-t border-zinc-200 pt-10 text-left dark:border-zinc-800">
      <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">{CONCIERGE_POSITIONING.headline}</h2>
      <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">{CONCIERGE_POSITIONING.strategy}</p>
      <p className="mt-1 text-center text-xs text-amber-800/90 dark:text-amber-200/80">
        Objective: convert a single high-intent user toward roughly $500–$2,000+ stays (depends on market and your economics).
      </p>

      <div className="mt-8 space-y-6">
        <details className="group rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900/30">
          <summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100">Step 1 — Target the right users</summary>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Quality &gt; quantity. Focus on:</p>
          <ul className="mt-1 list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
            {TARGET_USER_CRITERIA.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>

        <details className="group rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900/30" open>
          <summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100">Step 2 — Qualify</summary>
          <div className="mt-3 space-y-4">
            <CopyBlock label="First message" text={MESSAGES.qualifyInitial} />
            <CopyBlock label="When they reply — ask for details" text={MESSAGES.askDetails} />
          </div>
        </details>

        <details className="group rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900/30">
          <summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100">Step 3 — Send 2–3 strong options</summary>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{CONCIERGE_RULES.maxOptions}</p>
          <div className="mt-3">
            <CopyBlock label="Message with links" text={MESSAGES.sendOptionsIntro} />
            <p className="mt-2 text-xs text-zinc-500">Then paste 2–3 listing URLs. Keep the message short.</p>
          </div>
        </details>

        <details className="group rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900/30" open>
          <summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100">Step 4 — Close (recommendation + link)</summary>
          <div className="mt-3 space-y-3">
            <CopyBlock label="Replace [BOOK LINK]" text={MESSAGES.close} />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Why it works</p>
            <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
              {WHY_CLOSE_WORKS.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="text-xs text-zinc-500">{CONCIERGE_RULES.keyRule}</p>
          </div>
        </details>

        <details className="group rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900/30">
          <summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100">Step 5 — Objections</summary>
          <div className="mt-3 space-y-4">
            <CopyBlock label="“I’ll think about it”" text={MESSAGES.objectionThinkAbout} />
            <CopyBlock label="“Too expensive”" text={MESSAGES.objectionTooExpensive} />
          </div>
        </details>
      </div>

      <div className="mt-8 rounded-lg border border-violet-200/80 bg-violet-50/60 px-4 py-3 text-sm text-violet-950 dark:border-violet-500/25 dark:bg-violet-950/30 dark:text-violet-100/90">
        <p className="font-medium">Near-term goal</p>
        <p className="mt-1 text-violet-900/90 dark:text-violet-100/85">{CONCIERGE_GOAL.blurb}</p>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Daily target (outbound system)</p>
        <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800/60">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Action</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {DAILY_TARGETS.map((row) => (
                <tr key={row.action} className="bg-white/80 dark:bg-zinc-950/30">
                  <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{row.action}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Authority (say these naturally in DMs)</p>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
          {AUTHORITY_PHRASES.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Extra daily post (authority angle)</p>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-200">
          {DAILY_SOCIAL_POST_AUTHORITY}
        </pre>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">{SCALED_REVENUE_NOTE}</p>
    </section>
  );
}
