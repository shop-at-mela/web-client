import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, LayoutSingleColumn, BrandCarousel, BrandCardHome } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import {
  loadData,
  getBrandsPageSections,
  getBrandsInProgress,
} from './BrandsPage.duck';
import css from './BrandsPage.module.css';

const BRANDS_PER_ROW = 6;

// Splits brands into balanced rows of at most BRANDS_PER_ROW.
// 7 brands → [4,3]; 13 → [5,5,3]
const chunkIntoRows = brands => {
  if (brands.length <= BRANDS_PER_ROW) return [brands];
  const numRows = Math.ceil(brands.length / BRANDS_PER_ROW);
  const size = Math.ceil(brands.length / numRows);
  const rows = [];
  for (let i = 0; i < brands.length; i += size) {
    rows.push(brands.slice(i, i + size));
  }
  return rows;
};

const BrandsPageComponent = props => {
  const {
    sections = [],
    brandsInProgress,
    scrollingDisabled,
  } = props;

  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();

  const canonicalUrl = createResourceLocatorString('BrandsPage', routeConfiguration, {}, {});

  const brandCount = sections.reduce((sum, section) => sum + section.brands.length, 0);

  const schemaTitle = intl.formatMessage({ id: 'BrandsPage.title' }, { brandCount });
  const schemaDescription = intl.formatMessage({ id: 'BrandsPage.description' }, { brandCount });

  const heroSection = (
    <div className={css.heroSection}>
      <h1 className={css.heroTitle}>
        <FormattedMessage id="BrandsPage.heroTitle" />
      </h1>
    </div>
  );

  const activeSections = sections.filter(section => section.brands.length > 0);

  const categoryNav = activeSections.length > 1 ? (
    <nav className={css.categoryNav} aria-label="Browse by category">
      <div className={css.categoryPills}>
        {activeSections.map(({ id, label }) => (
          <a key={id} href={`#category-${id}`} className={css.categoryPill}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  ) : null;

  const loadingContent = (
    <div className={css.loading}>
      <FormattedMessage id="BrandsPage.loadingState" />
    </div>
  );

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
        {activeSections.map(({ id, label, brands }) => {
          const rows = chunkIntoRows(brands);
          return (
            <div key={id} id={`category-${id}`} className={css.categorySection}>
              <h2 className={css.categoryTitle}>{label}</h2>
              {rows.map((rowBrands, rowIndex) => (
                <BrandCarousel
                  key={rowIndex}
                  className={rowIndex > 0 ? css.carouselRowGap : undefined}
                  items={rowBrands}
                  getKey={({ brand }) => brand.id.uuid}
                  renderItem={({ brand, products }) => (
                    <BrandCardHome
                      brand={brand}
                      products={products}
                      showCertifications={true}
                      showPlaceholders={false}
                      showTagline={true}
                      showLocation={true}
                      showCta={true}
                      maxProducts={2}
                    />
                  )}
                />
              ))}
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

const mapStateToProps = state => ({
  sections: getBrandsPageSections(state),
  brandsInProgress: getBrandsInProgress(state),
  scrollingDisabled: isScrollingDisabled(state),
});

const BrandsPage = compose(
  withRouter,
  connect(mapStateToProps)
)(BrandsPageComponent);

BrandsPage.loadData = loadData;

export default BrandsPage;
