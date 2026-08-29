import type { Decision } from "@/src/feed/types";

export interface PurchaseResult {
  status: "success" | "failed";
  merchant: string;
  item: string;
  amount: number;
  fulfillment: string;
  estimatedReadyTime: string;
  confirmationId: string;
  isMock: boolean;
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

const UBER_EATS_ITEM_ID = "CB0000000000264-CT000000003682"; // Variable $20-$500
const UBER_EATS_FIXED_15 = "CB0000000000264-CT000000003448"; // Fixed $15

function pickUberEatsItem(price: number): string {
  if (price <= 15) return UBER_EATS_FIXED_15;
  return UBER_EATS_FIXED_15; // Use $15 fixed for demo
}

async function trySnaplii(decision: Decision): Promise<PurchaseResult | null> {
  const apiKey = process.env.SNAPLII_API_KEY;
  console.log("[Snaplii] API key present:", !!apiKey, "length:", apiKey?.length);
  if (!apiKey || apiKey === "snp_sk_live_your_key_here" || apiKey === "your_key_here") {
    console.log("[Snaplii] Skipping — no real API key configured in .env.local");
    return null;
  }

  try {
    console.log("[Snaplii] Attempting auth...");
    const authRes = await fetch("https://aipayment.snaplii.com/v2/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: "feed-me-agent", api_key: apiKey }),
    });
    console.log("[Snaplii] Auth status:", authRes.status, "content-type:", authRes.headers.get("content-type"));

    const authText = await authRes.text();
    console.log("[Snaplii] Auth response body:", authText.substring(0, 200));

    if (!authRes.ok) {
      console.log("[Snaplii] Auth error:", authText);
      return null;
    }

    let authData: { access_token?: string };
    try {
      authData = JSON.parse(authText);
    } catch {
      console.log("[Snaplii] Auth response is not valid JSON — API key may be invalid");
      return null;
    }

    if (!authData.access_token) {
      console.log("[Snaplii] No access_token in auth response");
      return null;
    }
    console.log("[Snaplii] Got token:", !!authData.access_token);
    const access_token = authData.access_token;

    const itemId = pickUberEatsItem(decision.price);
    const price = "15";
    console.log("[Snaplii] Using itemId:", itemId, "price:", price);

    console.log("[Snaplii] Attempting quote...");
    const quoteRes = await fetch("https://aipayment.snaplii.com/v2/quote", {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        orderInfo: { orderType: "GIFT_CARD", item: { itemId, price }, orderContext: { giftOrder: "false" }, businessChannel: "APP" },
        paymentContext: { specifiedPrimaryPaymentMethod: "SNAPLII_CREDIT", voucherOption: "BEST_FIT", cashbackOption: "USE" },
      }),
    });
    console.log("[Snaplii] Quote status:", quoteRes.status);
    const quoteText = await quoteRes.text();
    console.log("[Snaplii] Quote response:", quoteText.substring(0, 300));
    if (!quoteRes.ok) {
      console.log("[Snaplii] Quote error:", quoteText);
      return null;
    }
    let quoteData: Record<string, unknown>;
    try {
      quoteData = JSON.parse(quoteText);
    } catch {
      console.log("[Snaplii] Quote response is not valid JSON");
      return null;
    }
    console.log("[Snaplii] Quote result:", JSON.stringify(quoteData));

    console.log("[Snaplii] Attempting purchase...");
    const purchaseRes = await fetch("https://aipayment.snaplii.com/v2/purchase", {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        orderInfo: { orderType: "GIFT_CARD", item: { itemId, price }, orderContext: { giftOrder: "false" }, businessChannel: "APP" },
        paymentContext: { specifiedPrimaryPaymentMethod: "SNAPLII_CREDIT", voucherOption: "BEST_FIT", cashbackOption: "USE" },
        delivery: { type: "WALLET", immediateSend: "true" },
      }),
    });
    console.log("[Snaplii] Purchase status:", purchaseRes.status);
    const purchaseText = await purchaseRes.text();
    console.log("[Snaplii] Purchase response:", purchaseText.substring(0, 300));
    if (!purchaseRes.ok) {
      console.log("[Snaplii] Purchase error:", purchaseText);
      return null;
    }
    let purchaseData: Record<string, unknown>;
    try {
      purchaseData = JSON.parse(purchaseText);
    } catch {
      console.log("[Snaplii] Purchase response is not valid JSON");
      return null;
    }
    console.log("[Snaplii] Purchase result:", JSON.stringify(purchaseData));

    return {
      status: "success",
      merchant: decision.merchant,
      item: decision.item,
      amount: decision.price,
      fulfillment: decision.fulfillment,
      estimatedReadyTime: addMinutes(getCurrentTime(), decision.etaMinutes),
      confirmationId: (purchaseData.orderNo as string) || `SNAPLII-${Date.now().toString(36).toUpperCase()}`,
      isMock: false,
    };
  } catch (err) {
    console.error("[Snaplii] Exception:", err);
    return null;
  }
}

function mockPurchase(decision: Decision): PurchaseResult {
  return {
    status: "success",
    merchant: decision.merchant,
    item: decision.item,
    amount: decision.price,
    fulfillment: decision.fulfillment,
    estimatedReadyTime: addMinutes(getCurrentTime(), decision.etaMinutes),
    confirmationId: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    isMock: true,
  };
}

export async function executePurchase(decision: Decision): Promise<PurchaseResult> {
  const live = await trySnaplii(decision);
  if (live) return live;
  return mockPurchase(decision);
}
