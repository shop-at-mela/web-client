/**
 * Where a brand is from, read from its profile publicData. Every brand onboarded so far is
 * Indian and most have no brandCountry set, so India is the fallback. Brands from elsewhere in
 * South Asia set brandCountry (and optionally brandCity) and are shown with their own country.
 */
export const DEFAULT_BRAND_COUNTRY = 'India';

export const getBrandCountry = publicData => publicData?.brandCountry || DEFAULT_BRAND_COUNTRY;

/**
 * "{city}, {country}" for display. Returns null when nothing is known and fallbackToCountry is
 * false, otherwise falls back to the bare country.
 */
export const getBrandOriginLine = (publicData, { fallbackToCountry = false } = {}) => {
  const country = getBrandCountry(publicData);
  const { brandCity, brandOrigin } = publicData || {};
  if (brandCity) {
    return `${brandCity}, ${country}`;
  }
  if (brandOrigin) {
    return new RegExp(country, 'i').test(brandOrigin) ? brandOrigin : `${brandOrigin}, ${country}`;
  }
  if (publicData?.brandCountry) {
    return publicData.brandCountry;
  }
  return fallbackToCountry ? country : null;
};
