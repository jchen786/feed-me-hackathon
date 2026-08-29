# FEED ME — OpenClaw Integration Guide

## Base URL

Local development: `http://localhost:3000`
Production: `[insert deployed URL]`

## Authentication

None required for demo. All endpoints are public.

---

## Primary Actions

### feed_me()

Triggers the FEED ME agent to analyze context and return exactly ONE meal recommendation.

**Request:**
```
POST /api/feed
Content-Type: application/json
```

```json
{
  "intent": "hungry",
  "userId": "demo",
  "source": "openclaw"
}
```

**Response:**
```json
{
  "decisionId": "abc-123",
  "context": {
    "currentTime": "13:15",
    "location": "San Francisco",
    "nextMeeting": "Product Meeting",
    "nextMeetingTime": "14:00",
    "availableMinutes": 45,
    "budget": 20
  },
  "decision": {
    "mealType": "lunch",
    "item": "Chicken Teriyaki Bowl",
    "merchant": "Zen Kitchen",
    "price": 14.80,
    "fulfillment": "pickup",
    "etaMinutes": 11,
    "bufferMinutes": 27,
    "reason": "You have 45 minutes before your next meeting..."
  },
  "requiresConfirmation": true,
  "source": "openclaw"
}
```

---

### confirm_purchase(decisionId)

Executes the previously decided meal through the commerce layer (Snaplii).

**Request:**
```
POST /api/purchase
Content-Type: application/json
```

```json
{
  "decisionId": "abc-123"
}
```

**Response:**
```json
{
  "status": "success",
  "merchant": "Zen Kitchen",
  "item": "Chicken Teriyaki Bowl",
  "amount": 14.80,
  "fulfillment": "pickup",
  "estimatedReadyTime": "13:28",
  "confirmationId": "DEMO-A1B2C3",
  "isMock": true
}
```

---

### submit_feedback(decisionId, feedback)

Records user satisfaction with the meal decision.

**Request:**
```
POST /api/feedback
Content-Type: application/json
```

```json
{
  "decisionId": "abc-123",
  "feedback": "like"
}
```

**Response:**
```json
{ "status": "recorded" }
```

---

## Conversation Flow for OpenClaw

1. User says: "I'm hungry" (or equivalent)
2. OpenClaw calls: feed_me()
3. Present to user: item, price, fulfillment, ETA, reason
4. User confirms
5. OpenClaw calls: confirm_purchase(decisionId)
6. Present: order confirmed, pickup time
7. User reacts
8. OpenClaw calls: submit_feedback(decisionId, "like"|"dislike")

---

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Missing required field | Check request schema |
| 404 | decisionId not found | Call /api/feed first |
| 500 | Server error | Retry once, then show fallback |

---

## Notes

- The FEED ME agent makes ONE decision — do not ask the user to choose from a list.
- decisionId is only valid for the current server session (in-memory store for demo).
- isMock: true means sandbox/demo transaction, not a real charge.
- The web UI at / shows the agent trace for any request, including OpenClaw-triggered ones.
- When source is "openclaw", the web dashboard displays a "Triggered from OpenClaw" badge.
