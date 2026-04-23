import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const [users, properties, offers] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.offer.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-light text-white">Admin</h1>
      <p className="mt-2 text-sm text-emerald-200/60">Platform metrics (read-only overview).</p>
      <ul className="mt-6 space-y-2 text-sm text-emerald-100/80">
        <li>Users: {users}</li>
        <li>Properties: {properties}</li>
        <li>Offers: {offers}</li>
      </ul>
    </div>
  );
}
