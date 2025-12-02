import React, { useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, LayoutSingleColumn, BrandCard, BrandFilterBar } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import {
  loadData,
  getBrands,
  getFeaturedBrands,
  getBrandsWithProducts,
  getFeaturedBrandsWithProducts,
  getBrandsInProgress,
  getBrandsPagination,
} from './BrandsPage.duck';
import css from './BrandsPage.module.css';

const BrandsPageComponent = props => {
  const {
    brandsWithProducts = [],
    featuredBrandsWithProducts = [],
    brandsInProgress,
    pagination = null,
    scrollingDisabled,
    history,
    location,
  } = props;

  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const currentPage = parseInt(urlParams.get('page') || '1', 10);
  const perPage = parseInt(urlParams.get('perPage') || '24', 10);
  const sortBy = urlParams.get('sort') || 'alphabetical';

  // Build canonical URL
  const canonicalUrl = createResourceLocatorString(
    'BrandsPage',
    routeConfiguration,
    {},
    {}
  );

  // SEO metadata
  const brandCount = pagination?.totalItems || 50;
  const siteTitle = config.marketplaceName;
  const schemaTitle = intl.formatMessage({ id: 'BrandsPage.title' }, { brandCount });
  const schemaDescription = intl.formatMessage({ id: 'BrandsPage.description' }, { brandCount });

  // Handle sort change
  const handleSortChange = newSort => {
    const params = new URLSearchParams(location.search);
    params.set('sort', newSort);
    params.set('page', '1'); // Reset to page 1 on sort change
    history.push({ search: params.toString() });
  };

  // Handle per page change
  const handlePerPageChange = newPerPage => {
    const params = new URLSearchParams(location.search);
    params.set('perPage', newPerPage);
    params.set('page', '1'); // Reset to page 1 on per page change
    history.push({ search: params.toString() });
  };

  // Handle page change
  const handlePageChange = newPage => {
    const params = new URLSearchParams(location.search);
    params.set('page', newPage);
    history.push({ search: params.toString() });
  };

  // Hero section
  const heroSection = (
    <div className={css.heroSection}>
      <h1 className={css.heroTitle}>
        <FormattedMessage id="BrandsPage.heroTitle" />
      </h1>
      <p className={css.heroSubtitle}>
        <FormattedMessage
          id="BrandsPage.heroSubtitle"
          values={{ brandCount }}
        />
      </p>
    </div>
  );

  // Filter bar
  const filterBar = (
    <BrandFilterBar
      sortBy={sortBy}
      onSortChange={handleSortChange}
      perPage={perPage}
      onPerPageChange={handlePerPageChange}
    />
  );

  // Favorite handler
  const handleFavorite = listingId => {
    // TODO: Implement favorite functionality
    console.log('Favorite clicked:', listingId);
  };

  // Featured brands section
  const hasFeaturedBrands = featuredBrandsWithProducts && featuredBrandsWithProducts.length > 0;
  const featuredBrandsSection = hasFeaturedBrands && (
    <div className={css.featuredSection}>
      <h2 className={css.sectionTitle}>
        <FormattedMessage id="BrandsPage.featuredBrandsTitle" />
      </h2>
      <div className={css.featuredBrandGrid}>
        {featuredBrandsWithProducts.map(({ brand, products }) => (
          <BrandCard
            key={brand.id.uuid}
            brand={brand}
            products={products}
            onFavorite={handleFavorite}
          />
        ))}
      </div>
    </div>
  );

  // All brands section title
  const allBrandsTitle = (
    <h2 className={css.sectionTitle}>
      <FormattedMessage id="BrandsPage.allBrandsTitle" />
    </h2>
  );

  // Brand grid
  const brandGrid = (
    <div className={css.brandGrid}>
      {brandsWithProducts.map(({ brand, products }) => (
        <BrandCard
          key={brand.id.uuid}
          brand={brand}
          products={products}
          onFavorite={handleFavorite}
        />
      ))}
    </div>
  );

  // Loading state
  const loadingContent = (
    <div className={css.loading}>
      <FormattedMessage id="BrandsPage.loadingState" />
    </div>
  );

  // Empty state
  const emptyContent = (
    <div className={css.emptyState}>
      <h2 className={css.emptyStateTitle}>
        <FormattedMessage id="BrandsPage.emptyStateTitle" />
      </h2>
      <p className={css.emptyStateDescription}>
        <FormattedMessage id="BrandsPage.emptyStateDescription" />
      </p>
    </div>
  );

  // Load More button
  const totalPages = pagination ? Math.ceil(pagination.totalItems / perPage) : 1;
  const hasMoreBrands = currentPage < totalPages;
  const loadMoreButton = hasMoreBrands && (
    <div className={css.loadMoreSection}>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        className={css.loadMoreButton}
        disabled={brandsInProgress}
      >
        {brandsInProgress ? (
          <FormattedMessage id="BrandsPage.loadingMore" />
        ) : (
          <FormattedMessage id="BrandsPage.loadMore" />
        )}
      </button>
      <p className={css.loadMoreInfo}>
        <FormattedMessage
          id="BrandsPage.showingCount"
          values={{
            showing: brandsWithProducts.length,
            total: pagination?.totalItems || 0,
          }}
        />
      </p>
    </div>
  );

  // Main content
  const hasNoBrands = !brandsInProgress && brandsWithProducts.length === 0;
  const content = brandsInProgress && currentPage === 1
    ? loadingContent
    : hasNoBrands
    ? emptyContent
    : (
      <>
        {featuredBrandsSection}
        {allBrandsTitle}
        {filterBar}
        {brandGrid}
        {loadMoreButton}
      </>
    );

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'CollectionPage',
        name: schemaTitle,
        description: schemaDescription,
      }}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <div className={css.root}>
          {heroSection}
          <div className={css.container}>
            {content}
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

// PropTypes removed to eliminate React warning about defaultProps deprecation
// Using JavaScript default parameters in destructuring instead

const mapStateToProps = state => {
  return {
    brandsWithProducts: getBrandsWithProducts(state),
    featuredBrandsWithProducts: getFeaturedBrandsWithProducts(state),
    brandsInProgress: getBrandsInProgress(state),
    pagination: getBrandsPagination(state),
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const BrandsPage = compose(
  withRouter,
  connect(mapStateToProps)
)(BrandsPageComponent);

BrandsPage.loadData = loadData;

export default BrandsPage;
