# FEED ME — Hackathon Slides

---

## SLIDE 1: TEAM

**FEED ME**

*One tap. Your agent figures out what you should eat — and makes it happen.*

---

[Team names / photos]

[Brief 1-line background each]

Built at: Beta Hackathon — Agent Factory (Qoder × Beta Fund)

---

## SLIDE 2: PRODUCT

### The Problem

Every food app makes you make every decision:
Which restaurant? Which dish? Pickup or delivery? How much to spend? Do I have time?

### The Insight

These decisions aren't hard — they're *friction*.
The user already knows everything the agent needs to know.

### Feed Me

The user states one thing:

> **I'm hungry.**

The agent handles everything else.

---

**How it works:**

```
User: "I'm hungry"
         ↓
Agent reads: current time + calendar + location + budget + preferences
         ↓
Agent decides: what fits, what you'll like, what you can afford, pickup or delivery
         ↓
ONE recommendation. One tap to confirm.
         ↓
Snaplii executes the transaction.
```

**Why this is an agent, not an app:**

Traditional apps: User → Search → Filter → Compare → Decide → Pay

Feed Me: User states → Agent reasons → Agent acts

**Snaplii's role:**

Feed Me = Decision + Orchestration layer
Snaplii = Commerce execution rail

---

**Future:**

> "I'm hungry." → "I'm bored." → "I'm late." → "I have two hours free."

The pattern: **Human State → Agent → Real-world action.**
Food is the first vertical because the outcome is immediate, understandable, and transactional.

---

## SLIDE 3: DEMO

**Live demo — 60 seconds**

Golden path:
1. Tap **I'M HUNGRY**
2. Agent checks calendar, calculates time, selects meal
3. One recommendation appears
4. User confirms → Snaplii executes
5. 👍 feedback

---

**Tech stack:**

- Next.js + TypeScript (frontend + API)
- Deterministic decision engine (no LLM dependency for core logic)
- CalendarAdapter (real / mock fallback)
- CommerceAdapter via Snaplii
- Qoder Agent Mode for development

**Live URL:** [insert before submission]
