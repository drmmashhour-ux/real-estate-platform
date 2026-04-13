import { WorkspaceSubscriptionSuccessClient } from "./workspace-subscription-success-client";

export const metadata = {
  title: "Subscription successful | LECIPM",
};

type Props = { searchParams?: Promise<{ session_id?: string }> };

export default async function WorkspaceSubscriptionSuccessPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-50">
      <WorkspaceSubscriptionSuccessClient sessionId={sessionId} />
    </main>
  );
}
