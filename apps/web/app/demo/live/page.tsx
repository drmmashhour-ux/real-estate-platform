const steps = [
  {
    title: "Search listings",
    description: "Show how users discover listings with intelligent ranking.",
  },
  {
    title: "AI pricing",
    description: "Demonstrate dynamic pricing suggestions.",
  },
  {
    title: "Trust & compliance",
    description: "Show how weak listings are flagged or blocked.",
  },
  {
    title: "Autonomous optimization",
    description: "Trigger the AI orchestrator and show actions.",
  },
] as const;

export default function LiveDemo() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">Live Demo Flow</h1>

      <div className="mt-10 space-y-6">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/40"
          >
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Step {i + 1}: {step.title}
            </h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">{step.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
