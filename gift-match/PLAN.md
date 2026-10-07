# Gift Match — Build & Ship Plan

**Goal:** a shareable, mobile-first gifting experience that predicts the best gift for someone
in ~60 seconds, and gets **15 real users within one week**.

## 1. Product principles

1. **Feels like a gift itself**: warm, soft and premium (serif headings, blush/cream palette, gentle motion).
2. **Under 60 seconds** to a result. Every step is one tap; optional steps can be skipped.
3. **Every finish creates a share.** Each result has two built-in share loops (see §4).
4. **Learn from day one.** Every session and answer is logged, and the founder dashboard shows it.

## 2. Screens (built page by page)

| # | Screen | Notes / improvements over the mock |
|---|--------|------------------------------------|
| 1 | Welcome | Hero + "Start Gift Match". Shows "Sent by {friend}" when opened from a share link |
| 2 | Who is this gift for? | Partner · Friend · Family · Colleague · Other (single, auto-advances) |
| 3 | Occasion | Birthday · Thank You · Celebration · New Beginning · Anniversary · Just Because |
| 4 | What are they into? | Multi-select (1–4), 10 interests |
| 5 | Vibe | Up to 3 vibes, with a counter |
| 6 | Budget | AED ranges |
| 7 | Personalization level | 1–3 hearts (depth, not love) |
| 8 | Personal touches | Name, birthday, photo (stays on the device), handle, message, notes. All optional |
| 9 | Matching… | Short animated "reading the signals" moment, which builds anticipation |
| 10 | Gift Match result | Curated box within budget, item list and price, personal card, **"Try another match"**, plus a **"why this works"** explanation |
| 11 | Purchase intent | Yes / Maybe / No + "what would you change?" |
| 12 | Share & predict | Loop A: ask the recipient "did we get it right?". Loop B: challenge a friend |
| R | Recipient view | Opens the gift (reveal animation), then rates it: Love it / It's nice / Not quite me |
| F | Founder view | Sessions, % Yes/Maybe/No, top interests, occasions, heart level, optional-details rate, recipient accuracy |

## 3. Matching engine (`src/engine`)

- A catalog of about 45 items, each tagged with interests, vibes, occasions, relationships, price (AED) and personalization depth.
- Score = interests×3 + vibes×2 + occasion + relationship + personalization bonus.
- Greedy box builder: always add packaging and a card, then take the best-scoring items that fit the budget,
  keeping interests varied (no two candles). Target spend is 70–100% of the budget's upper limit.
- Seeded randomness drives the "Try another match" button.
- Copy generator writes the headline, the subtitle and a "why this works" line from the answers.
- Unit tested (Vitest): stays within budget, respects interests, deterministic for a given seed, works for every combination.

## 4. Growth loops (the "prediction game")

- **Loop A: "Did I get it right?"** The giver sends the recipient a link. The recipient sees the gift reveal and
  rates it. The giver gets a match score, and the recipient is prompted to *make a match for someone they love*.
- **Loop B: "Challenge a friend."** "I just matched a gift for my partner. Can you do better?" opens the app with
  "Sent by {name}".
- Sharing uses the native share sheet (WhatsApp/Instagram on phones), with copy-link as the fallback.
- The share payload is encoded in the URL, so no account or database is needed for the loop to work.

## 5. Data & founder view

- `POST /api/event` (Vercel serverless) logs anonymous events: session_start, step answers, result, intent, share, recipient_rating.
- Storage: Upstash Redis via REST (`KV_REST_API_URL`/`KV_REST_API_TOKEN`, from the free Vercel Marketplace integration).
  Without it the app still works fully and events stay on the device.
- `GET /api/insights?key=FOUNDER_KEY` returns aggregates. Open `/#/founder` to view them.

## 6. Quality

- TypeScript strict, `npm run build` must pass.
- Vitest for the engine.
- Playwright end-to-end tests on a phone viewport: the full flow, back navigation, the recipient link, the founder view, plus screenshots of every page for visual review.

## 7. Ship & grow to 15 users (week plan)

| Day | Action |
|-----|--------|
| 0 | Deploy to Vercel, connect Upstash, set `FOUNDER_KEY`. Test on your own phone |
| 1 | Send to 5 close friends personally on WhatsApp: "I built a tiny gift-matcher, would you try it for someone you love?" |
| 2 | Instagram story: screen-record a match, plus a "Link in bio" sticker. Ask 3 friends to forward it |
| 3 | Read the founder view. Fix the step with the biggest drop-off |
| 4–5 | Post in 2 relevant groups (UAE expat / gifting / small-business communities). Use Loop A on every tester |
| 6 | Second story with real "match score" screenshots (social proof) |
| 7 | Review: sessions ≥ 15, Yes+Maybe ≥ 60%, recipient "Love it" rate. Decide the next build |

## 8. Motion design ("unwrapping a gift")

1. **Page transitions:** forward slides in from the right with fade and scale, back reverses it. Old and new pages overlap for a crossfade. Header and progress stay fixed. Welcome, matching and result get their own scene transitions.
2. **Choreography:** heading → subtitle → content stagger on every page.
3. **Micro-interactions:** press-scale, selection ring pulse, bouncing checkmarks, heart beat, haptic tick, button sheen. Single-choice pages pause 0.35s so the choice is seen before advancing.
4. **Signature moments:** lid lift on Start, orbiting icons while matching, items dropping into the box with a price count-up on the result, a scatter on "Another", and a lid-pop with sparkle burst on the recipient reveal.
5. **Accessibility:** `prefers-reduced-motion` reduces everything to fades. Outgoing pages are `aria-hidden` and `inert`.
