/**
 * Live INR to USD rate for server rendering, passed to the browser in the preloaded state so both
 * render the same price. See src/util/liveInrRate.js. There is no hard-coded fallback: if no rate
 * has ever been fetched this returns null, and pages show the INR price instead of a USD one.
 */
const log = require('./log');

const RATE_API_URL = 'https://api.frankfurter.dev/v1/latest?from=INR&to=USD';
const TTL_MS = 12 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 1500;

let cachedRate = null;
let fetchedAt = 0;
let inFlight = null;

const refresh = () => {
  if (!inFlight) {
    inFlight = fetch(RATE_API_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then(data => {
        const rate = data?.rates?.USD;
        if (typeof rate !== 'number' || rate <= 0) throw new Error('malformed rate response');
        cachedRate = rate;
        fetchedAt = Date.now();
      })
      .catch(e => log.error(e, 'inr-usd-rate-fetch-failed'))
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

/**
 * @returns {Promise<number|null>} The rate. Never rejects. A rate past its TTL is returned at once
 * and refreshed in the background, so a slow rate API only ever delays the first render.
 */
exports.getInrToUsdRate = async () => {
  if (cachedRate === null) await refresh();
  else if (Date.now() - fetchedAt > TTL_MS) refresh();
  return cachedRate;
};

// For tests
exports.resetForTest = () => {
  cachedRate = null;
  fetchedAt = 0;
  inFlight = null;
};
