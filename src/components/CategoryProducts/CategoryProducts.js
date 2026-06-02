import React, { useEffect, useMemo, useRef } from 'react';
import { arrayOf, bool, func, string } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { useConfiguration } from '../../context/configurationContext';
import { ProductCarousel } from '../../components';

import { fetchCategoryProducts } from '../../ducks/categoryProducts.duck';
import css from './CategoryProducts.module.css';


/**
 * CategoryProducts component displays products from a specific category level.
 * Uses the shared ProductCarousel component — same horizontal scroll pattern as the home page.
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
  currentListingId = null, // ID of current listing to exclude from results
}) => {

  const intl = useIntl();
  const config = useConfiguration();
  const prevCategoryRef = useRef();

  // Helper to recursively search nested category structure
  const findCategoryById = (categories, categoryId) => {
    if (!categories || !Array.isArray(categories)) return null;
    for (const category of categories) {
      if (category.id === categoryId) return category;
      if (category.subcategories?.length > 0) {
        const found = findCategoryById(category.subcategories, categoryId);
        if (found) return found;
      }
    }
    return null;
  };

  const resolveCategoryName = (categoryId, categoryConfig) => {
    if (!categoryConfig || !categoryId) return categoryId;
    const categoryItem = findCategoryById(categoryConfig, categoryId);
    return categoryItem?.name || categoryId;
  };

  const categoryString = useMemo(() => {
    return categoryLevel && categoryName ? `${categoryLevel}:${categoryName}` : '';
  }, [categoryLevel, categoryName]);

  useEffect(() => {
    if (categoryString && categoryString !== prevCategoryRef.current && categoryLevel && categoryName) {
      prevCategoryRef.current = categoryString;
      onFetchCategoryProducts(categoryLevel, categoryName, config, currentListingId);
    }
  }, [categoryString, config, categoryLevel, categoryName, onFetchCategoryProducts, currentListingId]);

  if (!categoryLevel || !categoryName) return null;

  const classes = classNames(rootClassName || css.root, className);
  const hasError = !!fetchCategoryProductsError;
  const isLoading = fetchCategoryProductsInProgress;
  const hasProducts = categoryProducts && categoryProducts.length > 0;

  const getTitleId = () => {
    switch (categoryLevel) {
      case 'categoryLevel1': return 'CategoryProducts.titleLevel1';
      case 'categoryLevel2': return 'CategoryProducts.titleLevel2';
      case 'categoryLevel3': return 'CategoryProducts.titleLevel3';
      default: return 'CategoryProducts.title';
    }
  };

  const resolvedCategoryName = resolveCategoryName(categoryName, config.categoryConfiguration?.categories);
  const viewAllSearch = `?pub_${categoryLevel}=${encodeURIComponent(categoryName)}`;

  return (
    <div className={classes}>
      {hasError ? (
        <div className={css.error}>
          <FormattedMessage id="CategoryProducts.loadError" />
        </div>
      ) : hasProducts || isLoading ? (
        <ProductCarousel
          title={intl.formatMessage({ id: getTitleId() }, { categoryName: resolvedCategoryName })}
          viewAllLinkName="SearchPage"
          viewAllLinkSearch={viewAllSearch}
          listings={categoryProducts}
          isLoading={isLoading}
        />
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
  currentListingId: string,
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