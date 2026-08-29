"use client";
import { useState, useCallback } from "react";

type Screen = "home" | "working" | "decision" | "complete";

interface FeedResponse {
  decisionId: string;
  source: string;
  context: {
    currentTime: string;
    location: string;
    nextMeeting: string | null;
    nextMeetingTime: string | null;
    availableMinutes: number;
    budget: number;
  };
  decision: {
    mealType: string;
    item: string;
    merchant: string;
    price: number;
    fulfillment: string;
    etaMinutes: number;
    bufferMinutes: number;
    reason: string;
  };
  requiresConfirmation: boolean;
}

interface PurchaseResponse {
  status: string;
  merchant: string;
  item: string;
  amount: number;
  fulfillment: string;
  estimatedReadyTime: string;
  confirmationId: string;
  isMock: boolean;
}

const AGENT_STEPS = [
  "Checking your day...",
  "Next meeting found",
  "Calculating available time",
  "Finding the right meal",
  "Choosing the best option",
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [feedData, setFeedData] = useState<FeedResponse | null>(null);
  const [purchaseData, setPurchaseData] = useState<PurchaseResponse | null>(null);
  const [agentStep, setAgentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleHungry = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setScreen("working");
    setAgentStep(0);

    for (let i = 0; i < AGENT_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setAgentStep(i + 1);
    }

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-secret": "feedme-hackathon-2026-secret" },
        body: JSON.stringify({ intent: "hungry", userId: "demo", source: "web" }),
      });
      const data: FeedResponse = await res.json();
      setFeedData(data);
      setScreen("decision");
    } catch {
      setFeedData({
        decisionId: "fallback-demo",
        source: "web",
        context: { currentTime: "13:15", location: "San Francisco", nextMeeting: "Product Meeting", nextMeetingTime: "14:00", availableMinutes: 45, budget: 20 },
        decision: { mealType: "lunch", item: "Chicken Teriyaki Bowl", merchant: "Zen Kitchen", price: 14.80, fulfillment: "pickup", etaMinutes: 11, bufferMinutes: 27, reason: "You have 45 minutes before your next meeting. Pickup keeps you well within your time window." },
        requiresConfirmation: true,
      });
      setScreen("decision");
    }
    setLoading(false);
  }, [loading]);

  const handleConfirm = useCallback(async () => {
    if (!feedData) return;
    setLoading(true);
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-secret": "feedme-hackathon-2026-secret" },
        body: JSON.stringify({ decisionId: feedData.decisionId }),
      });
      const data: PurchaseResponse = await res.json();
      setPurchaseData(data);
    } catch {
      setPurchaseData({
        status: "success",
        merchant: feedData.decision.merchant,
        item: feedData.decision.item,
        amount: feedData.decision.price,
        fulfillment: feedData.decision.fulfillment,
        estimatedReadyTime: "13:28",
        confirmationId: "DEMO-FALLBACK",
        isMock: true,
      });
    }
    setScreen("complete");
    setLoading(false);
  }, [feedData]);

  const handleFeedback = useCallback(async (fb: "like" | "dislike") => {
    if (!feedData || feedbackSent) return;
    setFeedbackSent(true);
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-secret": "feedme-hackathon-2026-secret" },
      body: JSON.stringify({ decisionId: feedData.decisionId, feedback: fb }),
    }).catch(() => {});
  }, [feedData, feedbackSent]);

  const handleReset = useCallback(() => {
    setScreen("home");
    setFeedData(null);
    setPurchaseData(null);
    setAgentStep(0);
    setFeedbackSent(false);
    setLoading(false);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm">

        {screen === "home" && (
          <div className="flex flex-col items-center gap-8 text-center">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">FEED ME</h1>
              <p className="text-zinc-400 text-sm">We&apos;ll figure out the rest.</p>
            </div>
            <button
              onClick={handleHungry}
              className="w-full py-6 bg-white text-black text-2xl font-black rounded-2xl active:scale-95 transition-transform"
            >
              I&apos;M HUNGRY
            </button>
          </div>
        )}

        {screen === "working" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-zinc-400">Your agent is working...</h2>
            <div className="flex flex-col gap-3 mt-4">
              {AGENT_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`text-base transition-all duration-300 ${
                    i < agentStep ? "text-white" : "text-zinc-700"
                  }`}
                >
                  {i < agentStep ? `${step} ✓` : step}
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === "decision" && feedData && (
          <div className="flex flex-col gap-6">
            {feedData.source === "openclaw" && (
              <div className="text-xs text-orange-400 font-mono bg-orange-400/10 px-3 py-1 rounded-full self-start">
                Triggered from OpenClaw
              </div>
            )}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">YOUR LUNCH IS HANDLED.</p>
              <h2 className="text-2xl font-black">{feedData.decision.item}</h2>
              <p className="text-zinc-400">{feedData.decision.merchant}</p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-zinc-900 rounded-xl p-4">
                <div className="text-2xl font-bold">${feedData.decision.price.toFixed(2)}</div>
                <div className="text-zinc-500 text-xs mt-1">Price</div>
              </div>
              <div className="flex-1 bg-zinc-900 rounded-xl p-4">
                <div className="text-2xl font-bold capitalize">{feedData.decision.fulfillment}</div>
                <div className="text-zinc-500 text-xs mt-1">in {feedData.decision.etaMinutes} min</div>
              </div>
            </div>

            {feedData.context.nextMeeting && (
              <div className="bg-zinc-900 rounded-xl p-4 flex justify-between">
                <div>
                  <div className="text-xs text-zinc-500">Next meeting</div>
                  <div className="text-sm font-semibold">{feedData.context.nextMeetingTime}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Buffer</div>
                  <div className="text-sm font-semibold">{feedData.decision.bufferMinutes} min</div>
                </div>
              </div>
            )}

            <div className="bg-zinc-900 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">WHY THIS?</div>
              <p className="text-sm text-zinc-300">{feedData.decision.reason}</p>
            </div>

            <div className="bg-zinc-900 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-3 uppercase tracking-widest">Agent Trace</div>
              <div className="flex flex-col gap-2 text-xs font-mono">
                <div className="text-zinc-300">Human state: &quot;I&apos;M HUNGRY&quot;</div>
                <div className="text-zinc-500 pl-2">↓ Read context</div>
                <div className="text-zinc-400 pl-4">Time: {feedData.context.currentTime} · Budget: ${feedData.context.budget}</div>
                <div className="text-zinc-500 pl-2">↓ Calendar</div>
                <div className="text-zinc-400 pl-4">{feedData.context.nextMeeting ?? "No meeting"} @ {feedData.context.nextMeetingTime ?? "—"}</div>
                <div className="text-zinc-500 pl-2">↓ Available time</div>
                <div className="text-zinc-400 pl-4">{feedData.context.availableMinutes} minutes</div>
                <div className="text-zinc-500 pl-2">↓ Decision</div>
                <div className="text-zinc-400 pl-4">{feedData.decision.fulfillment} · {feedData.decision.mealType}</div>
                <div className="text-zinc-500 pl-2">↓ Selected</div>
                <div className="text-zinc-300 pl-4">{feedData.decision.item}</div>
                <div className="text-zinc-500 pl-2">↓ Tool</div>
                <div className="text-zinc-400 pl-4">Snaplii</div>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-4 bg-white text-black font-black text-lg rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? "Placing order..." : "CONFIRM"}
            </button>
            <button onClick={handleReset} className="text-zinc-600 text-sm text-center">
              Change
            </button>
          </div>
        )}

        {screen === "complete" && purchaseData && feedData && (
          <div className="flex flex-col gap-6 text-center">
            <div>
              <div className="text-5xl mb-3">✓</div>
              <h2 className="text-3xl font-black">YOU&apos;RE FED.</h2>
              <p className="text-zinc-400 text-sm mt-1">Order confirmed.</p>
              {purchaseData.isMock && (
                <p className="text-xs text-zinc-600 mt-1">Sandbox / Demo transaction</p>
              )}
            </div>

            <div className="bg-zinc-900 rounded-xl p-4 text-left flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">{purchaseData.fulfillment === "pickup" ? "Pickup" : "Delivery"}</span>
                <span className="text-sm font-semibold">{purchaseData.estimatedReadyTime}</span>
              </div>
              {feedData.context.nextMeeting && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-sm">Next meeting</span>
                  <span className="text-sm font-semibold">{feedData.context.nextMeetingTime}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Confirmation</span>
                <span className="text-sm font-mono">{purchaseData.confirmationId}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-zinc-400 text-sm">How was it?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleFeedback("like")}
                  disabled={feedbackSent}
                  className={`text-3xl transition-transform active:scale-95 ${feedbackSent ? "opacity-30" : ""}`}
                >
                  👍
                </button>
                <button
                  onClick={() => handleFeedback("dislike")}
                  disabled={feedbackSent}
                  className={`text-3xl transition-transform active:scale-95 ${feedbackSent ? "opacity-30" : ""}`}
                >
                  👎
                </button>
              </div>
              {feedbackSent && <p className="text-zinc-600 text-xs">Feedback recorded.</p>}
            </div>

            <button onClick={handleReset} className="text-zinc-600 text-sm">
              Start over
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
