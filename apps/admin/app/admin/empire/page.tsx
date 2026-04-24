import { EmpireDashboardClient } from "./EmpireDashboardClient";

export const metadata = {
  title: "Empire Control | Admin",
  description: "Multi-company orchestration and governance layer.",
};

export default function EmpireDashboardPage() {
  return <EmpireDashboardClient />;
}
