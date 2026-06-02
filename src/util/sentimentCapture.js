/**
 * sentimentCapture.js
 *
 * Shared utilities for Mela sentiment collection.
 * Handles session deduplication, anonymous session IDs, and async webhook POST.
 * All functions are safe to call even when the webhook URL is not configured.
 */

const SESSION_SHOWN_KEY = 'mela_sentiment_shown';
const REDIRECT_TRUST_KEY = 'mela_redirect_trust_shown';
const SESSION_ID_KEY = 'mela_session_id';

/**
 * Returns true if the sentiment sheet should be shown this session.
 * Once the user has seen it (any response or dismiss), we suppress for the session.
 */
export const shouldShowSentiment = () => {
  try {
    return !sessionStorage.getItem(SESSION_SHOWN_KEY);
  } catch {
    return false;
  }
};

/**
 * Returns true if the redirect trust sheet should be shown this session.
 * Shown once per session on the first CTA click; subsequent clicks redirect directly.
 */
export const shouldShowRedirectTrust = () => {
  try {
    return !sessionStorage.getItem(REDIRECT_TRUST_KEY);
  } catch {
    return false;
  }
};

/**
 * Mark that the redirect trust sheet has been shown this session.
 * Call immediately when the sheet opens (not on confirm) so dismiss also suppresses.
 */
export const markRedirectTrustShown = () => {
  try {
    sessionStorage.setItem(REDIRECT_TRUST_KEY, '1');
  } catch {}
};

/**
 * Mark that the sentiment sheet has been shown this session.
 * Call on first reveal (not on response) so dismiss also suppresses future shows.
 */
export const markSentimentShown = () => {
  try {
    sessionStorage.setItem(SESSION_SHOWN_KEY, '1');
  } catch {
    // sessionStorage unavailable (e.g. private mode with storage blocked) — ignore
  }
};

/**
 * Returns a persistent anonymous session ID for this browser session.
 */
const getOrCreateSessionId = () => {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
};

/**
 * POST a sentiment event to the configured Google Apps Script webhook.
 * Fire-and-forget — never blocks the UI.
 *
 * @param {object} payload
 * @param {'up'|'down'} payload.response         - Thumbs response
 * @param {'general_sentiment'|'pre_shopify_redirect'} payload.event
 * @param {string} [payload.freeText]             - Optional follow-up text
 * @param {string} [payload.brand]                - Brand name (item page only)
 * @param {string} [payload.listingId]            - Listing UUID (item page only)
 * @param {string} [payload.productUrl]           - Shopify URL (item page only)
 */
export const postSentiment = async (payload) => {
  const webhookUrl = process.env.REACT_APP_SENTIMENT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    // Apps Script doesn't handle CORS preflight requests.
    // Sending as text/plain with mode: no-cors avoids the preflight entirely.
    // We don't need to read the response (fire-and-forget), so no-cors is fine.
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        ...payload,
        page: typeof window !== 'undefined' ? window.location.pathname : null,
        timestamp: new Date().toISOString(),
        sessionId: getOrCreateSessionId(),
      }),
    });
  } catch {
    // Never surface fetch errors to the user
  }
};
