import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Params = { id: string };

/** Redirect to main form submission view at /admin/forms/[id]. */
export default async function AdminFormSubmissionRedirectPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  redirect(`/admin/forms/${id}`);
}
