// src/feed/decisionRules.ts

export type FulfillmentPreference = "pickup_only" | "prefer_pickup" | "either";

export function getFulfillmentPreference(availableMinutes: number): FulfillmentPreference {
  if (availableMinutes < 20) return "pickup_only";
  if (availableMinutes < 40) return "prefer_pickup";
  return "either";
}

export function mealFitsWindow(params: {
  availableMinutes: number;
  etaMinutes: number;
  fulfillment: "pickup" | "delivery";
}): boolean {
  const MIN_EAT_BUFFER = 10;
  return params.availableMinutes - params.etaMinutes >= MIN_EAT_BUFFER;
}
