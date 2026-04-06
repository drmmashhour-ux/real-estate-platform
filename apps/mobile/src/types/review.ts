/** Supabase `public.reviews` read model (guest browse). */
export type ListingReviewRow = {
  id: string;
  listing_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  guest_email?: string | null;
};
