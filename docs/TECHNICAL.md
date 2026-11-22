> توثيق تاريخي قبل التدقيق. الحالة الفعلية والقيود الحالية في `../AUDIT.md`؛ لا تُعد ادعاءات الجاهزية هنا إثباتًا للتنفيذ.

# Daleel Egypt — Technical Reference

Status: **front-end prototype with a thin AI proxy.** All business data lives in the browser's `localStorage`.
This document describes what the code does today, which parts are real and which are simulated, and the rules the pricing engine follows.

## 1. Stack and layout

| Layer | Tech |
|---|---|
| UI | React 19, Vite, Tailwind 4, `motion`, `lucide-react`, `recharts` |
| Server | Express (`server.ts`) serving Vite in dev / `dist/` in prod |
| AI | `@google/genai` called **server-side only** (`GEMINI_API_KEY`) |
| Data | `localStorage` behind a `repository` object (`src/lib/storage.ts`) |
| Tests | `npm test` → `tsx src/lib/pricingEngine.test.ts` (node:assert, no extra deps) |

```
server.ts                      Express + 2 Gemini proxy routes
src/App.tsx                    journey state (auth → onboarding → app), tab routing, data reload
src/types/index.ts             all domain types
src/lib/pricingEngine.ts       deterministic pricing (the part that must be right)
src/lib/gemini.ts              inquiry parsing (AI + regex fallback), itinerary drafting, sanitizer
src/lib/storage.ts             repository + seed/demo helpers
src/lib/constants.ts           cities, languages, default FX, color tokens
src/lib/i18n.ts                EN/AR UI strings
src/components/*View.tsx       Dashboard, Inbox, RateLibrary, QuoteBuilder, Pipeline, FollowUps, Analytics, Subscription, TeamSettings
src/components/ProposalViewer  client-facing branded proposal (3 themes, 7 languages, RTL)
src/components/ingestion/*     Excel mapper + PDF review (SIMULATED, see §6)
```

Run: `npm install && npm run dev` (port 3000). Tests: `npm test`.

## 2. Request flow

1. **Inbox** – an inquiry (text, source channel) arrives. `sanitizeInquiryText` masks passport-like and card-like numbers.
2. **Parse** – `parseInquiryWithAi` POSTs to `/api/ai/parse-inquiry`; Gemini returns JSON constrained by a response schema. If the server/key is unavailable, a regex fallback runs.
3. **Agent review** – the agent confirms/edits the extracted fields (`isConfirmedByAgent`).
4. **Draft** – `draftItineraryFromRates` builds days/lines from the rate library only.
5. **Price** – `calculateLineCostAndPrice` per line; `recalculateQuoteTotals` for the quote.
6. **Guardrails** – dispatch is blocked by missing/expired rates, and by below-minimum-margin unless Owner/Admin.
7. **Proposal** – `ProposalViewer` renders the branded output.

## 3. Pricing rules (authoritative)

These are enforced by `src/lib/pricingEngine.ts` and covered by tests.

- **Quantity means units, never head-count.** For `per_person`/`single`/`double`/`triple` the engine multiplies by the group itself (adults, plus children per the child policy). `quantity` is the number of nights / days / visits. For `per_vehicle` and `per_group`, `quantity` is the number of vehicles / groups. Passing head-count as `quantity` double-counts.
- **Child policy:** age ≤ `childFreeMaxAge` is free; otherwise `childDiscountPercent` applies; otherwise full price. Infants are free.
- **Single supplement** is added only for `single` occupancy.
- **Validity is checked against the date of service**, not today. A rate outside `[validityStart, validityEnd]` on that date gets status `Expired rate`.
- **Statuses:** `OK`, `Rate missing`, `Expired rate`, `Overridden`. `Rate missing` and `Expired rate` are *blocking*: `recalculateQuoteTotals().hasBlockingRate` is true and dispatch is disabled.
- **Markup ≠ margin.** `price = cost × (1 + markup)`; `margin = (price − cost) / price`. 25% markup = 20% margin. Use `markupForTargetMargin(m)` to convert a target margin to a markup. The builder's default markup is derived from the workspace's minimum *margin*.
- **Re-pricing:** `repriceLine` re-computes a line when the group, currency, travel date or rate library changes. Lines keep their own markup; `Overridden` lines are untouched.
- **FX:** costs convert *to* EGP at `rate × (1 + buffer)` and prices convert *from* EGP at `rate × (1 − buffer)`. The buffer is therefore applied on both legs. A USD cost quoted in USD at 0% markup comes out about 6% higher with a 3% buffer (1.03 / 0.97). This is a deliberate-looking but undocumented choice; decide whether it is intended (see §7).

### Itinerary drafting rules

- A service only matches a rate in the **same city** (Giza is treated as part of the Cairo market) and prefers one valid on that day.
- No matching rate → the line is still created with status `Rate missing`, price 0, and a name like "Hotel night – rate needed (Luxor)". The agent sees the gap and the quote cannot be sent. The drafter never borrows another city's price.
- Hotels: one night per day except the departure day.
- Line ids are unique per quote.

## 4. AI layer

- `/api/ai/parse-inquiry` – schema-constrained JSON, untrusted-input framing in the prompt, then `confidenceScores` attached by the server (currently simple heuristics, not model-reported confidence).
- `/api/ai/translate-proposal` – exists on the server but **is not called by any client code**. Proposal "translation" in the UI is currently UI/label level only.
- Fallback parser never fabricates: it leaves name, dates, nationality and budget empty, lowers confidence for defaulted fields (dates 0, cities/stars 0.3 when guessed), and adds clarifying questions.
- Verify the model ID in `server.ts` (`gemini-3.8-flash`) against what your account serves.

## 5. Security and tenancy — what is actually enforced

| Claim | Reality today |
|---|---|
| Tenant isolation | `workspaceId` is a field on records and filtered in the repository; one workspace per browser. Not a security boundary. |
| Role-based access | Roles exist and a role switcher is in the UI. The only role-dependent behavior: hide net cost for *Sales Agent* when the toggle is on, and the approval guard in the quote builder. Anyone can switch role in the UI. |
| Sign-in | `handleSignIn` does not authenticate. |
| Net-cost hiding | UI only. The data is still in `localStorage`. |
| Approval guard | Client-side. Real enforcement needs the server (see migration plan). |
| API key | Server-side only. Good. `/api/ai/*` has no auth or rate limit. |
| Prompt-injection | Mitigated by framing + schema; no output validation beyond JSON parse. |

## 6. Simulated / not yet implemented

- **Public proposal link:** `publicToken` is generated but nothing resolves it; there is no public route. Proposals are previewed in-app by the operator. `ProposalViewer` now takes `trackView` (default `false`) so operator previews no longer create fake "client views" and follow-ups; the future public route must pass `trackView`.
- **View telemetry** (`timeSpentSeconds`, `sectionsViewed`) is hardcoded in the viewer.
- **Excel/PDF rate ingestion:** buttons simulate an upload and insert demo rates.
- **WhatsApp:** `simulateWhatsAppInquiry` fabricates an inquiry; there is no webhook.
- **Workspace FX table** (`repository.getExchangeRates`) is editable in storage, but pricing uses `DEFAULT_EXCHANGE_RATES` from `constants.ts`.
- **Seasons** are modeled but not used by pricing (rate selection ignores `seasonIds`).
- **Nationality tier** (`foreign` / `egyptian_arab` / `student`) is modeled but not used when choosing a rate.
- **Departure day** has no transfer line in the drafted itinerary.

## 7. Open decisions

1. Is the double-sided FX buffer intended? (Section 3.)
2. Should quote status be `Draft` until the operator explicitly sends? Today "Review Branded Proposal Link" saves the quote as `Sent`.
3. Rate selection by season, star rating and nationality tier (needed before real quoting).
4. Line-level overrides: UI for `Overridden` status with audit-log entry and reason.

## 8. Testing

`npm test` runs 17 checks: per-person math, child policy, validity by travel date, missing/expired blocking, margin vs markup, re-pricing, draft rules (no double-count, per-night hotel, no cross-city rates, unique ids, per-day expiry), parser never fabricates, sanitizer.
Not covered: React components, server routes, storage. Add component tests and an API test once dependencies are installed.
