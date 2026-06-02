import React, { useEffect, useMemo, useRef } from 'react';
import { arrayOf, bool, func, string } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { useConfiguration } from '../../context/configurationContext';
import { ProductCarousel } from '../../components';

import { fetchRecommendedProducts } from '../../ducks/recommendedProducts.duck';
import css from './RecommendedProducts.module.css';

/**
 * RecommendedProducts component displays a "You may also like" carousel
 * with products fetched based on SKUs from publicData.recommendedProducts.
 * Uses the shared ProductCarousel component — same horizontal scroll pattern as the home page.
 */
const RecommendedProductsComponent = ({
  rootClassName = null,
  className = null,
  recommendedProductSKUs,
  recommendedProducts = [],
  fetchRecommendedProductsInProgress = false,
  fetchRecommendedProductsError = null,
  onFetchRecommendedProducts,
  brandName = null,
}) => {

  const intl = useIntl();
  const config = useConfiguration();
  const prevSkusRef = useRef();

  // Create a stable string representation for comparison
  const skusString = useMemo(() => {
    return recommendedProductSKUs && Array.isArray(recommendedProductSKUs)
      ? recommendedProductSKUs.join(',')
      : '';
  }, [recommendedProductSKUs]);

  useEffect(() => {
    // Only fetch if SKUs have actually changed
    if (skusString && skusString !== prevSkusRef.current && recommendedProductSKUs?.length > 0) {
      prevSkusRef.current = skusString;
      onFetchRecommendedProducts(recommendedProductSKUs, config);
    }
  }, [skusString, config]);

  // Don't render if no recommended product SKUs
  if (!recommendedProductSKUs || !Array.isArray(recommendedProductSKUs) || recommendedProductSKUs.length === 0) {
    return null;
  }

  const classes = classNames(rootClassName || css.root, className);
  const hasError = !!fetchRecommendedProductsError;
  const isLoading = fetchRecommendedProductsInProgress;
  const hasProducts = recommendedProducts && recommendedProducts.length > 0;

  const carouselTitle = brandName
    ? intl.formatMessage({ id: 'RecommendedProducts.titleWithBrand' }, { brandName })
    : intl.formatMessage({ id: 'RecommendedProducts.title' });

  const brandSlug = brandName
    ? brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : null;

  return (
    <div className={classes}>
      {hasError ? (
        <div className={css.error}>
          <FormattedMessage id="RecommendedProducts.loadError" />
        </div>
      ) : hasProducts || isLoading ? (
        <ProductCarousel
          title={carouselTitle}
          viewAllLinkName={brandSlug ? 'BrandPage' : undefined}
          viewAllLinkParams={brandSlug ? { brandSlug } : undefined}
          listings={recommendedProducts}
          isLoading={isLoading}
        />
      ) : (
        <div className={css.noProducts}>
          <FormattedMessage id="RecommendedProducts.noProducts" />
        </div>
      )}
    </div>
  );
};


RecommendedProductsComponent.propTypes = {
  rootClassName: string,
  className: string,
  recommendedProductSKUs: arrayOf(string).isRequired,
  recommendedProducts: arrayOf(propTypes.listing),
  fetchRecommendedProductsInProgress: bool,
  fetchRecommendedProductsError: propTypes.error,
  onFetchRecommendedProducts: func.isRequired,
  brandName: string,
};

const mapStateToProps = (state, ownProps) => {
  const {
    recommendedProductIds,
    recommendedProducts,
    fetchRecommendedProductsInProgress,
    fetchRecommendedProductsError,
  } = state.recommendedProducts || {};

  return {
    recommendedProducts: recommendedProducts || [],
    fetchRecommendedProductsInProgress,
    fetchRecommendedProductsError,
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchRecommendedProducts: (skus, config) => dispatch(fetchRecommendedProducts(skus, config)),
});

const RecommendedProducts = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(RecommendedProductsComponent);

export default RecommendedProducts;