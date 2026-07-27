/**
 * vettingStrip.js
 *
 * Fires the `vetting_strip_view` / `vetting_strip_click` dataLayer events for the
 * homepage vetting strip (storefront-validation-readiness-prd.md P0.1). Follows the
 * same direct dataLayer.push pattern as brandClickout.js — no shared event bus exists
 * yet for this class of impression/click event.
 */

export const pushVettingStripView = () => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'vetting_strip_view' });
};

export const pushVettingStripClick = () => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'vetting_strip_click' });
};
