import { useEffect, useState } from 'react';

import { types as sdkTypes } from './sdkLoader';
import { formatCurrencyMajorUnit } from './currency';

const { Money } = sdkTypes;

const STORAGE_KEY = 'melaLiveInrUsdRate';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — a real recent rate
// api.frankfurter.app 301-redirects here now (confirmed via curl, 2026-08-06) — pointing directly
// at the canonical host avoids an extra round-trip and, more importantly, a CSP connect-src miss:
// a redirect to a different origin needs THAT origin allowlisted too (see server/csp.js).
const RATE_API_URL = 'https://api.frankfurter.dev/v1/latest?from=INR&to=USD';

// There is deliberately no hard-coded fallback rate. A frozen rate shows shoppers a wrong price,
// so when no live rate is available the USD price is left out and the source INR price is shown.
//
// The server fetches the rate (server/fxRate.js) and passes it in the preloaded state, so server
// render and the browser's first render use one rate. Without that, they disagree and React
// throws hydration errors.

let memoryRate = null;
let inFlightFetch = null;

const isValidRate = rate => typeof rate === 'number' && rate > 0;

/**
 * Seeds the rate for this process (server) or page load (browser) before the first render.
 * Called from renderApp and the browser entry with the rate in the preloaded state.
 */
export const setInitialInrToUsdRate = rate => {
  if (isValidRate(rate)) memoryRate = rate;
};

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
 * Never rejects — resolves to null when no live rate is available.
 */
export const getLiveInrToUsdRate = async () => {
  if (memoryRate) return memoryRate;

  const cached = readCachedRate();
  if (cached) {
    memoryRate = cached;
    return cached;
  }

  if (typeof fetch === 'undefined') return null;

  if (!inFlightFetch) {
    inFlightFetch = fetch(RATE_API_URL)
      .then(res =>
        res.ok ? res.json() : Promise.reject(new Error(`rate fetch failed: ${res.status}`))
      )
      .then(data => {
        const rate = data?.rates?.USD;
        if (!isValidRate(rate)) throw new Error('malformed rate response');
        memoryRate = rate;
        writeCachedRate(rate);
        return rate;
      })
      .catch(() => null)
      .finally(() => {
        inFlightFetch = null;
      });
  }

  return inFlightFetch;
};

export const convertInrToUsdMoney = (inrAmount, rate) =>
  new Money(Math.round(inrAmount * rate * 100), 'USD');

/**
 * The one USD price for a listing, for any place that shows or publishes a price.
 * INR-sourced listings (`publicData.priceInINR`) always convert at the live rate and never use
 * the stored `price`. With no live rate the result is null, so callers show the INR price.
 * Listings sourced in USD return `price` unchanged.
 *
 * @param {Money} price - the listing's stored price
 * @param {Object} publicData - listing's publicData (for `priceInINR`)
 * @param {number|null} rate - from useLiveInrToUsdRate
 * @returns {Money|null}
 */
export const getDisplayMoney = (price, publicData, rate) => {
  const inrPrice = publicData?.priceInINR;
  if (!inrPrice) return price;
  return isValidRate(rate) ? convertInrToUsdMoney(inrPrice, rate) : null;
};

/**
 * Live INR→USD rate for use in render, or null until one is known. The first render uses only
 * the seeded rate, not localStorage, so that it matches the server's render.
 */
export const useLiveInrToUsdRate = () => {
  const [rate, setRate] = useState(memoryRate);

  useEffect(() => {
    let cancelled = false;
    getLiveInrToUsdRate().then(liveRate => {
      if (!cancelled && liveRate) setRate(liveRate);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return rate;
};

/**
 * Shared display-price logic for ListingCard / ListingCardMini / OrderPanel.
 *
 * @param {Money} price - the listing's stored price
 * @param {Object} publicData - listing's publicData (for `priceInINR`)
 * @param {Object} intl - React Intl instance, for formatting the INR line
 * @returns {{ displayPrice: Money|null, formattedINRPrice: string|null }}
 */
export const useDisplayPrice = (price, publicData, intl) => {
  const rate = useLiveInrToUsdRate();
  const inrPrice = publicData?.priceInINR;

  const formattedINRPrice = inrPrice ? formatCurrencyMajorUnit(intl, 'INR', inrPrice) : null;
  const displayPrice = getDisplayMoney(price, publicData, rate);

  return { displayPrice, formattedINRPrice };
};
