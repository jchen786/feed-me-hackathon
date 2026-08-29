import { NextRequest, NextResponse } from "next/server";
import {
  isCalendarConnected,
  isGoogleOAuthConfigured,
} from "@/lib/calendarAdapter";

/**
 * GET /api/calendar/status?userId=demo
 * Lets the UI show whether Google Calendar is configured/connected.
 * Returns booleans only — no credentials or calendar data.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo";
  return NextResponse.json({
    configured: isGoogleOAuthConfigured(),
    connected: isCalendarConnected(userId),
  });
}
