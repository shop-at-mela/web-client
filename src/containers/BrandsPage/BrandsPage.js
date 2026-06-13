import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { BRAND_CATEGORIES } from '../../config/configBrands';
import { Page, LayoutSingleColumn, BrandCard } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import {
  loadData,
  getBrandsGroupedByCategory,
  getBrandsInProgress,
} from './BrandsPage.duck';
import css from './BrandsPage.module.css';

const BrandsPageComponent = props => {
  const {
    brandsGroupedByCategory = {},
    brandsInProgress,
    scrollingDisabled,
  } = props;

  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();

  // Build canonical URL
  const canonicalUrl = createResourceLocatorString(
    'BrandsPage',
    routeConfiguration,
    {},
    {}
  );

  // Total brand count across all categories
  const brandCount = Object.values(brandsGroupedByCategory).reduce(
    (sum, brands) => sum + brands.length,
    0
  );

  // SEO metadata
  const siteTitle = config.marketplaceName;
  const schemaTitle = intl.formatMessage({ id: 'BrandsPage.title' }, { brandCount });
  const schemaDescription = intl.formatMessage({ id: 'BrandsPage.description' }, { brandCount });

  // Favorite handler
  const handleFavorite = listingId => {
    console.log('Favorite clicked:', listingId);
  };

  // Hero section
  const heroSection = (
    <div className={css.heroSection}>
      <h1 className={css.heroTitle}>
        <FormattedMessage id="BrandsPage.heroTitle" />
      </h1>
    </div>
  );

  // Category nav — only shown when multiple categories have brands
  const activeCategories = BRAND_CATEGORIES.filter(
    ({ id }) => (brandsGroupedByCategory[id] || []).length > 0
  );
  const categoryNav = activeCategories.length > 1 ? (
    <nav className={css.categoryNav} aria-label="Browse by category">
      <div className={css.categoryPills}>
        {activeCategories.map(({ id, label }) => (
          <a key={id} href={`#category-${id}`} className={css.categoryPill}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  ) : null;

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

  const hasNoBrands = !brandsInProgress && brandCount === 0;

  const content = brandsInProgress && brandCount === 0
    ? loadingContent
    : hasNoBrands
    ? emptyContent
    : (
      <>
        {BRAND_CATEGORIES.map(({ id, label }) => {
          const brandsInCategory = brandsGroupedByCategory[id] || [];
          if (brandsInCategory.length === 0) return null;
          return (
            <div key={id} id={`category-${id}`} className={css.categorySection}>
              <h2 className={css.categoryTitle}>{label}</h2>
              <div className={css.brandGrid}>
                {brandsInCategory.map(({ brand, products }) => (
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
        })}
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
          {categoryNav}
          <div className={css.container}>
            {content}
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  return {
    brandsGroupedByCategory: getBrandsGroupedByCategory(state),
    brandsInProgress: getBrandsInProgress(state),
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const BrandsPage = compose(
  withRouter,
  connect(mapStateToProps)
)(BrandsPageComponent);

BrandsPage.loadData = loadData;

export default BrandsPage;
