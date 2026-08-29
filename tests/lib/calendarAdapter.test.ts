import {
  GoogleCalendarAdapter,
  MockCalendarAdapter,
  getCalendarAdapter,
  isCalendarConnected,
  isGoogleOAuthConfigured,
  storeCalendarTokens,
  toCalendarEvent,
} from "../../lib/calendarAdapter";

describe("toCalendarEvent", () => {
  it("maps a timed Google Calendar event to the engine format", () => {
    const event = toCalendarEvent({
      summary: "Product Meeting",
      location: "San Francisco",
      start: { dateTime: "2026-08-29T14:00:00" },
    });
    expect(event).not.toBeNull();
    expect(event!.title).toBe("Product Meeting");
    expect(event!.start).toBe("14:00");
    expect(event!.location).toBe("San Francisco");
  });

  it("skips all-day events that cannot constrain a meal window", () => {
    const event = toCalendarEvent({
      summary: "Company Offsite",
      start: { date: "2026-08-29" },
    });
    expect(event).toBeNull();
  });

  it("defaults the title and omits location when absent", () => {
    const event = toCalendarEvent({
      start: { dateTime: "2026-08-29T09:30:00" },
    });
    expect(event).not.toBeNull();
    expect(event!.title).toBe("Calendar event");
    expect(event!.location).toBeUndefined();
  });

  it("rejects unparseable start times", () => {
    expect(toCalendarEvent({ start: { dateTime: "not-a-date" } })).toBeNull();
  });
});

describe("adapter selection and fallback", () => {
  it("mock adapter returns the demo event", async () => {
    const event = await new MockCalendarAdapter().getNextEvent("demo");
    expect(event).toEqual({
      title: "Product Meeting",
      start: "14:00",
      location: "San Francisco",
    });
  });

  it("unconnected users get the mock adapter", () => {
    expect(getCalendarAdapter("someone-new")).toBeInstanceOf(MockCalendarAdapter);
  });

  it("connected users get the Google adapter", () => {
    storeCalendarTokens("connected-user", {
      accessToken: "token",
      expiresAt: Date.now() + 3600_000,
    });
    expect(isCalendarConnected("connected-user")).toBe(true);
    expect(getCalendarAdapter("connected-user")).toBeInstanceOf(
      GoogleCalendarAdapter
    );
  });

  it("Google adapter returns null without stored tokens", async () => {
    const event = await new GoogleCalendarAdapter().getNextEvent("no-tokens");
    expect(event).toBeNull();
  });
});

describe("isGoogleOAuthConfigured", () => {
  const ORIGINAL_ID = process.env.GOOGLE_CLIENT_ID;
  const ORIGINAL_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  afterEach(() => {
    if (ORIGINAL_ID === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = ORIGINAL_ID;
    if (ORIGINAL_SECRET === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = ORIGINAL_SECRET;
  });

  it("is false without credentials", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleOAuthConfigured()).toBe(false);
  });

  it("is true with credentials", () => {
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    expect(isGoogleOAuthConfigured()).toBe(true);
  });
});
