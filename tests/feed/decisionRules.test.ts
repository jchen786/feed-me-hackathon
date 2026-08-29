// tests/feed/decisionRules.test.ts
import { getFulfillmentPreference, mealFitsWindow } from "../../src/feed/decisionRules";

describe("getFulfillmentPreference", () => {
  it("returns pickup-only for < 20 min available", () => {
    expect(getFulfillmentPreference(15)).toBe("pickup_only");
  });
  it("returns prefer-pickup for 20-40 min", () => {
    expect(getFulfillmentPreference(30)).toBe("prefer_pickup");
  });
  it("returns either for 40-60 min", () => {
    expect(getFulfillmentPreference(50)).toBe("either");
  });
  it("returns either for > 60 min", () => {
    expect(getFulfillmentPreference(90)).toBe("either");
  });
});

describe("mealFitsWindow", () => {
  it("returns true if pickup eta fits with buffer", () => {
    expect(mealFitsWindow({ availableMinutes: 45, etaMinutes: 11, fulfillment: "pickup" })).toBe(true);
  });
  it("returns false if eta leaves no buffer", () => {
    expect(mealFitsWindow({ availableMinutes: 15, etaMinutes: 12, fulfillment: "pickup" })).toBe(false);
  });
  it("returns false if delivery eta too long", () => {
    expect(mealFitsWindow({ availableMinutes: 25, etaMinutes: 20, fulfillment: "delivery" })).toBe(false);
  });
});
