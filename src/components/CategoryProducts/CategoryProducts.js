import React, { useEffect, useMemo, useRef } from 'react';
import { arrayOf, bool, func, object, string } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { createSlug } from '../../util/urlHelpers';
import { useConfiguration } from '../../context/configurationContext';
import { H3, NamedLink, ResponsiveImage } from '../../components';

import { fetchCategoryProducts } from '../../ducks/categoryProducts.duck';
import css from './CategoryProducts.module.css';

/**
 * Simple product card for category products
 */
const CategoryProductCard = ({ product, intl }) => {
  const { title, price, images } = product.attributes;
  const { sku, brand } = product.attributes.publicData || {};

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
            <FormattedMessage id="CategoryProducts.noImage" />
          </div>
        )}
      </div>
      <div className={css.productInfo}>
        {brand && <div className={css.productBrand}>{brand}</div>}
        <h4 className={css.productTitle}>{title}</h4>
        {formattedPrice && <div className={css.productPrice}>{formattedPrice}</div>}
      </div>
    </NamedLink>
  );
};

/**
 * CategoryProducts component displays products from a specific category level
 */
const CategoryProductsComponent = ({
  rootClassName = null,
  className = null,
  categoryLevel,
  categoryName,
  categoryProducts = [],
  fetchCategoryProductsInProgress = false,
  fetchCategoryProductsError = null,
  onFetchCategoryProducts,
  layoutManager = null, // Desktop-only layout manager
  useFullWidth = false, // Whether to use full-width layout on desktop
}) => {


  const intl = useIntl();
  const config = useConfiguration();
  const prevCategoryRef = useRef();
  const containerRef = useRef(null);

  // Create a stable string representation for comparison
  const categoryString = useMemo(() => {
    return categoryLevel && categoryName ? `${categoryLevel}:${categoryName}` : '';
  }, [categoryLevel, categoryName]);

  useEffect(() => {
    // Only fetch if category has actually changed
    if (categoryString && categoryString !== prevCategoryRef.current && categoryLevel && categoryName) {
      prevCategoryRef.current = categoryString;
      onFetchCategoryProducts(categoryLevel, categoryName, config);
    }
  }, [categoryString, config, categoryLevel, categoryName, onFetchCategoryProducts]);

  // Desktop-only layout management
  useEffect(() => {
    if (layoutManager && containerRef.current && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const mode = useFullWidth ? 'fullWidth' : 'adaptive';
      layoutManager.registerContentSection(containerRef.current, { mode });
    }
  }, [layoutManager, useFullWidth]);

  // Don't render if no category info
  if (!categoryLevel || !categoryName) {
    return null;
  }

  const classes = classNames(rootClassName || css.root, className, {
    [css.fullWidth]: useFullWidth && typeof window !== 'undefined' && window.innerWidth >= 1024,
  });
  const hasError = !!fetchCategoryProductsError;
  const isLoading = fetchCategoryProductsInProgress;
  const hasProducts = categoryProducts && categoryProducts.length > 0;

  // Determine title based on category level
  const getTitleId = () => {
    switch (categoryLevel) {
      case 'categoryLevel1':
        return 'CategoryProducts.titleLevel1';
      case 'categoryLevel2':
        return 'CategoryProducts.titleLevel2';
      case 'categoryLevel3':
        return 'CategoryProducts.titleLevel3';
      default:
        return 'CategoryProducts.title';
    }
  };

  return (
    <div ref={containerRef} className={classes}>
      <H3 as="h2" className={css.title}>
        <FormattedMessage id={getTitleId()} values={{ categoryName }} />
      </H3>

      {hasError ? (
        <div className={css.error}>
          <FormattedMessage id="CategoryProducts.loadError" />
        </div>
      ) : isLoading ? (
        <div className={css.loading}>
          <FormattedMessage id="CategoryProducts.loading" />
        </div>
      ) : hasProducts ? (
        <>
          <div className={css.productsGrid}>
            {categoryProducts.map(product => (
              <CategoryProductCard
                key={product.id.uuid}
                product={product}
                intl={intl}
              />
            ))}
          </div>
          <div className={css.viewMoreContainer}>
            <NamedLink
              name="SearchPage"
              to={{
                search: `?pub_${categoryLevel}=${encodeURIComponent(categoryName)}`
              }}
              className={css.viewMoreLink}
            >
              <FormattedMessage id="CategoryProducts.viewMoreInCategory" values={{ categoryName }} />
            </NamedLink>
          </div>
        </>
      ) : (
        <div className={css.noProducts}>
          <FormattedMessage id="CategoryProducts.noProducts" />
        </div>
      )}
    </div>
  );
};


CategoryProductsComponent.propTypes = {
  rootClassName: string,
  className: string,
  categoryLevel: string.isRequired,
  categoryName: string.isRequired,
  categoryProducts: arrayOf(propTypes.listing),
  fetchCategoryProductsInProgress: bool,
  fetchCategoryProductsError: propTypes.error,
  onFetchCategoryProducts: func.isRequired,
  layoutManager: object, // Desktop layout manager instance
  useFullWidth: bool, // Whether to use full-width layout on desktop
};

const mapStateToProps = (state, ownProps) => {
  const { categoryLevel, categoryName } = ownProps;
  const categoryKey = `${categoryLevel}:${categoryName}`;


  const {
    categoryProductsById = {},
    fetchCategoryProductsInProgress = {},
    fetchCategoryProductsError = {},
  } = state.categoryProducts || {};

  const mappedProps = {
    categoryProducts: categoryProductsById[categoryKey] || [],
    fetchCategoryProductsInProgress: fetchCategoryProductsInProgress[categoryKey],
    fetchCategoryProductsError: fetchCategoryProductsError[categoryKey],
  };


  return mappedProps;
};

const mapDispatchToProps = {
  onFetchCategoryProducts: fetchCategoryProducts,
};

const CategoryProducts = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(CategoryProductsComponent);

export default CategoryProducts;