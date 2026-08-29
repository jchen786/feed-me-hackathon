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
  if (!apiKey) return null;

  try {
    const authRes = await fetch("https://aipayment.snaplii.com/v2/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: "feed-me-agent", api_key: apiKey }),
    });
    if (!authRes.ok) return null;
    const { access_token } = await authRes.json();

    const itemId = pickUberEatsItem(decision.price);
    const price = "15";

    const quoteRes = await fetch("https://aipayment.snaplii.com/v2/quote", {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        orderInfo: { orderType: "GIFT_CARD", item: { itemId, price }, orderContext: { giftOrder: "false" }, businessChannel: "APP" },
        paymentContext: { specifiedPrimaryPaymentMethod: "SNAPLII_CREDIT", voucherOption: "BEST_FIT", cashbackOption: "USE" },
      }),
    });
    if (!quoteRes.ok) return null;

    const purchaseRes = await fetch("https://aipayment.snaplii.com/v2/purchase", {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        orderInfo: { orderType: "GIFT_CARD", item: { itemId, price }, orderContext: { giftOrder: "false" }, businessChannel: "APP" },
        paymentContext: { specifiedPrimaryPaymentMethod: "SNAPLII_CREDIT", voucherOption: "BEST_FIT", cashbackOption: "USE" },
        delivery: { type: "WALLET", immediateSend: "true" },
      }),
    });
    if (!purchaseRes.ok) return null;
    const purchaseData = await purchaseRes.json();

    return {
      status: "success",
      merchant: decision.merchant,
      item: decision.item,
      amount: decision.price,
      fulfillment: decision.fulfillment,
      estimatedReadyTime: addMinutes(getCurrentTime(), decision.etaMinutes),
      confirmationId: purchaseData.orderNo || `SNAPLII-${Date.now().toString(36).toUpperCase()}`,
      isMock: false,
    };
  } catch (err) {
    console.error("Snaplii error:", err);
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
