> توثيق تاريخي قبل التدقيق. الحالة الفعلية والقيود الحالية في `../AUDIT.md`؛ لا تُعد ادعاءات الجاهزية هنا إثباتًا للتنفيذ.

# Fixes in this revision

Verified with `npm test` (17 checks) and strict `tsc` on `src/lib/*`. The React UI could not be run or fully type-checked in the review environment (no network, so dependencies could not be installed); the UI edits were syntax-checked and should be smoke-tested after `npm install`.

## Pricing correctness

| # | Problem | Fix | Files |
|---|---|---|---|
| 1 | AI-drafted per-person lines passed head-count as `quantity`; the engine also multiplies by head-count, so 2 adults were charged 4× (3 adults 9×). | Draft passes `quantity = 1` for per-person lines. Documented that quantity = units. | `gemini.ts` |
| 2 | Hotels were priced once (day 1 only) regardless of trip length. | One hotel night per day except departure day. | `gemini.ts` |
| 3 | Missing rate in the requested city silently used another city's rate (e.g. a Cairo hotel for Luxor). | Same-city match only (Giza ≙ Cairo). Otherwise a visible `Rate missing` line that blocks sending. | `gemini.ts` |
| 4 | Line status was hardcoded `OK`, so expired/missing rates never blocked dispatch. | Status comes from the engine; both `Rate missing` and `Expired rate` block (`hasBlockingRate`). | `pricingEngine.ts`, `gemini.ts`, `QuoteBuilderView.tsx` |
| 5 | Validity was compared with today's date, not the travel date. | Compared with the date of service for each day. | `pricingEngine.ts` |
| 6 | Default markup was set equal to the minimum *margin* (18% markup = 15.3% margin), so every new quote tripped the below-minimum-margin warning. | `markupForTargetMargin()`; default markup derived from the margin target. | `pricingEngine.ts`, `QuoteBuilderView.tsx` |
| 7 | Changing group size, currency, date or rates did not re-price existing lines. | `repriceLine()` runs on those changes; lines keep their own markup; overrides untouched. | `pricingEngine.ts`, `QuoteBuilderView.tsx` |
| 8 | Duplicate line ids (`line-N-3` used by two lines). | Sequential unique ids. | `gemini.ts` |

## Guardrails

| # | Problem | Fix |
|---|---|---|
| 9 | "Requires Admin/Owner sign-off" was displayed but never enforced; `requiresAdminApproval` was never set. | Send buttons disabled unless Owner/Admin when below minimum margin; quote records `requiresAdminApproval` / `adminApproved`. (Client-side only; see TECHNICAL.md §5.) |

## AI honesty

| # | Problem | Fix |
|---|---|---|
| 10 | Offline fallback parser invented a traveler name ("Elena & Mikhail Voronov"), dates (2026-11-20/26), nationality and a budget, presenting them as extracted. | Leaves those empty; explicit ISO dates only; lowers confidence on defaulted fields; adds clarifying questions. |

## Analytics integrity

| # | Problem | Fix |
|---|---|---|
| 11 | Every operator preview of a proposal recorded a "client view" (fake 45 s, fake sections) and created an urgent follow-up task. | `ProposalViewer` has `trackView` (default `false`). The future public route sets it. |

## Housekeeping
- `package.json`: name `Daleel-egypt`, `npm test` script.
- Added `src/lib/pricingEngine.test.ts`, `docs/TECHNICAL.md`, `docs/BACKEND_MIGRATION_PLAN.md`.

## Not changed (needs a decision)
- FX buffer applied on both conversion legs (~6% round-trip at 3%).
- Quote saved as `Sent` when the operator clicks "Review Branded Proposal Link".
- Seasons, star rating and nationality tier are not used in rate selection.
- Unused `/api/ai/translate-proposal`; simulated Excel/PDF/WhatsApp flows.
