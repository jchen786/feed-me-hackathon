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
  it("returns medium for 20-60 min", () => {
    expect(getUrgency(45)).toBe("medium");
  });
  it("returns low for > 60 min", () => {
    expect(getUrgency(90)).toBe("low");
  });
});
