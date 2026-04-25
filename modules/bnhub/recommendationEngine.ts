export interface Listing {
  id: string;
  name: string;
  price: number;
  rating: number;
  location: string;
  amenities: string[];
  features: string[];
  imageUrl?: string;
}

export interface RecommendationResult {
  listing: Listing;
  score: number;
  reason: string;
  tag: "VALUE" | "RATING" | "PREFERENCE" | "LOCATION";
}

export interface UserPreferences {
  city?: string;
  maxPrice?: number;
  minRating?: number;
  guests?: number;
  essentialAmenities?: string[];
  historyTags?: string[];
}

export function getRecommendedListings(
  listings: Listing[], 
  prefs: UserPreferences
): RecommendationResult[] {
  const results: RecommendationResult[] = listings.map(listing => {
    let score = 0;
    let reason = "Matches your criteria";
    let tag: RecommendationResult["tag"] = "PREFERENCE";

    // 1. Location Match (Critical)
    if (prefs.city && listing.location.toLowerCase().includes(prefs.city.toLowerCase())) {
      score += 40;
    }

    // 2. Rating Score (Quality)
    if (listing.rating >= 4.8) {
      score += 30;
      reason = "Highly rated by guests";
      tag = "RATING";
    } else if (listing.rating >= 4.5) {
      score += 15;
    }

    // 3. Price Value (Market Comparison)
    const marketAvg = 200; // Mock average
    if (listing.price < marketAvg * 0.8) {
      score += 25;
      reason = "Best value for your dates";
      tag = "VALUE";
    }

    // 4. Amenity Match
    if (prefs.essentialAmenities) {
      const matchCount = prefs.essentialAmenities.filter(a => listing.amenities.includes(a)).length;
      score += (matchCount * 5);
    }

    // 5. Personalization (History)
    if (prefs.historyTags) {
      const historyMatch = prefs.historyTags.some(t => listing.features.includes(t));
      if (historyMatch) {
        score += 20;
        reason = "Similar to your previous stays";
        tag = "PREFERENCE";
      }
    }

    return { listing, score, reason, tag };
  });

  // Return top 3 sorted by score
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
