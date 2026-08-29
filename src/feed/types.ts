// src/feed/types.ts

export interface CalendarEvent {
  title: string;
  start: string; // "HH:MM" 24h format
  location?: string;
}

export interface UserContext {
  currentTime: string;       // "HH:MM"
  location: string;
  nextEvent: CalendarEvent | null;
  budget: number;            // USD
  preferences: string[];     // e.g. ["Asian", "Chicken", "Light meals"]
}

export interface ContextAnalysis {
  mealType: "breakfast" | "lunch" | "snack" | "dinner" | "late_night";
  availableMinutes: number;
  urgency: "low" | "medium" | "high";
}

export interface CandidateMeal {
  id: string;
  merchant: string;
  item: string;
  cuisine: string;
  price: number;
  pickupEta: number;         // minutes
  deliveryEta: number;       // minutes
  rating: number;            // 1–5
  distanceKm: number;
  tags: string[];
}

export interface Decision {
  decisionId: string;
  item: string;
  merchant: string;
  price: number;
  fulfillment: "pickup" | "delivery";
  etaMinutes: number;
  reason: string;
}

export interface FeedMeScore {
  mealId: string;
  total: number;
  breakdown: {
    timingFit: number;
    preferenceMatch: number;
    budgetFit: number;
    distance: number;
    feedbackHistory: number;
  };
}
