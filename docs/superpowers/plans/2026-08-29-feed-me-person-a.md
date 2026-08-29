# FEED ME — Person A 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 FEED ME Hackathon MVP 交付 Person A 的全部产出：决策规则、候选餐品数据集、排名逻辑、QA 清单、Hackathon Slides（3页）、60–90 秒 Demo 脚本。

**Architecture:** 所有 Person A 产出以 TypeScript 模块形式存在，供 Person B 的 `/api/feed` 直接 import 使用。决策逻辑完全 deterministic，不依赖 LLM，保证 fallback 可靠。排名逻辑输出单一最优结果，不暴露排名细节给前端。

**Tech Stack:** TypeScript (无框架依赖)、Jest、Markdown（Slides）

---

## 文件结构

```
src/
  feed/
    types.ts              # 所有共享类型定义
    timeLogic.ts          # meal time + available minutes 计算
    decisionRules.ts      # pickup/delivery 决策规则
    rankMeals.ts          # 5维度评分 → 返回单一最优
    candidateMeals.ts     # 20条 mock 餐品数据集
tests/
  feed/
    timeLogic.test.ts
    decisionRules.test.ts
    rankMeals.test.ts
docs/
  qa-checklist.md         # P0/P1/P2 QA 清单
  slides.md               # 3页 Hackathon Slides 内容
  demo-script.md          # 60–90秒 Demo 脚本
```

---

## Task 1: 类型定义

**Files:**
- Create: `src/feed/types.ts`

- [ ] **Step 1: 创建类型文件**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/feed/types.ts
git commit -m "feat: add shared types for FEED ME decision layer"
```

---

## Task 2: 时间逻辑

**Files:**
- Create: `src/feed/timeLogic.ts`
- Create: `tests/feed/timeLogic.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// tests/feed/timeLogic.test.ts
import { getMealType, getAvailableMinutes, getUrgency } from "../../src/feed/timeLogic";

describe("getMealType", () => {
  it("returns breakfast for 08:00", () => {
    expect(getMealType("08:00")).toBe("breakfast");
  });
  it("returns lunch for 12:00", () => {
    expect(getMealType("12:00")).toBe("lunch");
  });
  it("returns lunch for 13:15", () => {
    expect(getMealType("13:15")).toBe("lunch");
  });
  it("returns snack for 15:00", () => {
    expect(getMealType("15:00")).toBe("snack");
  });
  it("returns dinner for 19:00", () => {
    expect(getMealType("19:00")).toBe("dinner");
  });
  it("returns late_night for 22:00", () => {
    expect(getMealType("22:00")).toBe("late_night");
  });
});

describe("getAvailableMinutes", () => {
  it("returns 45 when next event is 45 min away", () => {
    expect(getAvailableMinutes("13:15", "14:00")).toBe(45);
  });
  it("returns 10 when next event is 10 min away", () => {
    expect(getAvailableMinutes("13:50", "14:00")).toBe(10);
  });
  it("returns 480 when no next event (8 hours)", () => {
    expect(getAvailableMinutes("13:00", null)).toBe(480);
  });
});

describe("getUrgency", () => {
  it("returns high for < 20 min", () => {
    expect(getUrgency(15)).toBe("high");
  });
  it("returns medium for 20–60 min", () => {
    expect(getUrgency(45)).toBe("medium");
  });
  it("returns low for > 60 min", () => {
    expect(getUrgency(90)).toBe("low");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx jest tests/feed/timeLogic.test.ts --no-coverage
```

期望输出：`Cannot find module '../../src/feed/timeLogic'`

- [ ] **Step 3: 实现时间逻辑**

```typescript
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
  if (!nextEventStart) return 480; // 8 hours default
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx jest tests/feed/timeLogic.test.ts --no-coverage
```

期望输出：`Tests: 9 passed`

- [ ] **Step 5: Commit**

```bash
git add src/feed/timeLogic.ts tests/feed/timeLogic.test.ts
git commit -m "feat: add time logic (mealType, availableMinutes, urgency)"
```

---

## Task 3: 决策规则（pickup vs delivery）

**Files:**
- Create: `src/feed/decisionRules.ts`
- Create: `tests/feed/decisionRules.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// tests/feed/decisionRules.test.ts
import { getFulfillmentPreference, mealFitsWindow } from "../../src/feed/decisionRules";

describe("getFulfillmentPreference", () => {
  it("returns pickup-only for < 20 min available", () => {
    expect(getFulfillmentPreference(15)).toBe("pickup_only");
  });
  it("returns prefer-pickup for 20–40 min", () => {
    expect(getFulfillmentPreference(30)).toBe("prefer_pickup");
  });
  it("returns either for 40–60 min", () => {
    expect(getFulfillmentPreference(50)).toBe("either");
  });
  it("returns either for > 60 min", () => {
    expect(getFulfillmentPreference(90)).toBe("either");
  });
});

describe("mealFitsWindow", () => {
  it("returns true if pickup eta fits with buffer", () => {
    // 45 min available, 11 min pickup, need 10 min buffer to eat → 21 min total → fits
    expect(mealFitsWindow({ availableMinutes: 45, etaMinutes: 11, fulfillment: "pickup" })).toBe(true);
  });
  it("returns false if eta leaves no buffer", () => {
    // 15 min available, 12 min pickup → only 3 min buffer < 10 → does not fit
    expect(mealFitsWindow({ availableMinutes: 15, etaMinutes: 12, fulfillment: "pickup" })).toBe(false);
  });
  it("returns false if delivery eta too long", () => {
    // 25 min available, 20 min delivery → 5 min buffer < 10 → does not fit
    expect(mealFitsWindow({ availableMinutes: 25, etaMinutes: 20, fulfillment: "delivery" })).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx jest tests/feed/decisionRules.test.ts --no-coverage
```

- [ ] **Step 3: 实现决策规则**

```typescript
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
  const MIN_EAT_BUFFER = 10; // minutes needed to actually eat
  return params.availableMinutes - params.etaMinutes >= MIN_EAT_BUFFER;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx jest tests/feed/decisionRules.test.ts --no-coverage
```

期望输出：`Tests: 6 passed`

- [ ] **Step 5: Commit**

```bash
git add src/feed/decisionRules.ts tests/feed/decisionRules.test.ts
git commit -m "feat: add fulfillment decision rules and time-window fit check"
```

---

## Task 4: 候选餐品数据集

**Files:**
- Create: `src/feed/candidateMeals.ts`

- [ ] **Step 1: 创建 20 条 mock 数据**

```typescript
// src/feed/candidateMeals.ts
import type { CandidateMeal } from "./types";

export const candidateMeals: CandidateMeal[] = [
  {
    id: "m01",
    merchant: "Zen Kitchen",
    item: "Chicken Teriyaki Bowl",
    cuisine: "Asian",
    price: 14.80,
    pickupEta: 11,
    deliveryEta: 25,
    rating: 4.7,
    distanceKm: 0.4,
    tags: ["Chicken", "Asian", "Light meals", "Rice"],
  },
  {
    id: "m02",
    merchant: "Green Leaf Cafe",
    item: "Grilled Chicken Salad",
    cuisine: "American",
    price: 13.50,
    pickupEta: 8,
    deliveryEta: 20,
    rating: 4.5,
    distanceKm: 0.6,
    tags: ["Chicken", "Light meals", "Salad", "Healthy"],
  },
  {
    id: "m03",
    merchant: "Pho 888",
    item: "Chicken Pho",
    cuisine: "Vietnamese",
    price: 15.00,
    pickupEta: 12,
    deliveryEta: 28,
    rating: 4.8,
    distanceKm: 0.8,
    tags: ["Asian", "Chicken", "Soup", "Light meals"],
  },
  {
    id: "m04",
    merchant: "Burrito Box",
    item: "Chicken Burrito",
    cuisine: "Mexican",
    price: 12.00,
    pickupEta: 7,
    deliveryEta: 18,
    rating: 4.3,
    distanceKm: 0.3,
    tags: ["Chicken", "Mexican", "Quick"],
  },
  {
    id: "m05",
    merchant: "Sushi Spot",
    item: "Salmon Sashimi Set",
    cuisine: "Japanese",
    price: 18.00,
    pickupEta: 10,
    deliveryEta: 22,
    rating: 4.9,
    distanceKm: 1.1,
    tags: ["Asian", "Sushi", "Light meals", "Fish"],
  },
  {
    id: "m06",
    merchant: "Noodle House",
    item: "Dan Dan Noodles",
    cuisine: "Chinese",
    price: 11.50,
    pickupEta: 9,
    deliveryEta: 21,
    rating: 4.4,
    distanceKm: 0.5,
    tags: ["Asian", "Noodles", "Spicy"],
  },
  {
    id: "m07",
    merchant: "The Sandwich Co.",
    item: "Turkey Club Sandwich",
    cuisine: "American",
    price: 10.00,
    pickupEta: 5,
    deliveryEta: 15,
    rating: 4.2,
    distanceKm: 0.2,
    tags: ["Quick", "Light meals", "Sandwich"],
  },
  {
    id: "m08",
    merchant: "Poke Bowl Bar",
    item: "Tuna Poke Bowl",
    cuisine: "Hawaiian",
    price: 16.00,
    pickupEta: 8,
    deliveryEta: 20,
    rating: 4.6,
    distanceKm: 0.7,
    tags: ["Light meals", "Fish", "Healthy", "Asian"],
  },
  {
    id: "m09",
    merchant: "Curry Corner",
    item: "Chicken Tikka Masala",
    cuisine: "Indian",
    price: 14.00,
    pickupEta: 15,
    deliveryEta: 30,
    rating: 4.7,
    distanceKm: 1.0,
    tags: ["Asian", "Chicken", "Spicy"],
  },
  {
    id: "m10",
    merchant: "Steam Bun House",
    item: "BBQ Pork Bao x3",
    cuisine: "Chinese",
    price: 9.00,
    pickupEta: 6,
    deliveryEta: 18,
    rating: 4.5,
    distanceKm: 0.4,
    tags: ["Asian", "Light meals", "Quick"],
  },
  {
    id: "m11",
    merchant: "Ramen Lab",
    item: "Shoyu Ramen",
    cuisine: "Japanese",
    price: 16.50,
    pickupEta: 13,
    deliveryEta: 27,
    rating: 4.8,
    distanceKm: 0.9,
    tags: ["Asian", "Noodles", "Soup"],
  },
  {
    id: "m12",
    merchant: "Deli Fresh",
    item: "Caesar Wrap",
    cuisine: "American",
    price: 11.00,
    pickupEta: 5,
    deliveryEta: 14,
    rating: 4.1,
    distanceKm: 0.3,
    tags: ["Quick", "Light meals", "Healthy"],
  },
  {
    id: "m13",
    merchant: "Thai Palace",
    item: "Pad Thai (Chicken)",
    cuisine: "Thai",
    price: 13.00,
    pickupEta: 14,
    deliveryEta: 26,
    rating: 4.6,
    distanceKm: 0.8,
    tags: ["Asian", "Chicken", "Noodles"],
  },
  {
    id: "m14",
    merchant: "Acai Bowl Co.",
    item: "Dragon Fruit Acai Bowl",
    cuisine: "Healthy",
    price: 12.50,
    pickupEta: 6,
    deliveryEta: 16,
    rating: 4.4,
    distanceKm: 0.5,
    tags: ["Light meals", "Healthy", "Breakfast", "Snack"],
  },
  {
    id: "m15",
    merchant: "Dim Sum Express",
    item: "Har Gow + Siu Mai Set",
    cuisine: "Chinese",
    price: 13.00,
    pickupEta: 10,
    deliveryEta: 22,
    rating: 4.5,
    distanceKm: 0.6,
    tags: ["Asian", "Light meals"],
  },
  {
    id: "m16",
    merchant: "Burger Joint",
    item: "Classic Cheeseburger",
    cuisine: "American",
    price: 11.50,
    pickupEta: 8,
    deliveryEta: 18,
    rating: 4.3,
    distanceKm: 0.4,
    tags: ["Quick", "Beef"],
  },
  {
    id: "m17",
    merchant: "Soba Noodle Bar",
    item: "Cold Soba with Dipping Sauce",
    cuisine: "Japanese",
    price: 12.00,
    pickupEta: 9,
    deliveryEta: 20,
    rating: 4.5,
    distanceKm: 0.7,
    tags: ["Asian", "Light meals", "Noodles"],
  },
  {
    id: "m18",
    merchant: "Shawarma King",
    item: "Chicken Shawarma Plate",
    cuisine: "Middle Eastern",
    price: 13.50,
    pickupEta: 7,
    deliveryEta: 19,
    rating: 4.4,
    distanceKm: 0.5,
    tags: ["Chicken", "Quick"],
  },
  {
    id: "m19",
    merchant: "Pita Palace",
    item: "Falafel Wrap",
    cuisine: "Mediterranean",
    price: 10.50,
    pickupEta: 6,
    deliveryEta: 16,
    rating: 4.3,
    distanceKm: 0.4,
    tags: ["Light meals", "Vegetarian", "Quick"],
  },
  {
    id: "m20",
    merchant: "Premium Sushi Bar",
    item: "Omakase Bento Box",
    cuisine: "Japanese",
    price: 28.00,
    pickupEta: 20,
    deliveryEta: 35,
    rating: 5.0,
    distanceKm: 1.5,
    tags: ["Asian", "Sushi", "Premium"],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/feed/candidateMeals.ts
git commit -m "feat: add 20-item candidate meal dataset for demo"
```

---

## Task 5: 排名逻辑

**Files:**
- Create: `src/feed/rankMeals.ts`
- Create: `tests/feed/rankMeals.test.ts`

排名权重：
- Timing Fit: 35%
- Preference Match: 25%
- Budget Fit: 20%
- Distance: 10%
- Feedback History: 10%

- [ ] **Step 1: 写失败测试**

```typescript
// tests/feed/rankMeals.test.ts
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

const expensiveMeal: CandidateMeal = {
  ...baseMeal,
  id: "test02",
  price: 35.00,
  item: "Expensive Bowl",
};

const farMeal: CandidateMeal = {
  ...baseMeal,
  id: "test03",
  distanceKm: 5.0,
  item: "Far Bowl",
};

const baseContext: UserContext = {
  currentTime: "13:15",
  location: "San Francisco",
  nextEvent: { title: "Meeting", start: "14:00" },
  budget: 20,
  preferences: ["Asian", "Chicken", "Light meals"],
};

const baseAnalysis: ContextAnalysis = {
  mealType: "lunch",
  availableMinutes: 45,
  urgency: "medium",
};

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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx jest tests/feed/rankMeals.test.ts --no-coverage
```

- [ ] **Step 3: 实现排名逻辑**

```typescript
// src/feed/rankMeals.ts
import { v4 as uuidv4 } from "uuid";
import { getFulfillmentPreference, mealFitsWindow } from "./decisionRules";
import type { CandidateMeal, UserContext, ContextAnalysis, Decision, FeedMeScore } from "./types";

const MAX_DISTANCE_KM = 3;

function scoreTimingFit(meal: CandidateMeal, analysis: ContextAnalysis, fulfillment: "pickup" | "delivery"): number {
  const eta = fulfillment === "pickup" ? meal.pickupEta : meal.deliveryEta;
  const fits = mealFitsWindow({ availableMinutes: analysis.availableMinutes, etaMinutes: eta, fulfillment });
  if (!fits) return 0;
  // More buffer = higher score, capped at 1.0
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
  // Cheaper relative to budget = slightly higher score, but not dominant
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

function chooseFulfillment(
  meal: CandidateMeal,
  analysis: ContextAnalysis
): "pickup" | "delivery" | null {
  const pref = getFulfillmentPreference(analysis.availableMinutes);
  const pickupFits = mealFitsWindow({ availableMinutes: analysis.availableMinutes, etaMinutes: meal.pickupEta, fulfillment: "pickup" });
  const deliveryFits = mealFitsWindow({ availableMinutes: analysis.availableMinutes, etaMinutes: meal.deliveryEta, fulfillment: "delivery" });

  if (pref === "pickup_only") return pickupFits ? "pickup" : null;
  if (pref === "prefer_pickup") {
    if (pickupFits) return "pickup";
    if (deliveryFits) return "delivery";
    return null;
  }
  // either
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

    const total =
      timingFit * 0.35 +
      preferenceMatch * 0.25 +
      budgetFit * 0.20 +
      distance * 0.10 +
      feedbackHistoryScore * 0.10;

    return {
      mealId: meal.id,
      total,
      breakdown: { timingFit, preferenceMatch, budgetFit, distance, feedbackHistory: feedbackHistoryScore },
    };
  });
}

export function chooseMeal(
  meals: CandidateMeal[],
  context: UserContext,
  analysis: ContextAnalysis,
  feedbackHistory: Array<{ mealId: string; feedback: "like" | "dislike" }>
): Decision | null {
  // Filter out over-budget and non-fitting meals first
  const eligible = meals.filter((meal) => {
    if (meal.price > context.budget) return false;
    return chooseFulfillment(meal, analysis) !== null;
  });

  if (!eligible.length) return null;

  const scores = rankMeals(eligible, context, analysis, feedbackHistory);
  scores.sort((a, b) => b.total - a.total);

  const bestScore = scores[0];
  const bestMeal = eligible.find((m) => m.id === bestScore.mealId)!;
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
```

- [ ] **Step 4: 安装 uuid 依赖**

```bash
npm install uuid
npm install --save-dev @types/uuid
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npx jest tests/feed/rankMeals.test.ts --no-coverage
```

期望输出：`Tests: 5 passed`

- [ ] **Step 6: Commit**

```bash
git add src/feed/rankMeals.ts tests/feed/rankMeals.test.ts
git commit -m "feat: add 5-dimension meal ranking and chooseMeal decision function"
```

---

## Task 6: QA 清单

**Files:**
- Create: `docs/qa-checklist.md`

- [ ] **Step 1: 创建 QA 文档**

```markdown
# FEED ME — QA Checklist

## P0 — 会导致 Hackathon Demo 中断

| # | Case | Steps to reproduce | Expected | Status |
|---|------|--------------------|----------|--------|
| P0-1 | 没有 Calendar 数据 | 删除/注释 mock calendar event | 系统使用 fallback，availableMinutes = 480，正常返回 Decision | ☐ |
| P0-2 | 下一场活动只有 10 分钟后 | nextEvent.start = currentTime + 10 min | 系统选最快 pickup（eta ≤ 0 min），或返回 "no options fit" gracefully | ☐ |
| P0-3 | 所有候选餐品超出预算 | 把 budget 设为 5，所有 price > 5 | API 返回 fallback decision，UI 不崩溃 | ☐ |
| P0-4 | Snaplii / commerce 调用失败 | 模拟 executePurchase() throw error | UI 显示 mock 成功状态，不白屏 | ☐ |
| P0-5 | 用户连续点击 I'M HUNGRY 两次 | 快速双击按钮 | 第二次点击被 debounce，不触发第二个 API 请求 | ☐ |
| P0-6 | /api/feed 网络超时 | 模拟 5s 延迟 | Loading 状态正常显示；超时后显示 fallback decision | ☐ |
| P0-7 | 空 preferences 数组 | preferences: [] | Decision 仍然返回；reason 中不提 preferences | ☐ |

## P1 — 可见质量问题，Demo 中会尴尬

| # | Case | Steps to reproduce | Expected | Status |
|---|------|--------------------|----------|--------|
| P1-1 | availableMinutes 恰好等于 ETA + 10 | availableMinutes=21, pickupEta=11 | 刚好通过 mealFitsWindow，返回该餐品 | ☐ |
| P1-2 | 午夜时间 mealType | currentTime="23:30" | mealType = "late_night"，reason 说明 late night | ☐ |
| P1-3 | 餐品 reason 文案不合理 | 所有正常 case 检查 reason 字段 | 文案自然，不出现 undefined 或乱码 | ☐ |
| P1-4 | 移动端布局溢出 | 在 375px 宽度查看所有 4 屏 | 无横向滚动，文字不截断 | ☐ |
| P1-5 | CONFIRM 后再次点击 | 在 success 页面点击返回，再次 I'M HUNGRY | 新的 decisionId 生成，旧状态清空 | ☐ |
| P1-6 | 餐品价格显示 | price = 14.8 | UI 显示 $14.80，不是 $14.8 | ☐ |

## P2 — 未来改进（今天不修）

- 多语言支持
- 真实 Calendar OAuth 集成
- Preference editor UI
- 历史订单记录
- 多餐品对比视图

---

## Demo Golden Path 验证（每次 Qoder 更新后必跑）

运行 5 次完整流程：

1. 打开 App
2. 点击 I'M HUNGRY
3. 等待 loading 动画完成
4. 确认 Decision 页面显示：meal name / price / fulfillment / ETA / buffer / reason
5. 点击 CONFIRM
6. 等待 purchase 状态
7. 确认 Success 页面显示：meal name / pickupTime / nextMeeting / buffer
8. 点击 👍 或 👎
9. 确认 feedback 被接收

全部通过 → ✅ Demo Ready
```

- [ ] **Step 2: Commit**

```bash
git add docs/qa-checklist.md
git commit -m "docs: add QA checklist with P0/P1/P2 cases and golden path"
```

---

## Task 7: Hackathon Slides（3页）

**Files:**
- Create: `docs/slides.md`

> 比赛要求恰好 3 页：Team / Product / Demo

- [ ] **Step 1: 创建 Slides 内容文档**

```markdown
# FEED ME — Hackathon Slides

---

## SLIDE 1: TEAM

**FEED ME**

*One tap. Your agent figures out what you should eat — and makes it happen.*

---

[Team names / photos]

[Brief 1-line background each]

Built at: Beta Hackathon — Agent Factory (Qoder × Beta Fund)

---

## SLIDE 2: PRODUCT

### The Problem

Every food app makes you make every decision:
Which restaurant? Which dish? Pickup or delivery? How much to spend? Do I have time?

### The Insight

These decisions aren't hard — they're *friction*.
The user already knows everything the agent needs to know.

### Feed Me

The user states one thing:

> **I'm hungry.**

The agent handles everything else.

---

**How it works:**

```
User: "I'm hungry"
         ↓
Agent reads: current time + calendar + location + budget + preferences
         ↓
Agent decides: what fits, what you'll like, what you can afford, pickup or delivery
         ↓
ONE recommendation. One tap to confirm.
         ↓
Snaplii executes the transaction.
```

**Why this is an agent, not an app:**

Traditional apps: User → Search → Filter → Compare → Decide → Pay

Feed Me: User states → Agent reasons → Agent acts

**Snaplii's role:**

Feed Me = Decision + Orchestration layer
Snaplii = Commerce execution rail

---

**Future:**

> "I'm hungry." → "I'm bored." → "I'm late." → "I have two hours free."

The pattern: **Human State → Agent → Real-world action.**
Food is the first vertical because the outcome is immediate, understandable, and transactional.

---

## SLIDE 3: DEMO

**Live demo — 60 seconds**

Golden path:
1. Tap **I'M HUNGRY**
2. Agent checks calendar, calculates time, selects meal
3. One recommendation appears
4. User confirms → Snaplii executes
5. 👍 feedback

---

**Tech stack:**

- Next.js + TypeScript (frontend + API)
- Deterministic decision engine (no LLM dependency for core logic)
- CalendarAdapter (real / mock fallback)
- CommerceAdapter via Snaplii
- Qoder Agent Mode for development

**Live URL:** [insert before submission]
```

- [ ] **Step 2: Commit**

```bash
git add docs/slides.md
git commit -m "docs: add 3-page hackathon slides content"
```

---

## Task 8: Demo 脚本（60–90秒）

**Files:**
- Create: `docs/demo-script.md`

- [ ] **Step 1: 创建 Demo 脚本**

```markdown
# FEED ME — Demo Script

**Target length: 60–90 seconds. Hard cap: 90 seconds.**

---

## Setup（presenter 做的，不说出来）

- 打开 App，停在首页（I'M HUNGRY 按钮可见）
- Demo user 已配置：1:15 PM / Meeting at 2:00 PM / $20 budget / Asian, Chicken, Light meals

---

## Script

**[点击 I'M HUNGRY]**

> "Most food apps make you make every decision yourself.
> Which restaurant, which dish, pickup or delivery, how much to spend — all of it.
> Feed Me starts from a different place."

**[Loading animation 播放：Checking your day... Next meeting found... Calculating time... Choosing meal...]**

> "The agent already knows I have a meeting in 45 minutes.
> It knows my usual budget is $20.
> It knows what I tend to like."

**[Decision screen 出现：Chicken Teriyaki Bowl / $14.80 / Pickup 11 min / Buffer 27 min]**

> "Instead of showing me twenty restaurants and making me decide,
> the agent makes one decision.
> This bowl fits before my meeting, it's under budget, and it matches my preferences.
> Here's why it chose this."

**[点击 CONFIRM]**

> "Snaplii is the commerce rail.
> Feed Me is the decision layer — figuring out what should happen, and when."

**[Success screen 出现：Order confirmed. Pickup 1:28 PM. Buffer 24 min.]**

> "Order placed."

**[点击 👍]**

> "And this feedback makes the next decision better."

---

## Timing check

| Segment | Target |
|---------|--------|
| Opening (before tap) | 5s |
| Loading animation | 10s |
| Explaining decision screen | 20s |
| Confirm + purchase | 10s |
| Success + feedback | 10s |
| **Total** | **~55s** |

如果时间太短可以在 Decision screen 多停一拍，指向具体信息。

---

## Backup lines（如果 live demo 出问题）

如果 API 失败：
> "We have a fallback demo ready — the flow is identical."
切到 mock mode，继续脚本。

如果 Snaplii 失败：
> "The commerce execution is going through sandbox today."
UI 保持不变，继续脚本。

---

## Things NOT to say

- 不要说 "This is just a prototype"
- 不要道歉
- 不要解释技术架构细节（除非评委问）
- 不要说 "As you can see" — 直接描述发生了什么
```

- [ ] **Step 2: Commit**

```bash
git add docs/demo-script.md
git commit -m "docs: add 60-90s demo script with timing breakdown and backup lines"
```

---

## Task 9: 运行全部测试

- [ ] **Step 1: 运行所有测试**

```bash
npx jest --no-coverage
```

期望输出：所有 tests passed，0 failures。

- [ ] **Step 2: 如有失败，逐一修复后重新运行**

- [ ] **Step 3: 最终 commit**

```bash
git add .
git commit -m "test: verify all decision logic tests pass"
```

---

## 向 Person B 交付清单

完成以上所有 Task 后，告知 Person B：

1. **import 路径**：所有决策逻辑在 `src/feed/`
2. **`/api/feed` 需要调用的函数**：
   - `getMealType(currentTime)` → from `timeLogic.ts`
   - `getAvailableMinutes(currentTime, nextEventStart)` → from `timeLogic.ts`
   - `getUrgency(availableMinutes)` → from `timeLogic.ts`
   - `chooseMeal(meals, context, analysis, feedbackHistory)` → from `rankMeals.ts`
   - `candidateMeals` → from `candidateMeals.ts`
3. **Fallback 行为**：`chooseMeal` 返回 `null` 时，使用 `candidateMeals[0]` 作为默认
4. **类型**：所有类型从 `src/feed/types.ts` import

---

## 时间参考

| Task | 预计时间 |
|------|----------|
| Task 1: 类型定义 | 5 min |
| Task 2: 时间逻辑 | 10 min |
| Task 3: 决策规则 | 10 min |
| Task 4: 餐品数据 | 10 min |
| Task 5: 排名逻辑 | 20 min |
| Task 6: QA 清单 | 10 min |
| Task 7: Slides | 10 min |
| Task 8: Demo 脚本 | 10 min |
| Task 9: 全量测试 | 5 min |
| **Total** | **~90 min** |

目标：1:50 PM 前完成 Task 1–5（核心逻辑），交给 Person B 集成。
