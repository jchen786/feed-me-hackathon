# FEED ME

**One tap. Your agent figures out what you should eat — and makes it happen.**

User says "I'm hungry" → Agent decides ONE best meal → Snaplii executes payment.

No search. No comparison. No decision fatigue.

---

## Current Status

### ✅ Completed

| Module | Status | Details |
|--------|--------|---------|
| Decision Engine | ✅ Done | timeLogic, decisionRules, rankMeals (5-dimension scoring), 24 tests passing |
| Web UI | ✅ Done | 4 screens (Home, Working, Decision, Complete) + Agent Trace visualization |
| API Endpoints | ✅ Done | `/api/feed`, `/api/purchase`, `/api/feedback` with auth (`x-api-secret` header) |
| Snaplii Integration | ✅ Done | Real Uber Eats gift card purchase via Snaplii REST API (isMock: false) |
| Public Deployment | ✅ Done | localtunnel: `https://mean-chairs-post.loca.lt` |
| OpenClaw Docs | ✅ Done | `openclaw/OPENCLAW_SETUP.md` + `tool-definition.json` |
| Product Manual | ✅ Done | `docs/product-manual.md` — full user journey, architecture, demo script, FAQ |

### ❌ Not Yet Implemented

| Module | Priority | Effort | Owner |
|--------|----------|--------|-------|
| Google Calendar OAuth | P0 | 2-3h | Person B |
| User address collection UI | P0 | 30min | Person B |
| Browser automation (Uber Eats order) | P1 | 3-4h | Person B |
| User registration/login | P1 | 2h | Person B |
| Feedback learning system | P2 | 4h | Person A |
| Multi-platform support (DoorDash) | P2 | 3h | Person B |

---

## Quick Start

```bash
# Clone
git clone <repo-url>
cd feed-me

# Install
npm install

# Configure
cat > .env.local << EOF
DEMO_MODE=true
SNAPLII_API_KEY=snp_sk_live_your_key_here
API_SECRET=your-secret-here
EOF

# Run
npm run dev

# Test
npm test
```

---

## API

**Base URL:** `https://mean-chairs-post.loca.lt` (or `http://localhost:3001` locally)

**Auth:** All requests require header `x-api-secret: <your-secret>`

### POST /api/feed

```json
// Request
{ "intent": "hungry", "userId": "demo", "source": "openclaw" }

// Response
{
  "decisionId": "uuid",
  "context": { "currentTime": "13:15", "availableMinutes": 45, "budget": 20, ... },
  "decision": { "item": "Chicken Teriyaki Bowl", "merchant": "Zen Kitchen", "price": 14.80, ... },
  "requiresConfirmation": true
}
```

### POST /api/purchase

```json
// Request
{ "decisionId": "uuid" }

// Response
{ "status": "success", "confirmationId": "PPD...", "isMock": false }
```

### POST /api/feedback

```json
// Request
{ "decisionId": "uuid", "feedback": "like" }

// Response
{ "status": "recorded" }
```

---

## Next Steps — A/B Division

### Person A: Decision Logic + QA + Presentation Content

**Priority 1: Feedback Learning System (P2, 4h)**
- [ ] Store like/dislike feedback in a simple JSON file or SQLite
- [ ] Use feedback as ranking signal in `rankMeals.ts`
- [ ] Liked cuisine/tags → boost score by 10%
- [ ] Disliked cuisine/tags → reduce score by 10%
- [ ] Write tests for feedback-influenced ranking

**Priority 2: QA & Edge Cases (ongoing)**
- [ ] Run `docs/qa-checklist.md` against live deployment
- [ ] Test: no calendar → fallback works
- [ ] Test: all meals over budget → graceful fallback
- [ ] Test: double-click prevention
- [ ] Test: API timeout handling

**Priority 3: Presentation Content**
- [ ] Finalize 3-slide content from `docs/product-manual.md`
- [ ] Write demo script timing (60-90s)
- [ ] Prepare backup lines for live demo failures
- [ ] Coordinate with Person B on slide design

**Deliverables for Person A:**
- Updated `rankMeals.ts` with feedback learning
- QA test results (all P0/P1 cases passed)
- Final slide content (text + talking points)

---

### Person B: Integration + UI + Deployment

**Priority 1: Google Calendar OAuth (P0, 2-3h)**
- [ ] Create Google Cloud project + OAuth 2.0 credentials
- [ ] Implement OAuth flow in Next.js (`/api/auth/google`)
- [ ] Create Calendar adapter (`lib/calendarAdapter.ts`)
  ```typescript
  interface CalendarAdapter {
    getNextEvent(userId: string): Promise<{ title: string; start: string } | null>;
  }
  ```
- [ ] Real implementation: Google Calendar API
- [ ] Mock fallback: `DEMO_USER_CONTEXT` (already exists)
- [ ] Replace hardcoded demo data with real calendar when authenticated
- [ ] Add "Connect Google Calendar" button to Web UI

**Priority 2: User Address Collection (P0, 30min)**
- [ ] Add address input to onboarding flow
- [ ] Store in `lib/userStore.ts` (in-memory for demo)
- [ ] Pass address to decision engine for distance calculation

**Priority 3: Browser Automation for Uber Eats Order (P1, 3-4h)**
- [ ] Install Playwright: `npm install playwright`
- [ ] Create `lib/orderExecutor.ts`
  ```typescript
  async function placeUberEatsOrder(giftCardCode: string, address: string, restaurant: string): Promise<{ orderId: string; eta: string }>
  ```
- [ ] Flow: open Uber Eats → add gift card → select restaurant → add item to cart → checkout → confirm
- [ ] Handle login wall (show QR code or manual login fallback)
- [ ] If automation fails → return gift card code to user with redemption instructions

**Priority 4: Deployment (1h)**
- [ ] Deploy to Vercel: `npx vercel`
- [ ] Configure environment variables in Vercel dashboard
- [ ] Get stable production URL
- [ ] Update OpenClaw docs with production URL
- [ ] Set up custom domain (optional)

**Priority 5: Presentation Slides (1h)**
- [ ] Design 3 slides based on `docs/product-manual.md` content
- [ ] Slide 1: Team (names, backgrounds, hackathon info)
- [ ] Slide 2: Product (problem → insight → solution → architecture diagram)
- [ ] Slide 3: Demo (live demo instructions + tech stack)

**Deliverables for Person B:**
- Working Google Calendar integration (or clear mock fallback)
- Address collection UI
- Browser automation prototype (even if incomplete)
- Deployed production URL (Vercel)
- 3 presentation slides (designed)

---

## Architecture

```
User (Web UI or OpenClaw)
    ↓
FEED ME API (/api/feed, /api/purchase, /api/feedback)
    ↓
Decision Engine (timeLogic → decisionRules → rankMeals)
    ↓
Context Layer (Google Calendar, User Preferences, Address)
    ↓
Commerce Layer (Snaplii → Uber Eats gift card)
    ↓
Order Execution (Browser automation → Uber Eats order)
```

**Key files:**
- `src/feed/` — Decision engine (types, timeLogic, decisionRules, rankMeals, candidateMeals)
- `app/api/` — API routes (feed, purchase, feedback)
- `lib/` — Business logic (auth, commerceAdapter, decisionStore, demoConfig)
- `app/page.tsx` — Web UI (4 screens)
- `openclaw/` — OpenClaw integration docs
- `docs/` — Product manual, QA checklist, slides, demo script

---

## Tech Stack

- **Framework:** Next.js 16 + TypeScript + Tailwind CSS
- **Testing:** Jest + ts-jest (24 tests)
- **Payment:** Snaplii REST API (Uber Eats gift cards)
- **Deployment:** localtunnel (demo) → Vercel (production)
- **Calendar:** Google Calendar API (TODO)
- **Browser Automation:** Playwright (TODO)

---

## Security

- All API endpoints require `x-api-secret` header
- Snaplii API key stored in `.env.local` (gitignored)
- No credentials exposed to frontend
- Snaplii uses prepaid balance (no credit card risk)
- API key is scoped and revocable in Snaplii app

---

## Demo

**Live URL:** https://mean-chairs-post.loca.lt

**Demo flow (60-90 seconds):**
1. Open web UI
2. Tap "I'M HUNGRY"
3. Watch agent trace (checking calendar, calculating time, selecting meal)
4. See recommendation (one meal, with reason)
5. Tap CONFIRM
6. See success (Snaplii purchased Uber Eats gift card)
7. Tap 👍

**Demo user:**
- Time: 1:15 PM
- Next meeting: Product Meeting @ 2:00 PM
- Budget: $20
- Preferences: Asian, Chicken, Light meals
- Location: San Francisco

---

## License

MIT
