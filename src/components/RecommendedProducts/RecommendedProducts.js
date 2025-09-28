import React, { useEffect } from 'react';
import { arrayOf, bool, func, string } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { createSlug } from '../../util/urlHelpers';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
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
            variants={['landscape-crop', 'landscape-crop2x']}
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
const RecommendedProductsComponent = props => {
  const {
    rootClassName,
    className,
    recommendedProductSKUs,
    recommendedProducts,
    fetchRecommendedProductsInProgress,
    fetchRecommendedProductsError,
    onFetchRecommendedProducts,
  } = props;

  const intl = useIntl();

  useEffect(() => {
    if (recommendedProductSKUs && recommendedProductSKUs.length > 0) {
      onFetchRecommendedProducts(recommendedProductSKUs);
    }
  }, [recommendedProductSKUs, onFetchRecommendedProducts]);

  // Don't render if no recommended product SKUs
  if (!recommendedProductSKUs || recommendedProductSKUs.length === 0) {
    return null;
  }

  const classes = classNames(rootClassName || css.root, className);
  const hasError = !!fetchRecommendedProductsError;
  const isLoading = fetchRecommendedProductsInProgress;
  const hasProducts = recommendedProducts && recommendedProducts.length > 0;

  return (
    <div className={classes}>
      <H3 as="h2" className={css.title}>
        <FormattedMessage id="RecommendedProducts.title" />
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
        <div className={css.productsGrid}>
          {recommendedProducts.map(product => (
            <RecommendedProductCard
              key={product.id.uuid}
              product={product}
              intl={intl}
            />
          ))}
        </div>
      ) : (
        <div className={css.noProducts}>
          <FormattedMessage id="RecommendedProducts.noProducts" />
        </div>
      )}
    </div>
  );
};

RecommendedProductsComponent.defaultProps = {
  rootClassName: null,
  className: null,
  recommendedProducts: [],
  fetchRecommendedProductsInProgress: false,
  fetchRecommendedProductsError: null,
};

RecommendedProductsComponent.propTypes = {
  rootClassName: string,
  className: string,
  recommendedProductSKUs: arrayOf(string).isRequired,
  recommendedProducts: arrayOf(propTypes.listing),
  fetchRecommendedProductsInProgress: bool,
  fetchRecommendedProductsError: propTypes.error,
  onFetchRecommendedProducts: func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const {
    recommendedProductIds,
    fetchRecommendedProductsInProgress,
    fetchRecommendedProductsError,
  } = state.recommendedProducts || {};

  // Get products from marketplace data if we have the IDs
  const recommendedProducts = recommendedProductIds
    ? getMarketplaceEntities(
        state,
        recommendedProductIds.map(id => ({ id, type: 'listing' }))
      )
    : [];

  return {
    recommendedProducts,
    fetchRecommendedProductsInProgress,
    fetchRecommendedProductsError,
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchRecommendedProducts: skus => dispatch(fetchRecommendedProducts(skus)),
});

const RecommendedProducts = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(RecommendedProductsComponent);

export default RecommendedProducts;