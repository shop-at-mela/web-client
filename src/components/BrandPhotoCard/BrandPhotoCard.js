import React, { useState } from 'react';
import { arrayOf, shape, string } from 'prop-types';
import classNames from 'classnames';

import NamedLink from '../NamedLink/NamedLink';
import ListingImage from '../ListingImage/ListingImage';
import { getBrandSlugById } from '../../config/configBrands';
import { deriveBrandCraftLine } from '../../util/brandCraft';

import css from './BrandPhotoCard.module.css';

/**
 * BrandPhotoCard — an image-forward "why this brand earned its place" card.
 *
 * Shows one large primary product photo with a thumbnail filmstrip beneath it.
 * The photo swaps on THUMBNAIL hover (desktop) or tap (mobile) — never a swipe —
 * so it never conflicts with a horizontally-scrolling row of these cards. The
 * large photo itself links to the brand page; the thumbnails are swap controls.
 *
 * The "why it earned its place" line is derived from existing brand data
 * (brandCraft → brandTagline → first sentence of bio), so no new field is needed.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.brand brand user entity (id + attributes.profile)
 * @param {Array} props.products listing entities with images (primary photo each)
 * @param {string} [props.whyLine] override for the derived "why" line
 * @param {string} [props.className] extra classes on the root
 */
const MAX_THUMBS = 4;

// Main photo crops. Phones (<768px) get the 4:5 portrait pair when the listing
// has it; wider screens keep the 4:3 pair. A <picture> lets the browser fetch
// only one of the two. See mela-docs/product/prds/homepage-image-sizing-findings.md.
const LANDSCAPE_VARIANTS = ['square-small', 'square-small2x'];
const PORTRAIT_VARIANTS = ['portrait-card', 'portrait-card2x'];
const PORTRAIT_MEDIA = '(max-width: 767px)';
const MAIN_PHOTO_SIZES = '(max-width: 767px) 90vw, (max-width: 1023px) 45vw, 440px';

const srcSetFor = (variants, names) =>
  names
    .map(name => variants[name])
    .filter(v => v && v.url && v.width)
    .map(v => `${v.url} ${v.width}w`)
    .join(', ');

/**
 * Pick the main photo's sources from the active listing's first image.
 * Falls back to any non-portrait variant when the 4:3 pair is missing.
 */
export const mainPhotoSources = listing => {
  const variants = listing?.images?.[0]?.attributes?.variants || {};
  let landscape = srcSetFor(variants, LANDSCAPE_VARIANTS);
  if (!landscape) {
    const others = Object.keys(variants).filter(name => !PORTRAIT_VARIANTS.includes(name));
    landscape = srcSetFor(variants, others);
  }
  const portrait = srcSetFor(variants, PORTRAIT_VARIANTS);
  const fallbackSrc = landscape ? landscape.split(', ')[0].split(' ')[0] : null;
  return { landscape, portrait, fallbackSrc };
};

// Re-exported for existing callers (this file's own tests included) — the derivation
// itself lives in util/brandCraft.js so other components can reuse it directly.
export const deriveWhyLine = deriveBrandCraftLine;

const BrandPhotoCard = props => {
  const { brand, products = [], whyLine, className = null } = props;

  const [activeIndex, setActiveIndex] = useState(0);

  if (!brand || !brand.id) {
    return null;
  }

  // Only products that actually carry an image can drive the photo swap.
  const photoProducts = (products || []).filter(p => p?.images && p.images.length > 0);
  if (photoProducts.length === 0) {
    return null;
  }

  const thumbs = photoProducts.slice(0, MAX_THUMBS);
  const safeIndex = Math.min(activeIndex, thumbs.length - 1);
  const activeProduct = thumbs[safeIndex];
  const mainSources = mainPhotoSources(activeProduct);
  // Portrait only when every thumbnail's product has the crop, so swapping
  // photos on a phone never changes the card's height.
  const usePortrait = thumbs.every(p => !!mainPhotoSources(p).portrait);

  const { displayName } = brand.attributes?.profile || {};
  const initial = displayName?.charAt(0)?.toUpperCase() || 'B';
  const resolvedWhy = whyLine || deriveWhyLine(brand);

  const brandSlug = getBrandSlugById(brand.id.uuid);
  const brandLinkProps = brandSlug
    ? { name: 'BrandPage', params: { brandSlug } }
    : { name: 'ProfilePage', params: { id: brand.id.uuid } };

  const classes = classNames(css.root, className);

  return (
    <div className={classes}>
      <div className={css.stage}>
        <span className={css.chip} aria-hidden="true">
          {initial}
        </span>

        {/* Large primary photo → links to the brand page. */}
        <NamedLink {...brandLinkProps} className={css.mainLink}>
          <div
            className={classNames(css.mainPhoto, {
              [css.mainPhotoPortrait]: usePortrait,
            })}
          >
            {mainSources.fallbackSrc ? (
              <picture>
                {usePortrait ? (
                  <source
                    media={PORTRAIT_MEDIA}
                    srcSet={mainSources.portrait}
                    sizes={MAIN_PHOTO_SIZES}
                  />
                ) : null}
                <img
                  className={css.mainImg}
                  src={mainSources.fallbackSrc}
                  srcSet={mainSources.landscape}
                  sizes={MAIN_PHOTO_SIZES}
                  alt={displayName}
                />
              </picture>
            ) : null}
          </div>
        </NamedLink>
      </div>

      {/* Thumbnail filmstrip — hover (desktop) or tap (mobile) to swap. */}
      {thumbs.length > 1 && (
        <div className={css.filmstrip} role="tablist" aria-label={`${displayName} photos`}>
          {thumbs.map((product, index) => (
            <button
              key={product.id.uuid}
              type="button"
              role="tab"
              aria-selected={index === safeIndex}
              aria-label={`Show photo ${index + 1}`}
              className={classNames(css.thumb, { [css.thumbActive]: index === safeIndex })}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            >
              <ListingImage
                listing={product}
                variant="square-small"
                aspectWidth={1}
                aspectHeight={1}
                lazy={false}
                rootClassName={css.photoImg}
                alt=""
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}

      <div className={css.info}>
        <NamedLink {...brandLinkProps} className={css.nameLink}>
          <h3 className={css.brandName}>{displayName}</h3>
        </NamedLink>
        {resolvedWhy && <p className={css.why}>{resolvedWhy}</p>}
      </div>
    </div>
  );
};

BrandPhotoCard.propTypes = {
  brand: shape({
    id: shape({ uuid: string.isRequired }).isRequired,
  }).isRequired,
  products: arrayOf(
    shape({
      id: shape({ uuid: string.isRequired }).isRequired,
    })
  ),
  whyLine: string,
  className: string,
};

export default BrandPhotoCard;
