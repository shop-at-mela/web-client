import React, { useState } from 'react';
import { arrayOf, shape, string } from 'prop-types';
import classNames from 'classnames';

import NamedLink from '../NamedLink/NamedLink';
import ListingImage from '../ListingImage/ListingImage';
import { getBrandSlugById } from '../../config/configBrands';

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

export const deriveWhyLine = brand => {
  const { bio, publicData } = brand?.attributes?.profile || {};
  const firstSentence = bio ? bio.split('.')[0].trim() : '';
  return publicData?.brandCraft || publicData?.brandTagline || firstSentence || null;
};

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
          <ListingImage
            listing={activeProduct}
            variant="listing-card"
            aspectWidth={4}
            aspectHeight={3}
            lazy={false}
            className={css.mainPhoto}
            rootClassName={css.photoImg}
            alt={displayName}
            sizes="(max-width: 767px) 90vw, 360px"
          />
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
