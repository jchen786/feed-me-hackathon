import { NextRequest, NextResponse } from "next/server";
import { getDecision } from "@/lib/decisionStore";
import { executePurchase } from "@/lib/commerceAdapter";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  
  try {
    const body = await req.json().catch(() => ({}));
    const { decisionId } = body;
    if (!decisionId) {
      return NextResponse.json({ error: "decisionId required" }, { status: 400 });
    }
    const stored = getDecision(decisionId);
    if (!stored) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }
    const result = await executePurchase(stored.decision);
    return NextResponse.json(result);
  } catch (err) {
    console.error("/api/purchase error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
