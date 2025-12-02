import React, { useEffect } from 'react';
import { bool, func, arrayOf, shape, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { BrandCardHome, PartnerCTACard, NamedLink } from '../../../../components';

import css from './FeaturedBrandPartners.module.css';

/**
 * FeaturedBrandPartners - Homepage section showcasing trusted brand partners
 * Replaces FeaturedBrands with Shop-style cards and trust indicators
 *
 * Features:
 * - 3-4 column grid on desktop, 2 column on mobile
 * - BrandCardHome cards with trust indicators
 * - PartnerCTACard for B2B recruitment
 * - Real Sharetribe data via Redux
 *
 * @param {Object} props
 * @param {Array} props.brandsWithProducts - Array of { brand, products } objects
 * @param {Function} props.onFetchFeaturedBrands - Redux action to fetch brands
 * @param {boolean} props.fetchInProgress - Loading state
 * @param {Object} props.fetchError - Error state
 * @param {string} props.className - Additional CSS class
 * @param {string} props.rootClassName - Root CSS class override
 */
const FeaturedBrandPartners = props => {
  const {
    brandsWithProducts = [],
    onFetchFeaturedBrands,
    fetchInProgress = false,
    fetchError = null,
    className = null,
    rootClassName = null,
  } = props;

  // Fetch brands on mount
  useEffect(() => {
    if (onFetchFeaturedBrands && brandsWithProducts.length === 0 && !fetchInProgress) {
      onFetchFeaturedBrands();
    }
  }, []);

  // Show loading state
  if (fetchInProgress && brandsWithProducts.length === 0) {
    return (
      <div className={classNames(rootClassName || css.root, className)}>
        <div className={css.container}>
          <div className={css.header}>
            <h2 className={css.title}>
              <FormattedMessage id="FeaturedBrandPartners.title" />
            </h2>
            <p className={css.subtitle}>
              <FormattedMessage id="FeaturedBrandPartners.subtitle" />
            </p>
          </div>
          <div className={css.loading}>
            <FormattedMessage id="FeaturedBrandPartners.loading" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (fetchError) {
    return (
      <div className={classNames(rootClassName || css.root, className)}>
        <div className={css.container}>
          <div className={css.header}>
            <h2 className={css.title}>
              <FormattedMessage id="FeaturedBrandPartners.title" />
            </h2>
          </div>
          <div className={css.error}>
            <FormattedMessage id="FeaturedBrandPartners.error" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no brands
  if (brandsWithProducts.length === 0) {
    return null;
  }

  const classes = classNames(rootClassName || css.root, className);

  // Limit to 6 brands maximum (4-6 per user preference)
  const displayBrands = brandsWithProducts.slice(0, 6);
  const totalBrandCount = brandsWithProducts.length;

  return (
    <div className={classes}>
      <div className={css.container}>
        {/* Section Header */}
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage id="FeaturedBrandPartners.title" />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage id="FeaturedBrandPartners.subtitle" />
          </p>
        </div>

        {/* Brand Grid */}
        <div className={css.grid}>
          {displayBrands.map(({ brand, products }) => (
            <BrandCardHome key={brand.id.uuid} brand={brand} products={products} />
          ))}

          {/* Partner CTA Card */}
          <PartnerCTACard partnerUrl="/partner" />
        </div>

        {/* View All Brands CTA */}
        <div className={css.viewAllBrands}>
          <NamedLink name="BrandsPage" className={css.viewAllButton}>
            {totalBrandCount > 0 ? (
              <FormattedMessage
                id="FeaturedBrandPartners.viewAllBrandsCount"
                values={{ count: totalBrandCount }}
              />
            ) : (
              <FormattedMessage id="FeaturedBrandPartners.viewAllBrands" />
            )}
            <span className={css.ctaArrow}>→</span>
          </NamedLink>
        </div>
      </div>
    </div>
  );
};

FeaturedBrandPartners.propTypes = {
  brandsWithProducts: arrayOf(
    shape({
      brand: shape({
        id: shape({
          uuid: string.isRequired,
        }).isRequired,
      }).isRequired,
      products: arrayOf(shape({})),
    })
  ),
  onFetchFeaturedBrands: func,
  fetchInProgress: bool,
  fetchError: shape({}),
  className: string,
  rootClassName: string,
};

export default FeaturedBrandPartners;
