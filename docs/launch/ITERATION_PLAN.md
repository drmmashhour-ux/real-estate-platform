# Iteration plan

**Weekly rhythm** after the first month (or alongside [WEEK_BY_WEEK_PLAN](./WEEK_BY_WEEK_PLAN.md) if you prefer tighter loops).

---

## The loop

1. **Collect** feedback from demos, support chats, and [FEEDBACK_LOOP](./FEEDBACK_LOOP.md) notes.  
2. **Identify top 3 issues** (themes, not ten small tickets—unless a critical bug).  
3. **Fix or improve** those three: UX copy, bug, small flow change, or one thin slice of a feature.  
4. **Test again** with users who reported the issue *or* fresh demos to validate.

**Cycle time target:** ship something user-visible **at least weekly** when possible—even a copy change counts if it removes confusion.

---

## Rules

| Rule | Rationale |
|------|-----------|
| **Usability over new features** | Unused features add debt; confused users churn. |
| **Remove friction first** | Every extra field or step needs a reason. |
| **Don’t build everything at once** | Say no to roadmap items until current users’ top pains are addressed. |
| **One “big bet” at a time** | If you take on a large feature, pause other large work. |

---

## Prioritization shortcut

Ask for each candidate item:

1. Does it block **trust** (bugs, data wrong, security)? → **Do now.**  
2. Does it block **first success** (onboarding, core action)? → **This sprint.**  
3. Is it **frequent** across users? → **Soon.**  
4. Is it **one loud user** only? → **Defer** or validate with one more conversation.

---

## Connection to metrics

- After changes, watch [METRICS_TRACKING](./METRICS_TRACKING.md) for **2 weeks** before declaring success or failure.  
- Pair qualitative (“still confusing”) with quantitative (still no deals created).

---

## When to break the loop

- You have **clear repeat usage** and a stable story—then you can add parallel workstreams (e.g. integrations) with discipline.  
- Until then, keep the weekly loop **visible** to the team so scope creep stays visible.
