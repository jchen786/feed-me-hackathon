import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  storeCalendarTokens,
} from "@/lib/calendarAdapter";

/**
 * GET /api/auth/google/callback
 * Google redirects back here with ?code=...&state=<userId>.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const userId = req.nextUrl.searchParams.get("state") ?? "demo";

  if (!code) {
    return NextResponse.redirect(`${origin}/?calendar=error`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    storeCalendarTokens(userId, tokens);
    return NextResponse.redirect(`${origin}/?calendar=connected`);
  } catch (error) {
    console.error(
      "Google Calendar OAuth failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.redirect(`${origin}/?calendar=error`);
  }
}
