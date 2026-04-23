export default function ListingPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h1>Listing {params.id}</h1>
      <p>Listing detail — gallery, host, amenities, calendar, book CTA.</p>
    </main>
  );
}
