/** Curated luxury placeholders when fewer than 3 active listings exist. */
export const FEATURED_PROPERTY_MOCKS = [
  {
    id: "featured-mock-1",
    title: "Waterfront Penthouse",
    city: "Westmount, QC",
    priceLabel: "$4,850,000 CAD",
    beds: 4,
    baths: 3.5,
    sqft: 4200,
    imageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "featured-mock-2",
    title: "Modern Estate",
    city: "Outremont, QC",
    priceLabel: "$3,275,000 CAD",
    beds: 5,
    baths: 4,
    sqft: 5100,
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "featured-mock-3",
    title: "Heritage Villa",
    city: "Mont-Royal, QC",
    priceLabel: "$2,995,000 CAD",
    beds: 4,
    baths: 3,
    sqft: 3800,
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
  },
] as const;
