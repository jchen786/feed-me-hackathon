# Person B — 你的任务 Prompt

复制下面全部内容，粘贴到你的 Qoder IDE 空间。

---

## 复制开始 ↓

你是 FEED ME Hackathon MVP 项目的前端/全栈开发者（Person B）。

## 项目背景

FEED ME 是一个 Hackathon 产品。用户只需说 "I'm hungry"，Agent 自动分析时间、日历、预算、偏好，选出唯一最优餐品推荐，通过 Snaplii 完成购买。

## 当前项目状态

工作目录里已有 Person A 完成的决策引擎核心代码：

```
src/feed/
  types.ts          — 共享类型（CalendarEvent, UserContext, ContextAnalysis, CandidateMeal, Decision, FeedMeScore）
  timeLogic.ts      — getMealType(), getAvailableMinutes(), getUrgency()
  decisionRules.ts  — getFulfillmentPreference(), mealFitsWindow()
  candidateMeals.ts — 20 条 mock 餐品数据
tests/feed/
  timeLogic.test.ts
  decisionRules.test.ts
package.json        — 已有 typescript, jest, ts-jest
tsconfig.json
jest.config.js
```

**你需要在这个基础上构建 Next.js 应用。** 不要修改 src/feed/ 下的任何文件。

## 你需要完成的任务

### 任务 1: 初始化 Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
npm install uuid
npm install --save-dev @types/uuid
```

确保 tsconfig.json 有 `"paths": { "@/*": ["./*"] }` 并且 include 包含 `"src/**/*"`。

### 任务 2: 创建决策引擎最后一块

创建 `src/feed/rankMeals.ts`，实现 `rankMeals()` 和 `chooseMeal()` 函数。

排名权重：
- Timing Fit: 35%
- Preference Match: 25%
- Budget Fit: 20%
- Distance: 10%
- Feedback History: 10%

`chooseMeal()` 返回单一 Decision 对象（使用 uuid 生成 decisionId），或 null（无符合条件餐品时）。

依赖：
- `import { getFulfillmentPreference, mealFitsWindow } from "./decisionRules"`
- `import type { CandidateMeal, UserContext, ContextAnalysis, Decision, FeedMeScore } from "./types"`

### 任务 3: 创建 Demo 配置

创建 `lib/demoConfig.ts`：
```typescript
export const DEMO_MODE = process.env.DEMO_MODE !== "false";
export const DEMO_USER_CONTEXT = {
  currentTime: "13:15",
  location: "San Francisco",
  nextEvent: { title: "Product Meeting", start: "14:00", location: "San Francisco" },
  budget: 20,
  preferences: ["Asian", "Chicken", "Light meals"],
};
```

创建 `lib/decisionStore.ts`（内存存储）：
- `saveDecision(decisionId, data)` — 存储决策及其上下文和 source
- `getDecision(decisionId)` — 按 ID 取回

### 任务 4: 创建 Commerce Adapter

创建 `lib/commerceAdapter.ts`：
- `executePurchase(decision)` — 先尝试真实 Snaplii（如果 SNAPLII_API_KEY 存在），否则 fallback 到 mock
- Mock 返回 `{ status: "success", merchant, item, amount, fulfillment, estimatedReadyTime, confirmationId: "DEMO-xxx", isMock: true }`
- **绝对不要暴露 API key 到前端**

### 任务 5: 创建 API Routes

#### POST /api/feed

接受：
```json
{ "intent": "hungry", "userId": "demo", "source": "openclaw" }
```

返回（**恰好一个推荐**，不要返回列表）：
```json
{
  "decisionId": "...",
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
    "reason": "..."
  },
  "requiresConfirmation": true,
  "source": "openclaw"
}
```

逻辑：
1. 如果 DEMO_MODE 或 userId="demo"，使用 DEMO_USER_CONTEXT
2. 调用 getMealType, getAvailableMinutes, getUrgency
3. 调用 chooseMeal(candidateMeals, context, analysis, [])
4. 如果 chooseMeal 返回 null，用 candidateMeals[0] 做 fallback
5. 存入 decisionStore（含 source 字段）
6. 返回上述格式

#### POST /api/purchase

接受：`{ "decisionId": "..." }`
- 从 decisionStore 取回决策
- 调用 executePurchase(decision)
- 返回购买结果

#### POST /api/feedback

接受：`{ "decisionId": "...", "feedback": "like" | "dislike" }`
- 记录并返回 `{ "status": "recorded" }`

### 任务 6: 创建 Web UI（app/page.tsx）

Mobile-first，4 个屏幕状态：

**SCREEN 1 — HOME:**
- 大标题 "FEED ME"
- 巨大按钮 "I'M HUNGRY"
- 副标题 "We'll figure out the rest."

**SCREEN 2 — AGENT WORKING:**
- 动画显示 5 个步骤：
  - Checking your day...
  - Next meeting found ✓
  - Calculating available time ✓
  - Finding the right meal ✓
  - Choosing the best option ✓
- 每步间隔 600ms

**SCREEN 3 — DECISION:**
- 如果 source === "openclaw"，顶部显示橙色标签 "Triggered from OpenClaw"
- 显示：餐品名 / 商家 / 价格 / fulfillment / ETA
- 显示：Next meeting time / Buffer minutes
- 显示：WHY THIS? reason 文案
- 显示：Agent Trace（执行摘要，不是 chain-of-thought）：
  ```
  Human state: "I'M HUNGRY"
  ↓ Read context (Time / Budget)
  ↓ Calendar (meeting @ time)
  ↓ Available time (X minutes)
  ↓ Decision (pickup/delivery)
  ↓ Selected (item name)
  ```
- CONFIRM 按钮 + 小字 Change

**SCREEN 4 — COMPLETE:**
- "YOU'RE FED."
- 显示 pickup time / confirmation ID
- 如果 isMock，显示 "Sandbox / Demo transaction"
- 👍 / 👎 反馈按钮

### 任务 7: 创建 OpenClaw 集成文档

创建 `openclaw/OPENCLAW_SETUP.md`，包含：
- Base URL
- 3 个端点的请求/响应 schema
- 对话流程
- 错误处理

创建 `openclaw/tool-definition.json`，定义 3 个 tool：feed_me, confirm_purchase, submit_feedback

### 任务 8: 创建 .env.local

```
DEMO_MODE=true
# SNAPLII_API_KEY=your_key_here
```

### 任务 9: 验证

1. `npm run dev` 启动
2. `curl -X POST http://localhost:3000/api/feed -H "Content-Type: application/json" -d '{"intent":"hungry","userId":"demo","source":"openclaw"}'`
3. 验证返回恰好一个 decision
4. 用返回的 decisionId 调 /api/purchase
5. 验证 /api/feedback 正常
6. 浏览器打开 http://localhost:3000 验证完整 UI 流程
7. 运行 `npx jest --no-coverage` 确认所有测试通过

### 任务 10: Git Commit

```bash
git add -A
git commit -m "feat: complete Next.js app with API routes, UI, commerce adapter, OpenClaw docs"
```

## 重要约束

- **不要修改** src/feed/ 下已有的文件
- **不要添加** Uber、events、reservation、social、multi-recommendation 等功能
- **不要暴露** API key 到前端
- **不要** 让 Snaplii 失败导致 demo 崩溃（必须有 mock fallback）
- Web UI 的 I'M HUNGRY 按钮必须保留（作为 fallback demo）
- 所有 mock 购买必须标记 isMock: true

## 输出要求

完成后告诉我：
A. 本地 URL
B. /api/feed 的完整 URL
C. /api/purchase 的完整 URL
D. 认证要求
E. OPENCLAW_SETUP.md 的位置
F. 可以粘贴到 OpenClaw 的指令
G. 哪些是 mock 的，哪些是真实的

## 复制结束 ↑

---
