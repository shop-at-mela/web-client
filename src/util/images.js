/**
 * Vendor/brand-uploaded image URLs (e.g. `publicData.brandHeroImages`) point
 * at external CDNs (Shopify) that bypass Sharetribe's imgix asset pipeline
 * entirely, so they can't be sized via ResponsiveImage's variant system.
 * Shopify's CDN honors a `?width=` query param for server-side resizing —
 * apply it rather than serving the raw upload, which can be several
 * thousand pixels wide for what's usually a few-hundred-pixel display slot
 * (Lighthouse "Improve image delivery" finding).
 *
 * @param {string} url
 * @param {number} width - target width in px; pick something comfortably
 *   covering the largest real render size (e.g. 2x the widest CSS slot).
 * @returns {string} the URL with `width` set, or the original URL unchanged
 *   if it isn't a parseable absolute URL (serve as-is rather than break the
 *   image) or the host doesn't support the param (a no-op query string).
 */
export const withExternalImageWidth = (url, width) => {
  if (!url) {
    return url;
  }
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('width', String(width));
    return parsed.toString();
  } catch {
    return url;
  }
};
