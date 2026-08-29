import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { decisionId, feedback } = body;
    if (!decisionId || !["like", "dislike"].includes(feedback)) {
      return NextResponse.json({ error: "decisionId and feedback (like|dislike) required" }, { status: 400 });
    }
    console.log("Feedback:", { decisionId, feedback });
    return NextResponse.json({ status: "recorded" });
  } catch (err) {
    console.error("/api/feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
