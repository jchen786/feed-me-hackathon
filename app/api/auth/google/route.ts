import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAuthUrl,
  isGoogleOAuthConfigured,
} from "@/lib/calendarAdapter";

/**
 * GET /api/auth/google?userId=demo
 * Redirects the browser to Google's OAuth consent screen.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!isGoogleOAuthConfigured()) {
    // No credentials yet: bounce back to the UI with a clear, friendly hint
    // instead of a raw JSON error page.
    return NextResponse.redirect(
      `${origin}/?calendar=error&reason=unconfigured`
    );
  }
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo";
  return NextResponse.redirect(getGoogleAuthUrl(userId));
}
