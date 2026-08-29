# FEED ME — Demo Script

**Target length: 60–90 seconds. Hard cap: 90 seconds.**

---

## Setup（presenter 做的，不说出来）

- 打开 App，停在首页（I'M HUNGRY 按钮可见）
- Demo user 已配置：1:15 PM / Meeting at 2:00 PM / $20 budget / Asian, Chicken, Light meals

---

## Script

**[点击 I'M HUNGRY]**

> "Most food apps make you make every decision yourself.
> Which restaurant, which dish, pickup or delivery, how much to spend — all of it.
> Feed Me starts from a different place."

**[Loading animation 播放：Checking your day... Next meeting found... Calculating time... Choosing meal...]**

> "The agent already knows I have a meeting in 45 minutes.
> It knows my usual budget is $20.
> It knows what I tend to like."

**[Decision screen 出现：Chicken Teriyaki Bowl / $14.80 / Pickup 11 min / Buffer 27 min]**

> "Instead of showing me twenty restaurants and making me decide,
> the agent makes one decision.
> This bowl fits before my meeting, it's under budget, and it matches my preferences.
> Here's why it chose this."

**[点击 CONFIRM]**

> "Snaplii is the commerce rail.
> Feed Me is the decision layer — figuring out what should happen, and when."

**[Success screen 出现：Order confirmed. Pickup 1:28 PM. Buffer 24 min.]**

> "Order placed."

**[点击 👍]**

> "And this feedback makes the next decision better."

---

## Timing check

| Segment | Target |
|---------|--------|
| Opening (before tap) | 5s |
| Loading animation | 10s |
| Explaining decision screen | 20s |
| Confirm + purchase | 10s |
| Success + feedback | 10s |
| **Total** | **~55s** |

如果时间太短可以在 Decision screen 多停一拍，指向具体信息。

---

## Backup lines（如果 live demo 出问题）

如果 API 失败：
> "We have a fallback demo ready — the flow is identical."
切到 mock mode，继续脚本。

如果 Snaplii 失败：
> "The commerce execution is going through sandbox today."
UI 保持不变，继续脚本。

---

## Things NOT to say

- 不要说 "This is just a prototype"
- 不要道歉
- 不要解释技术架构细节（除非评委问）
- 不要说 "As you can see" — 直接描述发生了什么
