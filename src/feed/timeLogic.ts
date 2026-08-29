// src/feed/timeLogic.ts
import type { ContextAnalysis } from "./types";

type MealType = ContextAnalysis["mealType"];
type Urgency = ContextAnalysis["urgency"];

export function getMealType(currentTime: string): MealType {
  const [h, m] = currentTime.split(":").map(Number);
  const minutes = h * 60 + m;
  if (minutes >= 5 * 60 && minutes < 10 * 60 + 30) return "breakfast";
  if (minutes >= 10 * 60 + 30 && minutes < 14 * 60 + 30) return "lunch";
  if (minutes >= 14 * 60 + 30 && minutes < 17 * 60) return "snack";
  if (minutes >= 17 * 60 && minutes < 21 * 60 + 30) return "dinner";
  return "late_night";
}

export function getAvailableMinutes(
  currentTime: string,
  nextEventStart: string | null
): number {
  if (!nextEventStart) return 480;
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return Math.max(0, toMinutes(nextEventStart) - toMinutes(currentTime));
}

export function getUrgency(availableMinutes: number): Urgency {
  if (availableMinutes < 20) return "high";
  if (availableMinutes <= 60) return "medium";
  return "low";
}
