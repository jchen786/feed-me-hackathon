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
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.",
      },
      { status: 503 }
    );
  }
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo";
  return NextResponse.redirect(getGoogleAuthUrl(userId));
}
