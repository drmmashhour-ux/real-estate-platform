import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>LECIPM — Web</h1>
      <nav>
        <Link href="/search">Search</Link>
        <Link href="/listings/1">Listing Page</Link>
        <Link href="/checkout">Checkout</Link>
        <Link href="/trips">Trips</Link>
        <Link href="/host/dashboard">Host Dashboard</Link>
      </nav>
    </main>
  );
}
