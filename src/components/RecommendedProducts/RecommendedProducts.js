import React, { useEffect, useMemo, useRef } from 'react';
import { arrayOf, bool, func, string } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { createSlug } from '../../util/urlHelpers';
import { useConfiguration } from '../../context/configurationContext';
import { H3, NamedLink, ResponsiveImage } from '../../components';

import { fetchRecommendedProducts } from '../../ducks/recommendedProducts.duck';
import css from './RecommendedProducts.module.css';

/**
 * Simple product card for recommended products
 */
const RecommendedProductCard = ({ product, intl }) => {
  const { title, price, images } = product.attributes;
  const { sku } = product.attributes.publicData || {};

  const primaryImage = images && images.length > 0 ? images[0] : null;
  const formattedPrice = price ? formatMoney(intl, price) : null;
  const slug = createSlug(title);

  const linkProps = {
    name: 'ListingPage',
    params: { id: product.id.uuid, slug },
  };

  return (
    <NamedLink className={css.productCard} {...linkProps}>
      <div className={css.imageContainer}>
        {primaryImage ? (
          <ResponsiveImage
            rootClassName={css.productImage}
            alt={title}
            image={primaryImage}
            variants={['listing-card', 'listing-card-2x']}
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
          />
        ) : (
          <div className={css.noImage}>
            <FormattedMessage id="RecommendedProducts.noImage" />
          </div>
        )}
      </div>
      <div className={css.productInfo}>
        <h4 className={css.productTitle}>{title}</h4>
        {formattedPrice && <div className={css.productPrice}>{formattedPrice}</div>}
      </div>
    </NamedLink>
  );
};

/**
 * RecommendedProducts component displays a "You may also like" section
 * with products fetched based on SKUs from publicData.recommendedProducts
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

  return (
    <div className={classes}>
      <H3 as="h2" className={css.title}>
        {brandName ? (
          <FormattedMessage id="RecommendedProducts.titleWithBrand" values={{ brandName }} />
        ) : (
          <FormattedMessage id="RecommendedProducts.title" />
        )}
      </H3>

      {hasError ? (
        <div className={css.error}>
          <FormattedMessage id="RecommendedProducts.loadError" />
        </div>
      ) : isLoading ? (
        <div className={css.loading}>
          <FormattedMessage id="RecommendedProducts.loading" />
        </div>
      ) : hasProducts ? (
        <>
          <div className={css.productsGrid}>
            {recommendedProducts.map(product => (
              <RecommendedProductCard
                key={product.id.uuid}
                product={product}
                intl={intl}
              />
            ))}
          </div>
          {brandName && (
            <div className={css.viewMoreContainer}>
              <NamedLink
                name="BrandPage"
                params={{ brandSlug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }}
                className={css.viewMoreLink}
              >
                <FormattedMessage id="RecommendedProducts.viewMoreFromBrand" values={{ brandName }} />
              </NamedLink>
            </div>
          )}
        </>
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