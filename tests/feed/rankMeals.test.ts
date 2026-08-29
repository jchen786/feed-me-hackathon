import { rankMeals, chooseMeal } from "../../src/feed/rankMeals";
import type { CandidateMeal, UserContext, ContextAnalysis } from "../../src/feed/types";

const baseMeal: CandidateMeal = {
  id: "test01",
  merchant: "Test Kitchen",
  item: "Test Bowl",
  cuisine: "Asian",
  price: 14.00,
  pickupEta: 10,
  deliveryEta: 25,
  rating: 4.5,
  distanceKm: 0.5,
  tags: ["Asian", "Chicken", "Light meals"],
};

const expensiveMeal: CandidateMeal = { ...baseMeal, id: "test02", price: 35.00, item: "Expensive Bowl" };
const farMeal: CandidateMeal = { ...baseMeal, id: "test03", distanceKm: 5.0, item: "Far Bowl" };

const baseContext: UserContext = {
  currentTime: "13:15",
  location: "San Francisco",
  nextEvent: { title: "Meeting", start: "14:00" },
  budget: 20,
  preferences: ["Asian", "Chicken", "Light meals"],
};

const baseAnalysis: ContextAnalysis = { mealType: "lunch", availableMinutes: 45, urgency: "medium" };

describe("rankMeals", () => {
  it("penalizes meals over budget", () => {
    const scores = rankMeals([baseMeal, expensiveMeal], baseContext, baseAnalysis, []);
    const baseScore = scores.find((s) => s.mealId === "test01")!;
    const expensiveScore = scores.find((s) => s.mealId === "test02")!;
    expect(baseScore.total).toBeGreaterThan(expensiveScore.total);
  });

  it("penalizes far meals", () => {
    const scores = rankMeals([baseMeal, farMeal], baseContext, baseAnalysis, []);
    const baseScore = scores.find((s) => s.mealId === "test01")!;
    const farScore = scores.find((s) => s.mealId === "test03")!;
    expect(baseScore.total).toBeGreaterThan(farScore.total);
  });
});

describe("chooseMeal", () => {
  it("returns a single Decision object", () => {
    const result = chooseMeal([baseMeal], baseContext, baseAnalysis, []);
    expect(result).not.toBeNull();
    expect(result!.item).toBe("Test Bowl");
    expect(result!.fulfillment).toMatch(/pickup|delivery/);
  });

  it("returns null when no meals fit the time window", () => {
    const tightAnalysis: ContextAnalysis = { ...baseAnalysis, availableMinutes: 5 };
    const slowMeal: CandidateMeal = { ...baseMeal, pickupEta: 30, deliveryEta: 60 };
    const result = chooseMeal([slowMeal], baseContext, tightAnalysis, []);
    expect(result).toBeNull();
  });

  it("returns null when all meals exceed budget", () => {
    const result = chooseMeal([expensiveMeal], baseContext, baseAnalysis, []);
    expect(result).toBeNull();
  });
});
