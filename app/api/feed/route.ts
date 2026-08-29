import { NextRequest, NextResponse } from "next/server";
import { getMealType, getAvailableMinutes, getUrgency } from "@/src/feed/timeLogic";
import { chooseMeal } from "@/src/feed/rankMeals";
import { candidateMeals } from "@/src/feed/candidateMeals";
import { saveDecision } from "@/lib/decisionStore";
import { DEMO_MODE, DEMO_USER_CONTEXT } from "@/lib/demoConfig";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import type { UserContext } from "@/src/feed/types";

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  
  try {
    const body = await req.json().catch(() => ({}));
    const source: string = body.source ?? "web";
    const useDemo = DEMO_MODE || body.userId === "demo" || body.intent === "hungry";

    const userContext: UserContext = useDemo
      ? DEMO_USER_CONTEXT
      : {
          currentTime: body.currentTime ?? new Date().toTimeString().slice(0, 5),
          location: body.location ?? "San Francisco",
          nextEvent: body.nextEvent ?? null,
          budget: body.budget ?? 20,
          preferences: body.preferences ?? [],
        };

    const availableMinutes = getAvailableMinutes(userContext.currentTime, userContext.nextEvent?.start ?? null);
    const mealType = getMealType(userContext.currentTime);
    const urgency = getUrgency(availableMinutes);
    const analysis = { mealType, availableMinutes, urgency };

    const decision = chooseMeal(candidateMeals, userContext, analysis, []);

    const finalDecision = decision ?? {
      decisionId: `fallback-${Date.now()}`,
      item: candidateMeals[0].item,
      merchant: candidateMeals[0].merchant,
      price: candidateMeals[0].price,
      fulfillment: "pickup" as const,
      etaMinutes: candidateMeals[0].pickupEta,
      reason: "Best available option given your constraints.",
    };

    const contextSummary = {
      currentTime: userContext.currentTime,
      location: userContext.location,
      nextMeeting: userContext.nextEvent?.title ?? null,
      nextMeetingTime: userContext.nextEvent?.start ?? null,
      availableMinutes,
      budget: userContext.budget,
    };

    saveDecision(finalDecision.decisionId, {
      decision: finalDecision,
      context: contextSummary,
      source,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      decisionId: finalDecision.decisionId,
      context: contextSummary,
      decision: {
        mealType,
        item: finalDecision.item,
        merchant: finalDecision.merchant,
        price: finalDecision.price,
        fulfillment: finalDecision.fulfillment,
        etaMinutes: finalDecision.etaMinutes,
        bufferMinutes: availableMinutes - finalDecision.etaMinutes,
        reason: finalDecision.reason,
      },
      requiresConfirmation: true,
      source,
    });
  } catch (err) {
    console.error("/api/feed error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
