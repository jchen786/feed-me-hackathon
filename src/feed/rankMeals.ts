import { v4 as uuidv4 } from "uuid";
import { getFulfillmentPreference, mealFitsWindow } from "./decisionRules";
import type { CandidateMeal, UserContext, ContextAnalysis, Decision, FeedMeScore } from "./types";

const MAX_DISTANCE_KM = 3;

function scoreTimingFit(meal: CandidateMeal, analysis: ContextAnalysis, fulfillment: "pickup" | "delivery"): number {
  const eta = fulfillment === "pickup" ? meal.pickupEta : meal.deliveryEta;
  const fits = mealFitsWindow({ availableMinutes: analysis.availableMinutes, etaMinutes: eta, fulfillment });
  if (!fits) return 0;
  const buffer = analysis.availableMinutes - eta;
  return Math.min(buffer / 60, 1.0);
}

function scorePreferenceMatch(meal: CandidateMeal, preferences: string[]): number {
  if (!preferences.length) return 0.5;
  const matches = preferences.filter((p) =>
    meal.tags.some((t) => t.toLowerCase() === p.toLowerCase()) ||
    meal.cuisine.toLowerCase() === p.toLowerCase()
  ).length;
  return Math.min(matches / preferences.length, 1.0);
}

function scoreBudgetFit(price: number, budget: number): number {
  if (price > budget) return 0;
  return 0.5 + 0.5 * (1 - price / budget);
}

function scoreDistance(distanceKm: number): number {
  return Math.max(0, 1 - distanceKm / MAX_DISTANCE_KM);
}

function scoreFeedbackHistory(mealId: string, likedIds: string[], dislikedIds: string[]): number {
  if (likedIds.includes(mealId)) return 1.0;
  if (dislikedIds.includes(mealId)) return 0.0;
  return 0.5;
}

function chooseFulfillment(meal: CandidateMeal, analysis: ContextAnalysis): "pickup" | "delivery" | null {
  const pref = getFulfillmentPreference(analysis.availableMinutes);
  const pickupFits = mealFitsWindow({ availableMinutes: analysis.availableMinutes, etaMinutes: meal.pickupEta, fulfillment: "pickup" });
  const deliveryFits = mealFitsWindow({ availableMinutes: analysis.availableMinutes, etaMinutes: meal.deliveryEta, fulfillment: "delivery" });
  if (pref === "pickup_only") return pickupFits ? "pickup" : null;
  if (pref === "prefer_pickup") {
    if (pickupFits) return "pickup";
    if (deliveryFits) return "delivery";
    return null;
  }
  if (pickupFits) return "pickup";
  if (deliveryFits) return "delivery";
  return null;
}

export function rankMeals(
  meals: CandidateMeal[],
  context: UserContext,
  analysis: ContextAnalysis,
  feedbackHistory: Array<{ mealId: string; feedback: "like" | "dislike" }>
): FeedMeScore[] {
  const likedIds = feedbackHistory.filter((f) => f.feedback === "like").map((f) => f.mealId);
  const dislikedIds = feedbackHistory.filter((f) => f.feedback === "dislike").map((f) => f.mealId);
  return meals.map((meal) => {
    const fulfillment = chooseFulfillment(meal, analysis) ?? "pickup";
    const timingFit = scoreTimingFit(meal, analysis, fulfillment);
    const preferenceMatch = scorePreferenceMatch(meal, context.preferences);
    const budgetFit = scoreBudgetFit(meal.price, context.budget);
    const distance = scoreDistance(meal.distanceKm);
    const feedbackHistoryScore = scoreFeedbackHistory(meal.id, likedIds, dislikedIds);
    const total = timingFit * 0.35 + preferenceMatch * 0.25 + budgetFit * 0.20 + distance * 0.10 + feedbackHistoryScore * 0.10;
    return { mealId: meal.id, total, breakdown: { timingFit, preferenceMatch, budgetFit, distance, feedbackHistory: feedbackHistoryScore } };
  });
}

export function chooseMeal(
  meals: CandidateMeal[],
  context: UserContext,
  analysis: ContextAnalysis,
  feedbackHistory: Array<{ mealId: string; feedback: "like" | "dislike" }>
): Decision | null {
  const eligible = meals.filter((meal) => {
    if (meal.price > context.budget) return false;
    return chooseFulfillment(meal, analysis) !== null;
  });
  if (!eligible.length) return null;
  const scores = rankMeals(eligible, context, analysis, feedbackHistory);
  scores.sort((a, b) => b.total - a.total);
  const bestMeal = eligible.find((m) => m.id === scores[0].mealId)!;
  const fulfillment = chooseFulfillment(bestMeal, analysis)!;
  const etaMinutes = fulfillment === "pickup" ? bestMeal.pickupEta : bestMeal.deliveryEta;
  const nextMeetingText = context.nextEvent
    ? `You have ${analysis.availableMinutes} minutes before ${context.nextEvent.title}.`
    : "You have plenty of time.";
  const fulfillmentText = fulfillment === "pickup"
    ? `Pickup in ${etaMinutes} min keeps you well within your time window.`
    : `Delivery arrives in ${etaMinutes} min, fitting your schedule.`;
  const reason = `${nextMeetingText} ${fulfillmentText} This fits your $${context.budget} budget and matches your preferences.`;
  return {
    decisionId: uuidv4(),
    item: bestMeal.item,
    merchant: bestMeal.merchant,
    price: bestMeal.price,
    fulfillment,
    etaMinutes,
    reason,
  };
}
