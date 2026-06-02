/**
 * certificationHelpers.js
 *
 * Shared certification utilities used across listing components.
 * Centralises CERT_LABELS and the isMelaVerified business rule
 * so neither is duplicated across ListingTrustChips, TrustBadges, etc.
 */

export const CERT_LABELS = {
  gots_certified: 'GOTS Certified',
  non_toxic_dyes: 'Non-toxic',
  bpa_free: 'BPA Free',
  ce_certified: 'CE Certified',
  bis_approved: 'BIS Approved',
  oeko_tex: 'OEKO-TEX',
};

/**
 * Returns true when the listing is considered "Mela Verified":
 *   - publicData.certification array is non-empty
 *   - (future: brand join date ≥ 30 days — placeholder for when that data is available)
 *
 * @param {Object} publicData — listing publicData from Sharetribe
 * @returns {boolean}
 */
export const isMelaVerified = (publicData = {}) => {
  return Array.isArray(publicData.certification) && publicData.certification.length > 0;
};
