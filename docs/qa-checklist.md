# FEED ME — QA Checklist

## P0 — 会导致 Hackathon Demo 中断

| # | Case | Steps to reproduce | Expected | Status |
|---|------|--------------------|----------|--------|
| P0-1 | 没有 Calendar 数据 | 删除/注释 mock calendar event | 系统使用 fallback，availableMinutes = 480，正常返回 Decision | ☐ |
| P0-2 | 下一场活动只有 10 分钟后 | nextEvent.start = currentTime + 10 min | 系统选最快 pickup（eta ≤ 0 min），或返回 "no options fit" gracefully | ☐ |
| P0-3 | 所有候选餐品超出预算 | 把 budget 设为 5，所有 price > 5 | API 返回 fallback decision，UI 不崩溃 | ☐ |
| P0-4 | Snaplii / commerce 调用失败 | 模拟 executePurchase() throw error | UI 显示 mock 成功状态，不白屏 | ☐ |
| P0-5 | 用户连续点击 I'M HUNGRY 两次 | 快速双击按钮 | 第二次点击被 debounce，不触发第二个 API 请求 | ☐ |
| P0-6 | /api/feed 网络超时 | 模拟 5s 延迟 | Loading 状态正常显示；超时后显示 fallback decision | ☐ |
| P0-7 | 空 preferences 数组 | preferences: [] | Decision 仍然返回；reason 中不提 preferences | ☐ |

## P1 — 可见质量问题，Demo 中会尴尬

| # | Case | Steps to reproduce | Expected | Status |
|---|------|--------------------|----------|--------|
| P1-1 | availableMinutes 恰好等于 ETA + 10 | availableMinutes=21, pickupEta=11 | 刚好通过 mealFitsWindow，返回该餐品 | ☐ |
| P1-2 | 午夜时间 mealType | currentTime="23:30" | mealType = "late_night"，reason 说明 late night | ☐ |
| P1-3 | 餐品 reason 文案不合理 | 所有正常 case 检查 reason 字段 | 文案自然，不出现 undefined 或乱码 | ☐ |
| P1-4 | 移动端布局溢出 | 在 375px 宽度查看所有 4 屏 | 无横向滚动，文字不截断 | ☐ |
| P1-5 | CONFIRM 后再次点击 | 在 success 页面点击返回，再次 I'M HUNGRY | 新的 decisionId 生成，旧状态清空 | ☐ |
| P1-6 | 餐品价格显示 | price = 14.8 | UI 显示 $14.80，不是 $14.8 | ☐ |

## P2 — 未来改进（今天不修）

- 多语言支持
- 真实 Calendar OAuth 集成
- Preference editor UI
- 历史订单记录
- 多餐品对比视图

---

## Demo Golden Path 验证（每次 Qoder 更新后必跑）

运行 5 次完整流程：

1. 打开 App
2. 点击 I'M HUNGRY
3. 等待 loading 动画完成
4. 确认 Decision 页面显示：meal name / price / fulfillment / ETA / buffer / reason
5. 点击 CONFIRM
6. 等待 purchase 状态
7. 确认 Success 页面显示：meal name / pickupTime / nextMeeting / buffer
8. 点击 👍 或 👎
9. 确认 feedback 被接收

全部通过 → Demo Ready
