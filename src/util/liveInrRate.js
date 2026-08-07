import { useEffect, useState } from 'react';

import { types as sdkTypes } from './sdkLoader';
import { formatCurrencyMajorUnit } from './currency';

const { Money } = sdkTypes;

const STORAGE_KEY = 'melaLiveInrUsdRate';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — stale-but-live still beats a rate frozen since last CSV ingestion
// api.frankfurter.app 301-redirects here now (confirmed via curl, 2026-08-06) — pointing directly
// at the canonical host avoids an extra round-trip and, more importantly, a CSP connect-src miss:
// a redirect to a different origin needs THAT origin allowlisted too (see server/csp.js).
const RATE_API_URL = 'https://api.frankfurter.dev/v1/latest?from=INR&to=USD';

// Same rate product-listing-integration's ingestion-time conversion uses
// (product-listing-integration/scripts/lib/utils/price-utils.js). Falls back to this whenever
// the live rate can't be fetched (offline, API down, SSR, or a test environment with no `fetch`).
export const FALLBACK_INR_USD_RATE = 1 / 83;

// NOTE (render-only, see mela-docs/product/TODO.md): Mela has no checkout yet, so a listing's
// actual `price.amount` is never charged to anyone today. This rate is used to recompute the
// *displayed* USD price from the source-of-truth `publicData.priceInINR` so it tracks a live
// rate instead of whatever was frozen in at the last CSV ingestion run. Once checkout exists,
// the real `price.amount` must become the thing that's kept in sync (server-side), and display
// must go back to using it verbatim — see the TODO for the full plan.

let memoryRate = null;
let inFlightFetch = null;

const isBrowser = typeof window !== 'undefined';

const readCachedRate = () => {
  if (!isBrowser || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { rate, fetchedAt } = JSON.parse(raw);
    if (typeof rate !== 'number' || Date.now() - fetchedAt > CACHE_TTL_MS) return null;
    return rate;
  } catch {
    return null;
  }
};

const writeCachedRate = rate => {
  if (!isBrowser || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() }));
  } catch {
    // Storage full/unavailable (e.g. private browsing) — the in-memory cache still covers this session
  }
};

/**
 * Best-effort live INR→USD rate, resolved once per session (memory) and reused across hard
 * reloads for CACHE_TTL_MS (localStorage). Concurrent callers share a single in-flight request.
 * Never rejects — falls back to FALLBACK_INR_USD_RATE on any failure.
 */
export const getLiveInrToUsdRate = async () => {
  if (memoryRate) return memoryRate;

  const cached = readCachedRate();
  if (cached) {
    memoryRate = cached;
    return cached;
  }

  if (typeof fetch === 'undefined') return FALLBACK_INR_USD_RATE;

  if (!inFlightFetch) {
    inFlightFetch = fetch(RATE_API_URL)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`rate fetch failed: ${res.status}`))))
      .then(data => {
        const rate = data?.rates?.USD;
        if (typeof rate !== 'number' || rate <= 0) throw new Error('malformed rate response');
        memoryRate = rate;
        writeCachedRate(rate);
        return rate;
      })
      .catch(() => FALLBACK_INR_USD_RATE)
      .finally(() => {
        inFlightFetch = null;
      });
  }

  return inFlightFetch;
};

// Synchronous best-guess for the first render, before the async fetch above resolves.
const getCachedOrFallbackRate = () => memoryRate || readCachedRate() || FALLBACK_INR_USD_RATE;

export const convertInrToUsdMoney = (inrAmount, rate) =>
  new Money(Math.round(inrAmount * rate * 100), 'USD');

/**
 * Live INR→USD rate for use in render. Returns the cached/fallback rate immediately, then
 * re-renders once (if ever) with a freshly-fetched rate.
 */
export const useLiveInrToUsdRate = () => {
  const [rate, setRate] = useState(getCachedOrFallbackRate);

  useEffect(() => {
    let cancelled = false;
    getLiveInrToUsdRate().then(liveRate => {
      if (!cancelled) setRate(liveRate);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return rate;
};

/**
 * Shared display-price logic for ListingCard / ListingCardMini / OrderPanel: when a listing
 * carries `publicData.priceInINR` (i.e. it was sourced from an INR price at ingestion), the
 * displayed USD price is recomputed from that INR figure using a live rate instead of the
 * static `price` Sharetribe holds. Listings without `priceInINR` (sourced already in USD) are
 * unaffected — `price` is returned unchanged.
 *
 * @param {Money} price - the listing's stored price (Sharetribe `price.amount`)
 * @param {Object} publicData - listing's publicData (for `priceInINR`)
 * @param {Object} intl - React Intl instance, for formatting the INR line
 * @returns {{ displayPrice: Money, formattedINRPrice: string|null }}
 */
export const useDisplayPrice = (price, publicData, intl) => {
  const rate = useLiveInrToUsdRate();
  const inrPrice = publicData?.priceInINR;

  const formattedINRPrice = inrPrice ? formatCurrencyMajorUnit(intl, 'INR', inrPrice) : null;
  const displayPrice = inrPrice ? convertInrToUsdMoney(inrPrice, rate) : price;

  return { displayPrice, formattedINRPrice };
};
