export interface TrustScore {
  score: number; // 0.0 to 5.0
  level: "high" | "medium" | "low";
  badges: string[];
  signals: string[];
}

export function calculateTrustScore(listing: any, reviews: any[]): TrustScore {
  let score = 4.0; // Base score
  let badges: string[] = [];
  let signals: string[] = [];

  // 1. Review Consistency
  if (reviews.length > 5) {
    const ratings = reviews.map(r => r.propertyRating);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    score = avg;
    
    if (avg >= 4.8) {
      badges.push("Highly Rated");
      signals.push("Consistently high ratings from guests");
    }
  } else if (reviews.length === 0) {
    score = 3.5; // New listing
    signals.push("New listing - limited history");
  }

  // 2. Verified Host
  if (listing.host?.isVerified) {
    score += 0.2;
    badges.push("Verified Host");
    signals.push("Host identity verified by BNHub");
  }

  // 3. Fraud Detection (Basic)
  const duplicateComments = reviews.filter((r, i) => 
    reviews.findIndex(other => other.comment === r.comment) !== i
  );
  
  if (duplicateComments.length > 0) {
    score -= 1.0;
    signals.push("Suspicious review patterns detected");
  }

  // 4. Listing Age
  const daysSinceCreation = (new Date().getTime() - new Date(listing.createdAt).getTime()) / (1000 * 3600 * 24);
  if (daysSinceCreation < 30 && reviews.length === 0) {
    score -= 0.5;
    signals.push("New host with no prior history");
  }

  // Final score cap
  score = Math.min(5.0, Math.max(0.0, score));

  return {
    score: parseFloat(score.toFixed(1)),
    level: score >= 4.5 ? "high" : score >= 3.5 ? "medium" : "low",
    badges,
    signals
  };
}
