import React, { useState } from 'react';
import { bool, object, objectOf, shape, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
// Direct imports (not via the components barrel) — this component is itself
// barrel-exported, and importing the barrel from here deepens the circular
// chain that resolves sdkLoader/sdkTypes (see HeroSection.js header comment).
import NamedLink from '../NamedLink/NamedLink';
import ResponsiveImage from '../ResponsiveImage/ResponsiveImage';
import { getBrandSlugById } from '../../config/configBrands';
import { withExternalImageWidth } from '../../util/images';

import css from './BrandHeroCard.module.css';

// Variant names requested for hero images (see BrandsPage.duck.js's
// heroImageVariants query params). Passed to ResponsiveImage so the browser
// picks the right size instead of always downloading the 1200x1200 2x
// variant for a ~340px slot (the imgix "Improve image delivery" finding).
// square-small2x is a defensive fallback for images fetched before the hero
// variants existed on their entity.
const HERO_IMAGE_VARIANTS = ['square-hero', 'square-hero2x', 'square-small2x'];
const HERO_IMAGE_SIZES = '(max-width: 768px) 88vw, 340px';

// Vendor/Shopify-sourced hero images bypass Sharetribe's imgix pipeline
// entirely and are uploaded at arbitrary native dimensions (Lighthouse
// flagged several at 2000px+ for this ~340px slot). 2x width of the largest
// real render size (340px desktop slide) covers retina without re-fetching
// per breakpoint. See util/images.js for the resize helper — BrandSpotlight
// and CraftStories apply the same helper to the same publicData field.
const SHOPIFY_IMAGE_TARGET_WIDTH = 700;

/**
 * Pick the hero index once per mount: a random index across the parallel hero
 * arrays (`brandHeroImageIds` / `brandHeroImages`), restricted to indexes that
 * have at least one source. Returns -1 when no index has any source — the
 * skip-if-empty contract (brand-hero-card-webclient-prd.md §4).
 *
 * Exported for unit tests.
 */
export const pickHeroIndex = (imageIds, imageUrls, random = Math.random) => {
  const idsLen = Array.isArray(imageIds) ? imageIds.length : 0;
  const urlsLen = Array.isArray(imageUrls) ? imageUrls.length : 0;
  const candidates = [];
  for (let i = 0; i < Math.max(idsLen, urlsLen); i++) {
    if ((idsLen > i && imageIds[i]) || (urlsLen > i && imageUrls[i])) {
      candidates.push(i);
    }
  }
  return candidates.length === 0
    ? -1
    : candidates[Math.floor(random() * candidates.length)];
};

/**
 * BrandHeroCard - Image-forward brand card for the homepage hero carousel.
 *
 * Renders a single 1:1 hero product image with a bottom gradient scrim and
 * white overlay text: place-dateline eyebrow ("{city}, India"), Fraunces serif
 * brand name, and tagline. A white logo chip sits top-left.
 *
 * Reader contract (brand-hero-card-webclient-prd.md §3/§4):
 * - Picks ONE random index across the parallel `publicData` hero arrays per
 *   mount (stable within a session; a fresh pick on next page load is the
 *   intended variety).
 * - Sharetribe-first: `brandHeroImageIds[i]` resolved to a raw image entity
 *   via `heroImagesById` (built by the consumer from marketplace entities)
 *   and rendered responsively (ResponsiveImage, srcSet over HERO_IMAGE_VARIANTS);
 *   falls back to `brandHeroImages[i]` (Shopify CDN URL, width-constrained)
 *   when the id is absent or fails to resolve — including at runtime via
 *   <img>/ResponsiveImage onError.
 * - Renders null only when the brand has no hero source at all. No
 *   logo/profileImage fallback: a hero surface shows only brands with a real
 *   hero image.
 *
 * @param {Object} props
 * @param {Object} props.brand - Brand user entity
 * @param {Object} props.heroImagesById - Map of Sharetribe image UUID → raw image entity
 * @param {boolean} props.isPriority - Eager-load the image (first/LCP slide)
 * @param {string} props.className - Additional CSS class
 * @param {string} props.rootClassName - Root CSS class override
 */
const BrandHeroCard = props => {
  const {
    brand,
    heroImagesById = {},
    isPriority = false,
    className = null,
    rootClassName = null,
  } = props;

  const { displayName, bio, publicData } = brand?.attributes?.profile || {};
  const {
    brandHeroImageIds,
    brandHeroImages,
  } = publicData || {};

  // Random pick once per mount; lazy initializer keeps it stable across re-renders.
  const [heroIndex] = useState(() => pickHeroIndex(brandHeroImageIds, brandHeroImages));
  // Runtime fallback chain: srcs that have 404'd/errored are skipped on re-render.
  const [failedSrcs, setFailedSrcs] = useState([]);

  if (!brand || !brand.id || heroIndex === -1) {
    return null;
  }

  const sharetribeImage = Array.isArray(brandHeroImageIds)
    ? heroImagesById[brandHeroImageIds[heroIndex]] || null
    : null;
  const sharetribeVariants = sharetribeImage?.attributes?.variants || null;
  // Representative URL for this source, used only to track runtime failures
  // (ResponsiveImage itself picks the actual srcSet entry the browser loads).
  const sharetribeFallbackUrl = sharetribeVariants
    ? sharetribeVariants['square-hero2x']?.url ||
      sharetribeVariants['square-hero']?.url ||
      sharetribeVariants['square-small2x']?.url ||
      null
    : null;
  const shopifyUrl = Array.isArray(brandHeroImages) ? brandHeroImages[heroIndex] || null : null;
  const shopifyResizedUrl = shopifyUrl
    ? withExternalImageWidth(shopifyUrl, SHOPIFY_IMAGE_TARGET_WIDTH)
    : null;

  // Sharetribe-first, Shopify-fallback; a failed load advances the chain.
  const useSharetribeImage = !!sharetribeVariants && !failedSrcs.includes(sharetribeFallbackUrl);
  const useShopifyImage = !useSharetribeImage && !!shopifyUrl && !failedSrcs.includes(shopifyUrl);
  const src = useSharetribeImage ? sharetribeFallbackUrl : useShopifyImage ? shopifyUrl : null;

  const handleImageError = () => {
    if (src) {
      setFailedSrcs(prev => [...prev, src]);
    }
  };

  const classes = classNames(rootClassName || css.root, className);

  // Same tagline derivation as BrandCardHome: publicData override, else first
  // sentence of bio.
  const firstSentence = bio ? bio.split('.')[0].trim() : '';
  const tagline = publicData?.brandTagline || firstSentence || null;

  // Place dateline ("{city}, India") — an honest origin cue, not a craft
  // claim: part of the catalog is manufactured CPG where "Handcrafted" would
  // be inaccurate (UXR pass 2026-07-24). Always resolves to India.
  const brandOrigin =
    publicData?.brandOrigin ||
    (publicData?.brandCity && publicData?.brandCountry
      ? `${publicData.brandCity}, ${publicData.brandCountry}`
      : publicData?.brandCountry || null);
  const dateline = publicData?.brandCity
    ? `${publicData.brandCity}, India`
    : brandOrigin
    ? /india/i.test(brandOrigin)
      ? brandOrigin
      : `${brandOrigin}, India`
    : null;

  const logoSrc =
    publicData?.brandLogoUrl ||
    brand.profileImage?.attributes?.variants?.['square-small']?.url ||
    null;
  const logoInitial = displayName?.charAt(0) || 'B';

  const brandSlug = getBrandSlugById(brand.id.uuid);
  const brandLinkProps = brandSlug
    ? { name: 'BrandPage', params: { brandSlug } }
    : { name: 'ProfilePage', params: { id: brand.id.uuid } };

  return (
    <NamedLink {...brandLinkProps} className={classes}>
      {useSharetribeImage ? (
        <ResponsiveImage
          className={css.heroImage}
          image={sharetribeImage}
          variants={HERO_IMAGE_VARIANTS}
          sizes={HERO_IMAGE_SIZES}
          alt=""
          aria-hidden="true"
          loading={isPriority ? 'eager' : 'lazy'}
          fetchpriority={isPriority ? 'high' : undefined}
          onError={handleImageError}
        />
      ) : useShopifyImage ? (
        <img
          className={css.heroImage}
          src={shopifyResizedUrl}
          alt=""
          aria-hidden="true"
          loading={isPriority ? 'eager' : 'lazy'}
          fetchpriority={isPriority ? 'high' : undefined}
          onError={handleImageError}
        />
      ) : (
        // Both sources failed at runtime — navy field keeps the overlay legible.
        <div className={css.heroImageFallback} aria-hidden="true" />
      )}
      <div className={css.scrim} aria-hidden="true" />

      <div className={css.logoChip} aria-hidden="true">
        {logoSrc ? (
          <img src={logoSrc} alt="" className={css.logoImage} loading="lazy" />
        ) : (
          <span className={css.logoInitial}>{logoInitial}</span>
        )}
      </div>

      <div className={css.overlay}>
        <span className={css.eyebrow}>
          {dateline || (
            <FormattedMessage id="BrandHeroCard.madeInIndia" defaultMessage="Made in India" />
          )}
        </span>
        <h3 className={css.brandName}>{displayName}</h3>
        {tagline ? <p className={css.tagline}>{tagline}</p> : null}
      </div>
    </NamedLink>
  );
};

BrandHeroCard.propTypes = {
  brand: shape({
    id: shape({
      uuid: string.isRequired,
    }).isRequired,
    attributes: object,
  }).isRequired,
  heroImagesById: objectOf(object),
  isPriority: bool,
  className: string,
  rootClassName: string,
};

export default BrandHeroCard;
