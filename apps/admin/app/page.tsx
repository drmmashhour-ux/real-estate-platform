import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main>
      <h1>Admin Dashboard</h1>
      <nav>
        <Link href="/admin/listings">Listings moderation</Link>
        <Link href="/admin/bookings">Bookings review</Link>
      </nav>
    </main>
  );
}
