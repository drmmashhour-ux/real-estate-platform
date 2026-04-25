export interface ListingData {
  id: string;
  basePrice: number;
  occupancyRate: number; // 0 to 1
  location: string;
  similarListingsAvgPrice: number;
}

export interface PricingSuggestion {
  suggestedPrice: number;
  changePercent: number;
  confidenceLevel: "high" | "medium" | "low";
  reason: string;
}

export function getSuggestedPrice(listing: ListingData, date: Date): PricingSuggestion {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
  const isHoliday = isMajorHoliday(date);
  
  let suggestedPrice = listing.basePrice;
  let multiplier = 1.0;
  let reasons: string[] = [];

  // 1. Demand Detection: Weekends
  if (isWeekend) {
    multiplier += 0.15;
    reasons.push("High weekend demand");
  }

  // 2. Demand Detection: Holidays
  if (isHoliday) {
    multiplier += 0.30;
    reasons.push("Holiday demand spike");
  }

  // 3. Competitive Analysis
  if (listing.basePrice < listing.similarListingsAvgPrice * 0.9) {
    multiplier += 0.05;
    reasons.push("Lower than similar listings");
  } else if (listing.basePrice > listing.similarListingsAvgPrice * 1.1) {
    multiplier -= 0.05;
    reasons.push("Higher than market average");
  }

  // 4. Occupancy History
  if (listing.occupancyRate < 0.4) {
    multiplier -= 0.10;
    reasons.push("Low occupancy detected");
  } else if (listing.occupancyRate > 0.8) {
    multiplier += 0.10;
    reasons.push("High occupancy success");
  }

  suggestedPrice = Math.round(listing.basePrice * multiplier);
  const changePercent = Math.round(((suggestedPrice - listing.basePrice) / listing.basePrice) * 100);
  
  return {
    suggestedPrice,
    changePercent,
    confidenceLevel: reasons.length >= 2 ? "high" : "medium",
    reason: reasons.length > 0 ? reasons.join(" + ") : "Optimized based on market stability"
  };
}

function isMajorHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();

  // Simple check for some major holidays
  if (month === 11 && (day === 24 || day === 25 || day === 31)) return true; // Christmas/NYE
  if (month === 0 && day === 1) return true; // New Year's Day
  if (month === 6 && day === 1) return true; // Canada Day
  if (month === 5 && day === 24) return true; // St-Jean-Baptiste (Quebec)
  
  return false;
}

export function trackPricingHistory(listingId: string, suggested: number, actual: number) {
  // Logic to store pricing performance in DB (Mock for now)
  console.log(`Tracking: Listing ${listingId} | Suggested: ${suggested} | Actual: ${actual}`);
}
