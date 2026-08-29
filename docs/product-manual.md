# FEED ME — 产品说明书 & Presentation 大纲

## 一、产品概述

**FEED ME** 是一个 AI Agent 驱动的外卖决策系统。用户只需说 "I'm hungry"，Agent 自动分析时间、日程、预算、偏好，选出唯一最优餐品，通过 Snaplii 完成支付。

**核心价值：** 减少决策成本。不是给用户 10 个选择，而是帮用户做 1 个决定。

---

## 二、用户链路（User Journey）

### 2.1 首次使用设置（Onboarding）

```
用户首次打开 FEED ME
    ↓
1. 授权 Google Calendar
   - OAuth 2.0 流程
   - 允许 FEED ME 读取日程（只读权限）
   
2. 设置配送地址
   - 家庭地址
   - 工作地址
   - 或自动获取当前 GPS 位置
   
3. 设置预算
   - 默认 $20/餐
   - 可调整
   
4. 设置饮食偏好
   - 喜欢的菜系（Asian, Italian, etc.）
   - 过敏/忌口
   - 不喜欢的食材
```

### 2.2 日常使用流程

```
用户说 "I'm hungry"（通过 Web UI 或 OpenClaw）
    ↓
Agent 读取上下文：
  - 当前时间：1:15 PM
  - 下一场会议：Product Meeting @ 2:00 PM（从 Google Calendar）
  - 可用时间：45 分钟
  - 预算：$20
  - 偏好：Asian, Chicken, Light meals
  - 配送地址：工作地址
    ↓
Agent 决策：
  - 计算时间约束（需要在 2:00 PM 前吃到）
  - 筛选符合条件的餐厅（配送 ETA < 35 分钟）
  - 匹配偏好（Asian + Chicken + Light meals）
  - 预算内（< $20）
  - 排名选出最优：Chicken Teriyaki Bowl @ Zen Kitchen, $14.80, Pickup 11min
    ↓
显示推荐：
  ┌─────────────────────────────────┐
  │ YOUR LUNCH IS HANDLED.          │
  │                                 │
  │ Chicken Teriyaki Bowl           │
  │ Zen Kitchen                     │
  │                                 │
  │ $14.80  |  Pickup in 11 min    │
  │                                 │
  │ Next meeting: 2:00 PM           │
  │ Buffer: 34 min                  │
  │                                 │
  │ WHY THIS?                       │
  │ "You have 45 minutes before     │
  │  your meeting. Pickup keeps     │
  │  you well within your time      │
  │  window. This fits your $20     │
  │  budget and matches your        │
  │  preferences."                  │
  │                                 │
  │ [CONFIRM]  [Change]             │
  └─────────────────────────────────┘
    ↓
用户点 CONFIRM
    ↓
支付流程：
  1. Snaplii API 购买 Uber Eats 礼品卡（$15）
  2. 获取礼品卡兑换码
  3. 【需要浏览器自动化】
     - 打开 Uber Eats
     - 添加礼品卡作为支付方式
     - 从 Zen Kitchen 下单
     - 配送到工作地址
     - 选择 "ASAP" 配送
    ↓
显示确认：
  ┌─────────────────────────────────┐
  │ YOU'RE FED.                     │
  │                                 │
  │ Order confirmed.                │
  │ Pickup: 1:28 PM                 │
  │                                 │
  │ Next meeting: 2:00 PM           │
  │ Buffer: 32 min                  │
  │                                 │
  │ Confirmation: PPD157670...      │
  │                                 │
  │ How was it?                     │
  │ [👍]  [👎]                      │
  └─────────────────────────────────┘
    ↓
用户点 👍
    ↓
反馈记录（用于未来优化推荐）
```

---

## 三、技术架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户入口                            │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Web UI     │         │   OpenClaw   │             │
│  │  (Next.js)   │         │    Agent     │             │
│  └──────┬───────┘         └──────┬───────┘             │
│         │                        │                     │
│         └────────┬───────────────┘                     │
│                  │                                     │
│                  ▼                                     │
│         ┌────────────────┐                            │
│         │  FEED ME API   │  (认证: x-api-secret)      │
│         │  /api/feed     │                            │
│         │  /api/purchase │                            │
│         │  /api/feedback │                            │
│         └────────┬───────┘                            │
│                  │                                     │
│                  ▼                                     │
│         ┌────────────────────────────────────────┐    │
│         │        Decision Engine                 │    │
│         │  - timeLogic (meal type, urgency)      │    │
│         │  - decisionRules (pickup/delivery)     │    │
│         │  - rankMeals (5维评分)                  │    │
│         │  - candidateMeals (20条mock数据)        │    │
│         └────────┬───────────────────────────────┘    │
│                  │                                     │
│                  ▼                                     │
│         ┌────────────────┐                            │
│         │ Context Layer  │                            │
│         │  - Google Calendar API (待实现)              │
│         │  - User Preferences                        │
│         │  - Budget & Address                        │
│         └────────┬───────┘                            │
│                  │                                     │
│                  ▼                                     │
│         ┌────────────────────────────────────────┐    │
│         │      Commerce Layer (Snaplii)          │    │
│         │  1. Auth → JWT token                   │    │
│         │  2. 购买 Uber Eats 礼品卡               │    │
│         │  3. 获取兑换码                          │    │
│         └────────┬───────────────────────────────┘    │
│                  │                                     │
│                  ▼                                     │
│         ┌────────────────────────────────────────┐    │
│         │   Order Execution (待实现)              │    │
│         │  - 浏览器自动化 (Playwright/Puppeteer)  │    │
│         │  - 打开 Uber Eats                      │    │
│         │  - 添加礼品卡                          │    │
│         │  - 下单 + 配送                         │    │
│         └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 四、当前实现状态

### ✅ 已完成

| 模块 | 状态 | 说明 |
|------|------|------|
| 决策引擎 | ✅ 完成 | timeLogic, decisionRules, rankMeals, 24测试通过 |
| Web UI | ✅ 完成 | 4屏（Home, Working, Decision, Complete）+ Agent Trace |
| API 端点 | ✅ 完成 | /api/feed, /api/purchase, /api/feedback + 认证 |
| Snaplii 集成 | ✅ 完成 | 真实购买 Uber Eats 礼品卡，isMock: false |
| 公网部署 | ✅ 完成 | localtunnel: https://mean-chairs-post.loca.lt |
| OpenClaw 文档 | ✅ 完成 | openclaw/OPENCLAW_SETUP.md |

### ❌ 待实现

| 模块 | 优先级 | 工作量 | 说明 |
|------|--------|--------|------|
| Google Calendar 集成 | P0 | 2-3小时 | OAuth + Calendar API，替换 mock 数据 |
| 用户地址收集 | P0 | 30分钟 | UI + 存储 |
| 浏览器自动化下单 | P1 | 3-4小时 | Playwright 控制 Uber Eats 下单 |
| 用户注册/登录 | P1 | 2小时 | 保存偏好、地址、历史 |
| 反馈学习系统 | P2 | 4小时 | 用 like/dislike 优化排名权重 |

---

## 五、Demo 脚本（60-90秒）

### 场景设置
- 时间：1:15 PM
- 用户日程：2:00 PM 有 Product Meeting
- 预算：$20
- 偏好：Asian, Chicken, Light meals
- 地址：工作地址（San Francisco）

### 演示流程

**[打开 Web UI]**

> "Most food apps make you make every decision yourself. Which restaurant, which dish, pickup or delivery, how much to spend — all of it. Feed Me starts from a different place."

**[点击 I'M HUNGRY]**

> "The agent already knows I have a meeting in 45 minutes. It knows my usual budget is $20. It knows what I tend to like."

**[Agent Trace 动画播放]**

> "Instead of showing me twenty restaurants and making me decide, the agent makes one decision."

**[Decision Screen 显示]**

> "This bowl fits before my meeting, it's under budget, and it matches my preferences. Here's why it chose this."

**[点击 CONFIRM]**

> "Snaplii is the commerce rail. It buys an Uber Eats gift card, and in a production system, browser automation would place the actual order."

**[Success Screen]**

> "Order confirmed. And this feedback makes the next decision better."

**[点击 👍]**

> "The pattern is: Human State → Agent → Real-world Action. Food is just the first vertical. Tomorrow it's 'I'm bored' or 'I'm late'. The agent figures out what should happen, and makes it happen."

---

## 六、Slides 大纲（3页）

### Slide 1: Team
- 团队名称：FEED ME
- Tagline: "One tap. Your agent figures out what you should eat — and makes it happen."
- 团队成员 + 背景
- Built at: Beta Hackathon — Agent Factory (Qoder × Beta Fund)

### Slide 2: Product
**The Problem:**
- 传统外卖 app 让用户做所有决定
- 决策成本高，用户体验差

**The Insight:**
- 用户已经知道所有 Agent 需要的信息（时间、地点、预算、偏好）
- 不需要搜索、比较、筛选

**The Solution:**
- 用户只需说 "I'm hungry"
- Agent 自动：读取上下文 → 决策 → 执行
- 唯一推荐，一键确认

**How it works:**
```
User: "I'm hungry"
  ↓
Agent reads: time + calendar + location + budget + preferences
  ↓
Agent decides: ONE best meal
  ↓
Snaplii executes: payment via Uber Eats gift card
  ↓
[Browser automation places order]
```

**Why this is an agent, not an app:**
- Traditional: User → Search → Filter → Compare → Decide → Pay
- Feed Me: User states → Agent reasons → Agent acts

**Snaplii's role:**
- Feed Me = Decision + Orchestration layer
- Snaplii = Commerce execution rail

**Future:**
- "I'm hungry" → "I'm bored" → "I'm late" → "I have two hours free"
- Pattern: Human State → Agent → Real-world action

### Slide 3: Demo
**Live demo — 60 seconds**

Golden path:
1. Tap I'M HUNGRY
2. Agent checks calendar, calculates time, selects meal
3. One recommendation appears
4. User confirms → Snaplii executes
5. 👍 feedback

**Tech stack:**
- Next.js + TypeScript (frontend + API)
- Deterministic decision engine (5维评分)
- Google Calendar API (待实现)
- Snaplii for commerce (Uber Eats gift cards)
- Browser automation for order execution (待实现)
- Qoder Agent Mode for development

**Live URL:** https://mean-chairs-post.loca.lt

---

## 七、关键指标（Demo 时展示）

- **决策时间：** < 2 秒（从 "I'm hungry" 到推荐）
- **时间匹配准确率：** 100%（推荐总在用户可用时间内）
- **预算匹配率：** 100%（所有推荐 < $20）
- **偏好匹配率：** 100%（Asian + Chicken + Light meals）
- **真实支付：** ✅ Snaplii 购买 Uber Eats 礼品卡，isMock: false

---

## 八、FAQ（评委可能问的问题）

**Q: 为什么不直接调用 Uber Eats API？**
A: Uber Eats 没有公开的下单 API。Snaplii 通过礼品卡模式绕过这个限制：买礼品卡 → 在 Uber Eats 兑换 → 下单。

**Q: 浏览器自动化稳定吗？**
A: 生产环境需要处理登录、地址验证、支付确认等边界情况。Demo 阶段展示概念验证，生产需要更多工程化。

**Q: 如果用户不喜欢推荐怎么办？**
A: 用户可以点 "Change" 重新生成推荐。反馈（like/dislike）会用于优化未来推荐。

**Q: 隐私怎么保护？**
A: 
- Google Calendar 只读权限，只读取会议时间和标题
- 地址存储在用户账户，不共享
- API 认证防止未授权访问
- Snaplii 预付模式，不暴露信用卡信息

**Q: 商业模式？**
A: 
- Snaplii 提供 cashback（最高 7%）
- 平台可以抽取部分 cashback 作为收入
- 未来可以加订阅制（高级功能）

---

## 九、下一步开发计划

### Phase 1: MVP 完善（Hackathon 后 1 周）
- [ ] Google Calendar OAuth 集成
- [ ] 用户地址收集 UI
- [ ] 用户注册/登录
- [ ] 偏好设置页面

### Phase 2: 自动下单（2-3 周）
- [ ] Playwright 浏览器自动化
- [ ] Uber Eats 登录处理
- [ ] 礼品卡兑换流程
- [ ] 下单 + 配送确认

### Phase 3: 智能化（1-2 月）
- [ ] 反馈学习系统
- [ ] 多平台支持（DoorDash, Grubhub）
- [ ] 餐厅直接对接（不经过外卖平台）
- [ ] 语音交互（"Hey FEED ME, I'm hungry"）

### Phase 4: 扩展场景（3-6 月）
- [ ] "I'm bored" → 活动推荐
- [ ] "I'm late" → 交通/行程优化
- [ ] "I have two hours free" → 休闲推荐
- [ ] 多语言支持

---

## 十、技术细节（给开发者）

### API 文档

**Base URL:** https://mean-chairs-post.loca.lt

**认证:** 所有请求需要 `x-api-secret: feedme-hackathon-2026-secret` header

**POST /api/feed**
```json
Request:
{
  "intent": "hungry",
  "userId": "demo",
  "source": "openclaw"
}

Response:
{
  "decisionId": "uuid",
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
    "bufferMinutes": 34,
    "reason": "..."
  },
  "requiresConfirmation": true,
  "source": "openclaw"
}
```

**POST /api/purchase**
```json
Request:
{
  "decisionId": "uuid"
}

Response:
{
  "status": "success",
  "merchant": "Zen Kitchen",
  "item": "Chicken Teriyaki Bowl",
  "amount": 14.80,
  "fulfillment": "pickup",
  "estimatedReadyTime": "13:28",
  "confirmationId": "PPD157670...",
  "isMock": false
}
```

**POST /api/feedback**
```json
Request:
{
  "decisionId": "uuid",
  "feedback": "like"
}

Response:
{
  "status": "recorded"
}
```

### 本地开发

```bash
# 克隆项目
git clone <repo-url>
cd feed-me

# 安装依赖
npm install

# 配置环境变量
cat > .env.local << EOF
DEMO_MODE=true
SNAPLII_API_KEY=snp_sk_live_your_key
API_SECRET=your-secret
EOF

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

---

## 十一、总结

**FEED ME 证明了什么：**

1. **AI Agent 可以做决策**，不只是回答问题
2. **减少决策成本**是真实用户需求
3. **Snaplii 解决了 AI Agent 支付问题**
4. **Human State → Agent → Real-world Action** 是可扩展的交互模式

**下一步：** 完善 Google Calendar 集成 + 浏览器自动化下单，让 Demo 变成真正的产品。
