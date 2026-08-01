import React, { useEffect } from 'react';
import { bool, func, arrayOf, shape, string } from 'prop-types';

import { FormattedMessage } from '../../../../util/reactIntl';
import { BrandCarousel, NamedLink } from '../../../../components';
import BrandPhotoCard from '../../../../components/BrandPhotoCard/BrandPhotoCard';
import { getAllBrandIds } from '../../../../config/configBrands';

import css from './EarnedItsPlace.module.css';

// Cap the number of brand cards shown; the rest live on /brands.
const MAX_BRANDS = 6;

/**
 * EarnedItsPlace — "Every Brand Here Earned Its Place" as SHOWN, not claimed.
 *
 * Replaces the abstract vetting trio with real, image-forward brand cards: each
 * BrandPhotoCard shows a brand's product photography (swappable via thumbnails)
 * plus a one-line "why it earned its place." Reuses the FeaturedBrandPartners
 * data path (getFeaturedBrandsWithProducts) — no new fetch/duck.
 *
 * @param {Object} props
 * @param {Array<{brand: Object, products: Array}>} props.brandsWithProducts
 * @param {Function} props.onFetchFeaturedBrands
 * @param {boolean} props.fetchInProgress
 * @param {Object} props.fetchError
 */
const EarnedItsPlace = props => {
  const {
    brandsWithProducts = [],
    onFetchFeaturedBrands,
    fetchInProgress = false,
    fetchError = null,
  } = props;

  useEffect(() => {
    if (onFetchFeaturedBrands && brandsWithProducts.length === 0 && !fetchInProgress) {
      onFetchFeaturedBrands();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only brands with at least one image-bearing product can render a photo card.
  const displayBrands = brandsWithProducts
    .filter(({ products }) => (products || []).some(p => p?.images && p.images.length > 0))
    .slice(0, MAX_BRANDS);

  // Nothing to show and nothing loading → render nothing (self-hiding section).
  if (fetchError || (!fetchInProgress && displayBrands.length === 0)) {
    return null;
  }

  const totalBrandCount = getAllBrandIds().length;

  return (
    <div className={css.root}>
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage
              id="EarnedItsPlace.title"
              defaultMessage="Every Brand Here Earned Its Place"
            />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage
              id="EarnedItsPlace.subtitle"
              defaultMessage="Not a directory. A decision. Here's the why behind a few."
            />
          </p>
        </div>

        <BrandCarousel
          items={displayBrands}
          getKey={({ brand }) => brand.id.uuid}
          renderItem={({ brand, products }) => <BrandPhotoCard brand={brand} products={products} />}
        />

        <div className={css.viewAllBrands}>
          <NamedLink name="BrandsPage" className={css.viewAllButton}>
            {totalBrandCount > 0 ? (
              <FormattedMessage
                id="EarnedItsPlace.viewAllBrandsCount"
                defaultMessage="Explore All {count} Brands"
                values={{ count: totalBrandCount }}
              />
            ) : (
              <FormattedMessage
                id="EarnedItsPlace.viewAllBrands"
                defaultMessage="Explore All Brands"
              />
            )}
            <span className={css.ctaArrow}>→</span>
          </NamedLink>
        </div>
      </div>
    </div>
  );
};

EarnedItsPlace.propTypes = {
  brandsWithProducts: arrayOf(
    shape({
      brand: shape({ id: shape({ uuid: string.isRequired }).isRequired }).isRequired,
      products: arrayOf(shape({})),
    })
  ),
  onFetchFeaturedBrands: func,
  fetchInProgress: bool,
  fetchError: shape({}),
};

export default EarnedItsPlace;
