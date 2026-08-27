import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link, useLocation, useParams } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { parse } from '../../util/urlHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { getOccasionLabel } from '../../util/occasionLabels';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import SearchResultsPanel from '../SearchPage/SearchResultsPanel/SearchResultsPanel';

import { getGiftingContent, GIFT_PRICE_BANDS, GIFT_RECIPIENT_CHIPS } from './giftingContent';

import css from './GiftingPage.module.css';

const getLandingPagePath = routeConfiguration => {
  try {
    return createResourceLocatorString('LandingPage', routeConfiguration, {}, {});
  } catch (e) {
    return '/';
  }
};

// ── Component ──────────────────────────────────────────────────────────────

const GiftingPageComponent = props => {
  const { listings, pagination, searchInProgress, scrollingDisabled } = props;

  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const location = useLocation();
  const { occasionSlug } = useParams();

  const content = getGiftingContent(occasionSlug, getOccasionLabel);
  const marketplaceName = config.marketplaceName;
  const pageTitle = intl.formatMessage(
    { id: 'GiftingPage.title' },
    { heading: content.heading, marketplaceName }
  );

  // Query-less canonical: /gifts or /occasions/:slug, never with the chip params (price,
  // pub_recipient) or utm_* attached — see src/index.js's stripUtmParams() for the
  // first-load case, and Page.js's canonicalURL override for this SSR/route case.
  const canonicalPath = occasionSlug ? `/occasions/${occasionSlug}` : '/gifts';
  const canonicalURL = `${config.marketplaceRootURL}${canonicalPath}`;

  const schema = [
    {
      '@type': 'CollectionPage',
      name: pageTitle,
      description: content.metaDescription,
      url: canonicalURL,
      mainEntity: {
        '@type': 'ItemList',
        name: content.heading,
        itemListElement: listings.map((l, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${config.marketplaceRootURL}/l/${l.id.uuid}`,
          name: l.attributes.title,
        })),
      },
    },
  ];

  const landingPath = getLandingPagePath(routeConfiguration);

  // Pagination must stay on this route (not /s) — see the pageName/pagePathParams override
  // added to SearchResultsPanel.js for GiftingPage's sake.
  const paginationPageName = occasionSlug ? 'OccasionPage' : 'GiftsPage';
  const paginationPathParams = occasionSlug ? { occasionSlug } : {};

  return (
    <Page
      title={pageTitle}
      description={content.metaDescription}
      schema={schema}
      canonicalURL={canonicalURL}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <nav className={css.breadcrumb} aria-label="Gifting navigation">
            <Link to={landingPath} className={css.breadcrumbLink}>
              {intl.formatMessage({ id: 'GiftingPage.home' })}
            </Link>
            <span className={css.breadcrumbSep} aria-hidden="true">
              {' › '}
            </span>
            <span className={css.breadcrumbCurrent}>{content.heading}</span>
          </nav>

          <header className={css.header}>
            <h1 className={css.title}>{content.heading}</h1>
            <p className={css.description}>{content.subheading}</p>
          </header>

          {/* Gift filter chips — presentational: price bands reuse the built-in price
              filter, recipient chips light up once Day 1's `flex-cli search set --key
              recipient` has run (gifting-festival-traffic-prd.md §1G) */}
          <div className={css.chipRow} aria-label={intl.formatMessage({ id: 'GiftingPage.priceChipsLabel' })}>
            {GIFT_PRICE_BANDS.map(band => (
              <Link
                key={band.priceParam}
                to={{
                  pathname: location.pathname,
                  search: '?' + new URLSearchParams({ price: band.priceParam }).toString(),
                }}
                className={css.chip}
              >
                {band.label}
              </Link>
            ))}
          </div>

          <div
            className={css.chipRow}
            aria-label={intl.formatMessage({ id: 'GiftingPage.recipientChipsLabel' })}
          >
            {GIFT_RECIPIENT_CHIPS.map(({ option, label }) => (
              <Link
                key={option}
                to={{
                  pathname: location.pathname,
                  search:
                    '?' + new URLSearchParams({ pub_recipient: `has_any:${option}` }).toString(),
                }}
                className={css.chip}
              >
                {label}
              </Link>
            ))}
          </div>

          <section className={css.productsSection}>
            {searchInProgress ? (
              <div className={css.loading}>
                {intl.formatMessage({ id: 'GiftingPage.loadingProducts' })}
              </div>
            ) : listings.length === 0 ? (
              <div className={css.empty}>
                <p className={css.emptyText}>
                  {intl.formatMessage({ id: 'GiftingPage.noProducts' })}
                </p>
                <Link to="/gifts" className={css.emptyLink}>
                  {intl.formatMessage({ id: 'GiftingPage.browseAllGifts' })}
                </Link>
              </div>
            ) : (
              <SearchResultsPanel
                listings={listings}
                pagination={pagination}
                search={parse(location.search)}
                isMapVariant={false}
                showOccasionChips
                pageName={paginationPageName}
                pagePathParams={paginationPathParams}
                intl={intl}
              />
            )}
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentPageResultIds, pagination, searchInProgress } = state.SearchPage;
  return {
    listings: getListingsById(state, currentPageResultIds),
    pagination,
    searchInProgress,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const GiftingPage = compose(connect(mapStateToProps))(GiftingPageComponent);

export default GiftingPage;
