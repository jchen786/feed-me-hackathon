# FEED ME — Final Slides (3 pages)

> One slide = one screen. Speaker notes are the lines starting with 🗣.
> TODO before submission: fill team names on Slide 1 and the final URL on Slide 3.

---

## SLIDE 1 — TEAM

**FEED ME**
*One tap. Your agent figures out what you should eat — and makes it happen.*

| | |
|---|---|
| **[Person A name]** | Decision engine, QA, presentation — [1-line background] |
| **[Person B name]** | Integrations, UI, deployment — [1-line background] |

Built in 24h at **Beta Hackathon — Agent Factory** (Qoder × Beta Fund).

🗣 *"We built FEED ME with one belief: the best food app is the one that
never asks you a question. One sentence in, one meal out."*

🗣 Split: one person built the brain (deterministic decision engine, 34
tests), the other wired it to the real world (calendar, Snaplii payments, UI).

---

## SLIDE 2 — PRODUCT

### Problem
Every food app makes YOU do the work:
search → filter → compare → decide → pay.
Five decisions before you eat.

### Insight
Those decisions aren't hard — they're *friction*.
Everything needed to make them already exists:
your **time**, your **calendar**, your **budget**, your **taste**.

### Solution
The user says one thing:

> **"I'm hungry."**

The agent returns **ONE meal** — the only one that fits — and buys it.

### Architecture

```
"I'm hungry"
   ↓
Context Layer     time · Google Calendar · budget · preferences
   ↓
Decision Engine   5-dimension score (deterministic, no LLM)
                  Timing 35% · Preference 25% · Budget 20%
                  Distance 10% · Feedback 10%
   ↓
ONE decision      "Chicken Teriyaki Bowl — pickup, 11 min,
                   34-min buffer before your 2pm meeting"
   ↓
Commerce Layer    Snaplii executes payment
   ↓
Feedback          👍/👎 trains the next decision
```

### Why an agent, not an app
App: User → Search → Filter → Compare → Decide → Pay
Agent: **User states → Agent reasons → Agent acts**

FEED ME = decision + orchestration layer · Snaplii = commerce rail

🗣 *"We deliberately return ONE recommendation, not a list. A list is
someone else's unfinished decision. We finish it."*

🗣 *"The core decision engine is deterministic and unit-tested — an LLM
could sit on top as the interface, but the judgment is auditable code."*

---

## SLIDE 3 — DEMO

### Live demo (60–90s)

1. Open the app — one button: **I'M HUNGRY**
2. Agent trace: checks calendar → calculates 45 free minutes → scores meals
3. ONE answer: Chicken Teriyaki Bowl, $14.80, pickup in 11 min, with *why*
4. Tap **CONFIRM** → Snaplii purchase completes on screen
5. 👍 — feedback feeds the next decision

**Live URL:** `https://mean-chairs-post.loca.lt` _(update to Vercel URL once deployed)_

**Tech stack**
- Next.js + TypeScript — frontend + API
- Deterministic decision engine (34 tests)
- Google Calendar via OAuth (mock fallback keeps the demo bulletproof)
- Snaplii REST API — real purchase rail
- OpenClaw tool integration — "I'm hungry" also works from chat

🗣 Backup lines if the live demo misbehaves: screenshots/video are in
`docs/demo-script.md`; the web button is the fallback path, and every
integration degrades to mock, so the flow never dead-ends.

### The pattern we're betting on

> "I'm hungry." → "I'm bored." → "I'm late." → "I have two hours free."

**Human state → Agent → Real-world action.**
Food first, because the outcome is immediate, understandable, transactional.

🗣 Close: *"FEED ME is the smallest complete version of that pattern:
one human sentence, one real transaction. Thank you."*
