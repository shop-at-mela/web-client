import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { useLocation } from 'react-router-dom';

import { useIntl, FormattedMessage } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { shouldShowRedirectTrust, markRedirectTrustShown } from '../../util/sentimentCapture';
import { openBrandStorefront } from '../../util/analytics/brandClickout';
import { pushSavedPageView } from '../../util/analytics/savedPageView';
import { parse } from '../../util/urlHelpers';
import {
  selectEffectiveSavedListingIds,
  selectAnonSavedItems,
  selectSavedItemsCount,
  fetchSavedListings,
} from '../../ducks/savedListings.duck';

import {
  Page,
  NamedLink,
  LayoutSingleColumn,
  RedirectTrustSheet,
  SavedPageSignupPush,
  SavedBrandGroup,
  SavedPageRecommendations,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import css from './SavedPage.module.css';

/**
 * Groups listings by publicData.brand, preserving the order they first appear in
 * (savedListings is already in savedListingIds insertion/recency order). Listings with
 * no brand collect into a trailing { brandName: null } group ("More saved") so nothing
 * saved is ever dropped from the page — see add-to-cart-restoration-prd.md §14.
 */
const groupListingsByBrand = listings => {
  const groups = [];
  const groupsByBrand = {};
  const ungrouped = [];

  listings.forEach(listing => {
    const brand = listing.attributes?.publicData?.brand;
    if (!brand) {
      ungrouped.push(listing);
      return;
    }
    if (!groupsByBrand[brand]) {
      const group = { brandName: brand, listings: [] };
      groupsByBrand[brand] = group;
      groups.push(group);
    }
    groupsByBrand[brand].listings.push(listing);
  });

  if (ungrouped.length > 0) {
    groups.push({ brandName: null, listings: ungrouped });
  }

  return groups;
};

/**
 * SavedPage — /saved
 *
 * Client-side only (no SSR loadData). Listings are fetched lazily after paint using
 * selectEffectiveSavedListingIds — savedListingIds (loaded by fetchCurrentUser) for
 * authenticated shoppers, anonSavedItems' ids (localStorage) for anonymous ones.
 *
 * Hosts the brand redirect + RedirectTrustSheet trust/feedback modal relocated here
 * from the PDP (see mela-docs/product/prds/add-to-cart-restoration-prd.md) — each
 * saved item's "Shop on {brand}" CTA routes through the same
 * handleShopNow → RedirectTrustSheet (first click of session) → openBrandStorefront
 * pipeline the PDP used to run directly. §14 restructures the flat grid into per-brand
 * SavedBrandGroup sections (the group CTA reuses this same handleShopNow) and adds an
 * inspiration-first SavedPageRecommendations rail.
 */
const SavedPageComponent = props => {
  const {
    savedListingIds,
    savedListings,
    fetchInProgress,
    fetchError,
    onFetchSavedListings,
    isAuthenticated,
    anonSavedItems,
    savedItemsCount,
  } = props;

  const intl = useIntl();
  const config = useConfiguration();
  const location = useLocation();

  const [redirectSheetOpen, setRedirectSheetOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState(null);
  const [pendingTrackingParams, setPendingTrackingParams] = useState(null);
  const [pendingBrandName, setPendingBrandName] = useState(null);
  const [pendingIsVerified, setPendingIsVerified] = useState(false);

  // The Shop-CTA button that opened the trust sheet — refocused when it closes
  // (WCAG 2.4.3, see §13.1 fix #7). Not component state: changing it should never
  // trigger a re-render, only be read back on close.
  const shopTriggerRef = useRef(null);

  useEffect(() => {
    if (savedListingIds.length > 0) {
      onFetchSavedListings(savedListingIds);
    }
  }, [savedListingIds.join(',')]); // stable string key — avoids re-fetch on same IDs

  const isEmpty = savedListingIds.length === 0;
  const hasListings = savedListings.length > 0;
  const brandGroups = hasListings ? groupListingsByBrand(savedListings) : [];

  // Entities can already be in the store (hasListings) before the fetch that put them
  // there has actually settled (fetchInProgress can lag a render behind) — gating on
  // hasListings too avoids a one-render flash where the grid/recs are ready but briefly
  // treated as still-loading. Falls back to !fetchInProgress once entities are known to
  // never arrive (e.g. a fetch error) so this doesn't wait forever either.
  const dataSettled = hasListings || !fetchInProgress;

  // Whether SavedPageRecommendations rendered a non-empty rail — null until its own
  // fetch settles, reported back via onLoaded. Feeds recs_shown below.
  const [recsShown, setRecsShown] = useState(null);
  const pageViewFiredRef = useRef(false);

  // Fires once per page visit, tagged with which UI surface sent the shopper here —
  // connects "clicked Add to Cart" / "clicked header badge" to "landed on /saved" for
  // the funnel-linking analytics requirement in §12.3. Delayed (vs. firing immediately
  // on mount) until the saved-listings data has settled and the recs rail has reported
  // whether it rendered anything, so recs_shown/brand_group_count (§14,
  // insights/crossshop-tracking-prd.md §14) are accurate rather than always-false.
  useEffect(() => {
    if (pageViewFiredRef.current || !dataSettled || recsShown === null) return;
    pageViewFiredRef.current = true;
    const { entry } = parse(location.search);
    pushSavedPageView({
      entry,
      recsShown,
      brandGroupCount: brandGroups.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSettled, recsShown]);

  const handleShopNow = ({ url, brandName, isVerified, trackingParams, triggerElement }) => {
    shopTriggerRef.current = triggerElement || null;
    if (shouldShowRedirectTrust()) {
      markRedirectTrustShown();
      setPendingRedirectUrl(url);
      setPendingTrackingParams(trackingParams);
      setPendingBrandName(brandName);
      setPendingIsVerified(isVerified);
      setRedirectSheetOpen(true);
    } else {
      openBrandStorefront(url, trackingParams);
    }
  };

  const handleTrustSheetClose = () => {
    setRedirectSheetOpen(false);
    // Return focus to the card's Shop button (Continue, dismiss, and backdrop click
    // all route through this same onClose).
    shopTriggerRef.current?.focus();
  };

  const schemaTitle = intl.formatMessage({ id: 'SavedPage.schemaTitle' });
  const schemaDescription = intl.formatMessage({ id: 'SavedPage.schemaDescription' });

  const shoppableCount = savedListings.filter(
    listing => listing.attributes?.publicData?.brand && listing.attributes?.publicData?.productUrl
  ).length;
  const showSignupPush = !isAuthenticated && anonSavedItems.length > 0;

  const renderSizes = '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw';

  return (
    <Page title={schemaTitle} description={schemaDescription} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.header}>
            <h1 className={css.title}>
              <FormattedMessage id="SavedPage.title" />
            </h1>
            <p className={css.subheading}>
              <FormattedMessage id="SavedPage.subheading" />
            </p>
          </div>

          {fetchError && (
            <div className={css.error}>
              <FormattedMessage id="SavedPage.error" />
            </div>
          )}

          {fetchInProgress && !hasListings && (
            <div className={css.loading}>
              <FormattedMessage id="SavedPage.loading" />
            </div>
          )}

          {!fetchInProgress && isEmpty && (
            <>
              <div className={css.emptyState}>
                <h2 className={css.emptyHeading}>
                  <FormattedMessage id="SavedPage.emptyHeading" />
                </h2>
                <p className={css.emptySubheading}>
                  <FormattedMessage id="SavedPage.emptySubheading" />
                </p>
                <NamedLink name="SearchPage" className={css.browseCta}>
                  <FormattedMessage id="SavedPage.emptyBrowseCta" />
                </NamedLink>
              </div>
              {/* Empty-cart entry point into discovery — "Popular on Mela" framing
                  (add-to-cart-restoration-prd.md §14.0). Self-hides if the query returns
                  nothing, so an empty cart never shows a broken/empty carousel. */}
              <SavedPageRecommendations
                excludeIds={savedListingIds}
                onLoaded={setRecsShown}
                titleId="SavedPageRecommendations.emptyTitle"
                subtitleId="SavedPageRecommendations.emptySubtitle"
                className={css.emptyRecs}
              />
            </>
          )}

          {hasListings && (
            <p className={css.itemCount}>
              {shoppableCount > 0 ? (
                <FormattedMessage
                  id="SavedPage.itemsSummary"
                  values={{ total: savedItemsCount, ready: shoppableCount }}
                />
              ) : (
                <FormattedMessage id="SavedPage.totalSavedCount" values={{ count: savedItemsCount }} />
              )}
            </p>
          )}

          {hasListings && (
            <div className={css.groups}>
              {brandGroups.map(group => (
                <SavedBrandGroup
                  key={group.brandName || '__more_saved__'}
                  brandName={group.brandName}
                  listings={group.listings}
                  onShopNow={handleShopNow}
                  renderSizes={renderSizes}
                />
              ))}
            </div>
          )}

          {/* Bottom-of-page recs on a non-empty cart once data has settled (see
              dataSettled above) — also covers the (rare) case where savedListingIds is
              non-empty but the listings fetch errored, so recsShown still resolves and
              the delayed saved_page_view push above isn't blocked indefinitely. */}
          {dataSettled && !isEmpty && (
            <SavedPageRecommendations
              excludeIds={savedListingIds}
              onLoaded={setRecsShown}
              className={css.bottomRecs}
            />
          )}

          {/* Rendered after the shopper's own items (not above them) — an anon shopper
              arriving to confirm a save should see their item before a sign-up pitch
              (founder browser-testing feedback, §13.1 fix #5). */}
          {showSignupPush && <SavedPageSignupPush className={css.signupPush} />}
        </div>
      </LayoutSingleColumn>

      {/* Pre-redirect trust sheet — shown first Shop-CTA click per session (relocated from PDP) */}
      {redirectSheetOpen && pendingRedirectUrl && (
        <RedirectTrustSheet
          isOpen={redirectSheetOpen}
          brandName={pendingBrandName}
          productUrl={pendingRedirectUrl}
          isVerified={pendingIsVerified}
          onContinue={url => openBrandStorefront(url, pendingTrackingParams)}
          onClose={handleTrustSheetClose}
        />
      )}
    </Page>
  );
};

const mapStateToProps = state => {
  // Effective ids — savedListingIds for authenticated shoppers, anonSavedItems' ids for
  // anonymous ones — so the grid actually fetches and renders for both (see
  // selectEffectiveSavedListingIds' docstring).
  const savedListingIds = selectEffectiveSavedListingIds(state);
  const savedListings = getListingsById(state, savedListingIds.map(id => ({ uuid: id })));
  return {
    savedListingIds,
    savedListings,
    fetchInProgress: state.savedListings.fetchInProgress,
    fetchError: state.savedListings.fetchError,
    isAuthenticated: state.auth.isAuthenticated,
    anonSavedItems: selectAnonSavedItems(state),
    savedItemsCount: selectSavedItemsCount(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchSavedListings: ids => dispatch(fetchSavedListings(ids)),
});

const SavedPage = compose(connect(mapStateToProps, mapDispatchToProps))(SavedPageComponent);

export default SavedPage;
