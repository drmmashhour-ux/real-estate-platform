import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
