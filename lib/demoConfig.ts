export const DEMO_MODE = process.env.DEMO_MODE !== "false";

export const DEMO_USER_CONTEXT = {
  currentTime: "13:15",
  location: "San Francisco",
  nextEvent: {
    title: "Product Meeting",
    start: "14:00",
    location: "San Francisco",
  },
  budget: 20,
  preferences: ["Asian", "Chicken", "Light meals"],
};
