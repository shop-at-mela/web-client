# Cross-Shop & Entry/Exit Attribution Tracking

**Status**: MVP implemented — GTM/GA4/Clarity install, entry-source capture, `brand_clickout` event.
**PRD**: `mela-docs/product/prds/crossshop-tracking-prd.md` (problem statement, goals, ACs — this file is the technical/operational source of truth for the event schema and GA4 setup).
**Code**: `src/util/analytics/entrySource.js`, `src/util/analytics/brandClickout.js`, `src/util/includeScripts.js`, `src/index.js`, `server/csp.js`.

This document is the source of truth for the `dataLayer` event schema, the `entry_source` normalization rules, GA4 Console setup steps, and how to build the two hypothesis reports. If code and this doc ever disagree, the code wins and this doc needs updating.

---

## 1. Install

Three independent, env-var-gated integrations, all optional (no env var → no script loads):

| Var | Format | Purpose |
|---|---|---|
| `REACT_APP_GTM_ID` | `GTM-XXXXXXX` | Loads the GTM container. GA4 is configured **inside GTM** (a GA4 Configuration tag + Event tag), not loaded directly by this app. |
| `REACT_APP_GA4_ID` | `G-XXXXXXXXXX` | Not read by app code — it's the ID you paste into the GTM GA4 Configuration tag, and is here only so this doc's DebugView links are self-contained. |
| `REACT_APP_CLARITY_ID` | opaque project id | Loads Microsoft Clarity independently of GTM (session replay/heatmaps — no `dataLayer` interaction). |

All three are documented with comments in `.env-template`. **Do not** also set the pre-existing `REACT_APP_GOOGLE_ANALYTICS_ID` — see "Template Residuals" below for why that would double-fire GA4.

`window.dataLayer` is initialized in `src/util/includeScripts.js` before the GTM script tag is appended (`window.dataLayer.push({'gtm.start': ..., event: 'gtm.js'})`), matching the standard GTM snippet's behavior, and matching this codebase's existing pattern for the dormant `gtag.js` hook in the same file. Because `dataLayer` is a plain array, any `brand_clickout` push that happens before GTM finishes loading is not lost — GTM replays the array's existing contents once it initializes.

**Implementation note (CSP)**: this app enforces a nonce-based CSP with no `unsafe-inline` for scripts (`server/csp.js`). The GTM tag is loaded as an external `<script src="...">` (allowed because `*.googletagmanager.com` is already CSP-allowlisted). The Clarity snippet is normally distributed as an inline `<script>` block with a JS body — that would be blocked under this CSP. Instead, `includeScripts.js` runs the Clarity bootstrap as plain JS in the React component body (creating a `<script src="...">` DOM element programmatically), exactly matching the existing `gtag.js` pattern already in this file. This is why the code doesn't look like Clarity's copy-paste install snippet — it's the same snippet, restructured to satisfy this app's CSP.

**CSP**: `clarity.ms` / `*.clarity.ms` added to `connectSrc`, `scriptSrc`, `imgSrc` in `server/csp.js`'s customization block (not the shared defaults, per that file's own convention). GTM/GA4 domains (`googletagmanager.com`, `google-analytics.com`, `doubleclick.net`) were **already** allowlisted — no change needed there.

---

## 2. `entry_source` — capture and normalization

**Where**: `src/util/analytics/entrySource.js`. `captureEntrySource()` is called once from `src/index.js`, which only executes on a full (hard) page load — never on in-app SPA route changes. That makes "call it unconditionally" naturally equivalent to "only on the first page of the session": the function itself also guards on `sessionStorage['mela_entry_source']` already being set, so even a second full-page load in the same tab session (e.g. a manual refresh) won't overwrite it.

**Storage key**: `sessionStorage['mela_entry_source']` (tab-lifetime; cleared when the tab closes — this is intentional, matching the existing `mela_session_id` / `mela_redirect_trust_shown` pattern in `src/util/sentimentCapture.js`).

### Normalization rules (in priority order)

1. **`utm_source` is present, medium looks paid** (`utm_medium` is `paid_social` or `cpc`) **and `utm_campaign` is present** → `brand_ad:{brand_slug}`, where `{brand_slug}` is `utm_campaign` split on `_w` (matches the existing campaign-naming schema in `mela-docs/social/category-routing.yaml`: `{brand_slug}_w{week}`).
   - **Not yet a confirmed convention** — no paid campaigns exist today (`cold-start-checklist.md` explicitly defers paid: "don't pay for ads — organic is proving the model"). `paid_social`/`cpc` are this doc's proposal for when that changes; confirm with whoever runs the first paid test before treating this as final.
2. **`utm_source` is present, otherwise** → the lowercased raw value (e.g. `pinterest`, `instagram`, `reddit` — matches `category-routing.yaml` → `utm_source_values` exactly, since organic social always sets `utm_medium=social`, which isn't in the paid list above).
3. **No `utm_source`, `document.referrer` present** → classified by referrer hostname:
   - Pinterest / Instagram / Facebook / TikTok / Reddit hostnames → the platform name (covers an organic mention/share that wasn't UTM-tagged — see §5 note on Reddit).
   - Google / Bing / DuckDuckGo / Yahoo hostnames → `seo`.
   - Anything else → the bare referring hostname (e.g. `someblog.example.com`) rather than silently discarding the signal.
4. **Neither** → `direct`.

### Examples

| Landing URL / referrer | `entry_source` |
|---|---|
| `?utm_source=pinterest&utm_medium=social&utm_campaign=superbottoms_w2` | `pinterest` |
| `?utm_source=instagram&utm_medium=paid_social&utm_campaign=superbottoms_w2` | `brand_ad:superbottoms` |
| No UTM params, referrer `https://www.pinterest.com/...` | `pinterest` |
| No UTM params, referrer `https://www.google.com/search?...` | `seo` |
| No UTM params, no referrer (bookmarked / typed URL) | `direct` |

---

## 3. `brand_clickout` — event schema (source of truth)

```js
{
  event: 'brand_clickout',
  brand_name:   string | null,   // publicData.brand — free-text brand name as stored on the listing
  brand_id:     string | null,   // listing author (brand user account) UUID — see §5 "brand_id caveat"
  category:     string | null,   // publicData.categoryLevel3 || categoryLevel2 || categoryLevel1 (most specific available)
  product_id:   string,          // listing.id.uuid — the Sharetribe listing UUID; always present when the event fires
  entry_source: string,          // sessionStorage['mela_entry_source'] at the moment of click — see §2
  destination:  string,          // the outbound Shopify URL (publicData.productUrl)
}
```

Missing/unavailable fields are pushed as explicit `null`, never omitted — so GA4 reports can distinguish "field wasn't captured" from "field is genuinely absent" (e.g. a listing truly has no category set).

### Where it fires

There are **three** independent "Shop from Brand" CTA surfaces in the codebase (see PRD §5a for why), all now routed through the shared `openBrandStorefront(url, trackingParams)` helper in `src/util/analytics/brandClickout.js`:

| Surface | File |
|---|---|
| Main sticky CTA | `src/components/OrderPanel/OrderPanel.js` |
| Quantity/delivery form CTA | `src/components/OrderPanel/ProductOrderForm/ProductOrderForm.js` |
| Inquiry-only listing CTA | `src/components/OrderPanel/InquiryWithoutPaymentForm/InquiryWithoutPaymentForm.js` |

All three ultimately call `onShopNow`, which is `handleShopNow` defined in `ListingPageCoverPhoto.js` / `ListingPageCarousel.js`. `handleShopNow` either:
- shows `RedirectTrustSheet` (first click of the session) — in which case `brand_clickout` fires from the sheet's `onContinue`, i.e. only if the user actually continues to the brand, not on open/dismiss; or
- calls `openBrandStorefront` directly (subsequent clicks in the same session, sheet already shown).

This means the event fires exactly once per actual outbound redirect, regardless of which of the three CTA surfaces was clicked, and regardless of whether the trust sheet was shown.

### `brand_id` caveat

No stable `brand_id` field exists in the listing schema today — brand is a free-text name only (`publicData.brand`). This implementation uses the listing **author's Sharetribe user UUID** (`ensuredAuthor.id.uuid` / `listing.author.id.uuid`) as `brand_id`, because that UUID is already the canonical brand key used internally in `src/config/configBrands.js` (`getBrandConfiguration(brandId)` etc.). **This is a working proposal, not a confirmed schema field** — if it's rejected, cross-brand analysis falls back to `brand_name` string matching, which works but isn't collision-proof against near-duplicate brand names.

---

## 4. GA4 custom dimension setup (manual Console steps)

GA4 does **not** auto-create custom dimensions from arbitrary event params — an event can carry a param and still be unreportable until the dimension is registered. Do this once per GA4 property, after the first real `brand_clickout` event has been seen in DebugView (GA4 requires the param to have fired at least once before it appears in the picker):

1. **GA4 Admin → Custom definitions → Custom dimensions → New custom dimension.**
2. Create four, all **scope: Event**:
   | Dimension name | Event parameter |
   |---|---|
   | Brand Name | `brand_name` |
   | Category | `category` |
   | Entry Source | `entry_source` |
   | Product ID | `product_id` |
3. `brand_id` and `destination` are intentionally **not** registered as custom dimensions in this MVP — they're carried in the raw event for BigQuery/debugging use, but the two reports below only need the four above. Add `brand_id` later if/when it's confirmed as a real schema field (see §3 caveat).
4. In GTM, the GA4 Event tag for `brand_clickout` must map each `dataLayer` key to the matching GA4 event parameter (GTM does this via "Event Parameters" on the tag — set parameter name = GA4 param name = same string as the dataLayer key, e.g. `brand_name` → `brand_name`).
5. Custom dimensions take up to 24–48 hours to start populating in standard reports after registration — use **DebugView** or **Realtime** to verify immediately instead of waiting on standard reports.

---

## 5. Building the two hypothesis reports

Both are GA4 **Explore** reports (Explore → Blank), not standard reports, because both require session-scoped aggregation across multiple `brand_clickout` events.

### 5a. Multi-brand-clickout rate (cross-shop)

**Question**: what share of sessions click out to 2+ distinct brands?

1. Explore → Free form.
2. Dimensions: `Session ID` (or GA4's built-in session-scoped dimension), `Brand Name`.
3. Metric: Event count, filtered to `Event name = brand_clickout`.
4. Rows: Session ID. Add "Brand Name" as a nested row or use a **Count distinct** aggregation on Brand Name per session (Explore supports this via the "Count distinct" metric type against the Brand Name dimension, segmented by session).
5. Segment sessions into `sessions_with_1_brand` vs `sessions_with_2plus_brands` (Explore segment builder: "Brand Name count distinct ≥ 2" within session scope).
6. Multi-brand-clickout rate = `sessions_with_2plus_brands / all_sessions_with_at_least_1_brand_clickout`.

### 5b. Entry ≠ exit (mutualization signal)

**Question**: in sessions where entry_source names a brand or platform, does the session's brand_clickout activity include a *different* brand?

1. Same Explore report base as 5a, add `Entry Source` as a dimension (session-scoped — it's constant for the whole session by design, since it's captured once and never overwritten).
2. For sessions where `entry_source` matches the `brand_ad:{slug}` pattern: compare `{slug}` against the set of `brand_name` values clicked in that session. A session "confirms mutualization" if that set contains **any** brand other than `{slug}`.
3. For sessions where `entry_source` is a platform (`pinterest`, `instagram`, `seo`, `direct`, etc. — no specific brand implied): there's no single "entry brand" to compare against, so this segment answers a softer question instead — *do organic-platform sessions cross-shop at a different rate than brand-ad sessons?* (compare the 5a rate, segmented by `entry_source` category).
4. The strict entry≠exit metric (only meaningful for `brand_ad:*` entry sources) = `sessions where entry brand_slug ∉ clicked brand_name set` / `all sessions with entry_source starting with brand_ad:`.

This report only becomes meaningful once paid, brand-specific campaigns exist (see §2 rule 1's caveat) — until then, use it in the softer form from step 3.

---

## 6. Verification checklist

Confirm end-to-end before trusting any number from this system:

- [ ] **GTM Preview mode** (`GTM → Preview`, enter the site URL): confirm `gtm.js` container fires and `dataLayer` shows the `gtm.start` push on page load.
- [ ] **Entry source captured on first load**: open a fresh incognito window, land with `?utm_source=pinterest&utm_medium=social&utm_campaign=test_w1` on any page, open DevTools → Application → Session Storage, confirm `mela_entry_source = pinterest`. Reload the page (still first "session," different URL/no UTM) and confirm the value is **unchanged** (proves the "never overwrite" rule).
- [ ] **`brand_clickout` fires with all params**: on a listing page, open GTM Preview + GA4 DebugView side by side, click "Shop from Brand." Confirm in DebugView: the event named `brand_clickout` appears with non-null `brand_name`, `category`, `product_id`, `entry_source`, `destination` (and `brand_id` if the author-UUID proposal is accepted).
- [ ] **Event survives the outbound click** (the brief's original concern): because the actual redirect mechanism is `window.open(url, '_blank', 'noopener,noreferrer')` — a **new tab**, not a same-tab navigation — the original Mela tab is never unloaded, so there is no "killed mid-flight" risk to verify against in the first place. Confirm this is still true (check the Network/Application tab stays on the Mela origin) before relying on this simplification; if the redirect mechanism is ever changed to same-tab (`window.location.href = url`), this entire verification step must be redone and `transport_type: 'beacon'` (or a short delay) becomes load-bearing again, not optional.
- [ ] **All three CTA surfaces fire the event**: test on (a) a normal in-stock purchase-type listing (main CTA), (b) a listing where the quantity/delivery form renders, (c) an inquiry-only listing. Confirm `brand_clickout` fires from all three, and confirm `RedirectTrustSheet` now also appears on the first click for (b) and (c) (previously it didn't — see PRD §5d).
- [ ] **Clarity records a session**: open the Clarity project dashboard, confirm a new recording appears within a few minutes of a test visit.
- [ ] **CSP does not block anything**: with `REACT_APP_CSP=report`, check the browser console / CSP report endpoint for any `clarity.ms` or `googletagmanager.com` violations after install — there should be none, given the allowlist changes in `server/csp.js`.

---

## 7. Template Residuals

Found while researching this feature — **not modified**, flagging per the "don't silently overwrite" guardrail so a decision can be made:

| Residual | Location | Recommendation |
|---|---|---|
| `REACT_APP_GOOGLE_ANALYTICS_ID` (Sharetribe FTW template hook) | `.env-template`, `src/config/configAnalytics.js`, `src/util/includeScripts.js` (loads `gtag.js` directly), `src/analytics/handlers.js` (`GoogleAnalyticsHandler`, dispatches `page_view` on SPA route change via a Redux listener middleware in `src/analytics/analytics.js`) | **Do not set this alongside `REACT_APP_GTM_ID`.** Both paths can load GA4 independently — if both are set, GA4 would receive duplicate/conflicting page_view and session data from two separate loaders. Currently unset in the live `.env`, so there's no active conflict today, but it's a live footgun for the next person who sets an env var without knowing this doc exists. Recommend either deleting the direct-gtag.js path once GTM is confirmed working, or clearly commenting `.env-template` to say "use GTM instead" (partially done in this PR — see the updated `.env-template` comment above `REACT_APP_GTM_ID`). |
| `REACT_APP_PLAUSIBLE_DOMAINS` (Sharetribe FTW template hook) | `.env-template`, `configAnalytics.js`, `includeScripts.js` | Unset, unused, harmless alongside GTM (Plausible is a separate, additive analytics tool, not a GA4 competitor). No action needed unless Plausible is intentionally adopted later. |
| `pre_shopify_redirect` sentiment webhook event | `src/util/sentimentCapture.js`, `RedirectTrustSheet.js`, posts to an Airtable-via-Make webhook (`REACT_APP_SENTIMENT_WEBHOOK_URL`) | Not a template residual (custom-built for Mela), but overlaps in *purpose* with `brand_clickout` — both fire at the same redirect moment. Left untouched; they're complementary (qualitative thumbs up/down vs. structured clickstream), not redundant. No merge recommended for MVP. |
| Two CTA surfaces bypassing `RedirectTrustSheet` (`ProductOrderForm.js`, `InquiryWithoutPaymentForm.js`) | see PRD §5d | Fixed as a side effect of this work (both now route through `onShopNow`), not left in place — flagged here for visibility since it wasn't the primary ask. |

---

## 8. Future roadmap (explicitly deferred, not built now)

- **Server-side tagging** — would improve reliability against ad-blockers, but adds infra (server GTM container) not justified until baseline client-side data proves the hypotheses worth the investment.
- **Consent Mode / GDPR banner** — Mela's current audience is US-only; revisit if EU traffic becomes material.
- **Affiliate-app postback / Tier-2 conversion tracking** — actual purchase confirmation on the brand's Shopify store is not observable from Mela today (no postback integration exists). `brand_clickout` measures intent (the click), not confirmed revenue. Revisit once/if a specific affiliate platform is chosen.
- **A real `brand_id` schema field** — if the author-UUID proposal (§3) is rejected, this needs a proper Console-configured extended-data field instead.
- **Registering `brand_id` as a GA4 custom dimension** — deferred until the field itself is confirmed (see §4 step 3).
- **Consolidating `pre_shopify_redirect` and `brand_clickout` into one call** — currently two separate side effects fire at the same click (Airtable webhook + dataLayer push). Not consolidated now because they serve different consumers (qualitative research vs. GA4 reporting) and merging them would couple two independently-evolving systems for no immediate benefit.
