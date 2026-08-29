import { NextRequest, NextResponse } from "next/server";

export function checkAuth(req: NextRequest): boolean {
  const secret = req.headers.get("x-api-secret");
  const expectedSecret = process.env.API_SECRET;
  
  if (!expectedSecret) return true; // No secret configured = allow all (dev mode)
  return secret === expectedSecret;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized. Provide valid x-api-secret header." },
    { status: 401 }
  );
}
