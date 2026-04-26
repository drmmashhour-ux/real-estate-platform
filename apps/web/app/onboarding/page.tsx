import { continueOnboarding } from "./actions";

export default function Onboarding() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-bold">Get started</h1>

      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Three quick steps to get value from the platform.
      </p>

      <ol className="mt-8 list-decimal space-y-4 pl-5 text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
        <li>Choose your role (Buyer, Seller, Host, Broker)</li>
        <li>Set your preferences</li>
        <li>Explore or create your first listing</li>
      </ol>

      <form action={continueOnboarding} className="mt-10">
        <button
          type="submit"
          className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
