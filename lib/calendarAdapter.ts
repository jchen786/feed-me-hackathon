import type { CalendarEvent } from "@/src/feed/types";
import { DEMO_USER_CONTEXT } from "@/lib/demoConfig";

/**
 * Calendar source abstraction (see README "Priority 1").
 * GoogleCalendarAdapter is used once a user connects via OAuth;
 * MockCalendarAdapter keeps the demo running with DEMO_USER_CONTEXT.
 */
export interface CalendarAdapter {
  getNextEvent(userId: string): Promise<CalendarEvent | null>;
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

// --- OAuth configuration -------------------------------------------------

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function getRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:3001/api/auth/google/callback"
  );
}

export function getGoogleAuthUrl(userId: string): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", CALENDAR_READONLY_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", userId);
  return url.toString();
}

// --- Token storage (in-memory; sufficient for the hackathon demo) --------

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  /** epoch milliseconds */
  expiresAt: number;
}

const tokenStore = new Map<string, StoredTokens>();

export function storeCalendarTokens(
  userId: string,
  tokens: StoredTokens
): void {
  tokenStore.set(userId, tokens);
}

export function getCalendarTokens(
  userId: string
): StoredTokens | undefined {
  return tokenStore.get(userId);
}

export function isCalendarConnected(userId: string): boolean {
  return tokenStore.has(userId);
}

export async function exchangeCodeForTokens(
  code: string
): Promise<StoredTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed with ${response.status}`);
  }
  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

async function refreshCalendarTokens(
  refreshToken: string
): Promise<StoredTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Google token refresh failed with ${response.status}`);
  }
  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

// --- Event mapping --------------------------------------------------------

interface GoogleCalendarEventItem {
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
}

/** Maps a Google Calendar v3 event item to the engine's CalendarEvent. */
export function toCalendarEvent(
  item: GoogleCalendarEventItem
): CalendarEvent | null {
  // All-day events only carry start.date and cannot constrain a meal window.
  if (!item.start?.dateTime) return null;
  const start = new Date(item.start.dateTime);
  if (Number.isNaN(start.getTime())) return null;
  return {
    title: item.summary || "Calendar event",
    start: `${String(start.getHours()).padStart(2, "0")}:${String(
      start.getMinutes()
    ).padStart(2, "0")}`,
    ...(item.location ? { location: item.location } : {}),
  };
}

// --- Adapters -------------------------------------------------------------

export class GoogleCalendarAdapter implements CalendarAdapter {
  async getNextEvent(userId: string): Promise<CalendarEvent | null> {
    let tokens = getCalendarTokens(userId);
    if (!tokens) return null;

    // Refresh shortly-before-expiry tokens so the demo never stalls on 401s.
    if (
      tokens.expiresAt - Date.now() < 60_000 &&
      tokens.refreshToken &&
      isGoogleOAuthConfigured()
    ) {
      tokens = await refreshCalendarTokens(tokens.refreshToken);
      storeCalendarTokens(userId, tokens);
    }

    const url = new URL(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events`
    );
    url.searchParams.set("timeMin", new Date().toISOString());
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    // Fetch a few items so all-day events can be skipped.
    url.searchParams.set("maxResults", "5");

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(`Google Calendar responded with ${response.status}`);
    }

    const data = (await response.json()) as {
      items?: GoogleCalendarEventItem[];
    };
    for (const item of data.items ?? []) {
      const event = toCalendarEvent(item);
      if (event) return event;
    }
    return null;
  }
}

export class MockCalendarAdapter implements CalendarAdapter {
  async getNextEvent(_userId: string): Promise<CalendarEvent | null> {
    return DEMO_USER_CONTEXT.nextEvent;
  }
}

/** Connected users get Google; everyone else stays on the mock. */
export function getCalendarAdapter(userId: string): CalendarAdapter {
  if (isCalendarConnected(userId)) return new GoogleCalendarAdapter();
  return new MockCalendarAdapter();
}
