import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCallback } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import loadable from '@loadable/component';
import classNames from 'classnames';
import { useDesktopLayoutManager } from './layoutUtils';

// Utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { getAspectsForSchema } from '../../util/itemAspectsParser';
import { getItemSpecificsAttributes, getItemAspectsForSEO } from '../../util/itemAspectsHelpers';
import { shouldShowRedirectTrust, markRedirectTrustShown } from '../../util/sentimentCapture';
import { isMelaVerified } from '../../util/certificationHelpers';
import { LISTING_STATE_PENDING_APPROVAL, LISTING_STATE_CLOSED, propTypes } from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
} from '../../util/urlHelpers';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
} from '../../util/errors.js';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers.js';
import { requireListingImage } from '../../util/configHelpers';
import {
  ensureListing,
  ensureOwnListing,
  ensureUser,
  userDisplayNameAsString,
} from '../../util/data';
import { richText } from '../../util/richText';
import {
  OFFER,
  REQUEST,
  isBookingProcess,
  isNegotiationProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../../transactions/transaction';

// Global ducks (for Redux actions and thunks)
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

// Shared components
import {
  H2,
  H3,
  H4,
  Page,
  NamedLink,
  OrderPanel,
  LayoutSingleColumn,
  CategoryBreadcrumb,
  ItemSpecifics,
  ListingTrustChips,
  RedirectTrustSheet,
  SectionText,
} from '../../components';

// Related components and modules
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import {
  sendInquiry,
  setInitialValues,
  fetchTimeSlots,
  fetchTransactionLineItems,
} from './ListingPage.duck';

import {
  LoadingPage,
  ErrorPage,
  handleContactUser,
  handleSubmitInquiry,
  handleNavigateToMakeOfferPage,
  handleNavigateToRequestQuotePage,
  handleSubmit,
  priceForSchemaMaybe,
  getDerivedRenderData,
} from './ListingPage.shared';
import SectionHero from './SectionHero';
import SectionReviews from './SectionReviews';
import SectionAuthorMaybe from './SectionAuthorMaybe';
import SectionMapMaybe from './SectionMapMaybe';
import CustomListingFields from './CustomListingFields';
import VariantDisplay from '../../components/VariantDisplay/VariantDisplay';
import Notifications from './Notifications/Notifications';
import ListingPageAccessWrapper from './ListingPageAccessWrapper';

// Lazy-loaded components
const RecommendedProducts = loadable(() =>
  import(/* webpackChunkName: "RecommendedProducts" */ '../../components/RecommendedProducts/RecommendedProducts')
);
const CategoryProducts = loadable(() =>
  import(/* webpackChunkName: "CategoryProducts" */ '../../components/CategoryProducts/CategoryProducts')
);

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE = 16;

export const ListingPageComponent = props => {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(
    props.inquiryModalOpenForListingId === props.params.id
  );
  const [imageCarouselOpen, setImageCarouselOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [redirectSheetOpen, setRedirectSheetOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState(null);

  // Desktop-only layout management (mobile-safe)
  const { registerOrderPanel, registerContentSection, layoutManager } = useDesktopLayoutManager();
  const orderPanelRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Register OrderPanel for desktop layout detection (mobile-safe)
  useEffect(() => {
    if (orderPanelRef.current) {
      registerOrderPanel(orderPanelRef.current);
    }
  }, [registerOrderPanel]);

  const {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    intl,
    onManageDisableScrolling,
    params: rawParams,
    location,
    scrollingDisabled,
    showListingError,
    reviews = [],
    fetchReviewsError,
    sendInquiryInProgress,
    sendInquiryError,
    history,
    callSetInitialValues,
    onSendInquiry,
    onInitializeCardPaymentData,
    config,
    routeConfiguration,
    showOwnListingsOnly,
    ...restOfProps
  } = props;

  const derivedData = getDerivedRenderData({
    rawParams,
    getListing,
    getOwnListing,
    showOwnListingsOnly,
    currentUser,
    config,
    intl,
    location,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE,
    longWordClassName: css.longWord,
    payoutDetailsWarningClassName: css.payoutDetailsWarning,
  });
  const {
    listingConfig,
    listingId,
    isVariant,
    currentListing,
    listingSlug,
    params,
    listingPathParamType,
    listingTab,
    description,
    geolocation,
    price,
    title,
    publicData,
    metadata,
    richTitle,
    isOwnListing,
    showListingImage,
    showDescription,
    processType,
    ensuredAuthor,
    noPayoutDetailsSetWithOwnListing,
    payoutDetailsWarning,
    authorDisplayName,
    facebookImages,
    twitterImages,
    schemaImages,
    productURL,
    availabilityMaybe,
    noIndexMaybe,
    hasInvalidListingData,
  } = derivedData;

  // Helper function to recursively search through nested category structure
  const findCategoryById = (categories, categoryId) => {
    if (!categories || !Array.isArray(categories)) return null;
    for (const category of categories) {
      if (category.id === categoryId) {
        return category;
      }
      if (category.subcategories && category.subcategories.length > 0) {
        const found = findCategoryById(category.subcategories, categoryId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to resolve category IDs to readable names
  const resolveCategoryNames = (categoryIds, categoryConfig) => {
    if (!categoryConfig || !categoryIds) return {};
    const resolved = {};
    Object.keys(categoryIds).forEach(levelKey => {
      const categoryId = categoryIds[levelKey];
      if (categoryId) {
        const categoryItem = findCategoryById(categoryConfig, categoryId);
        resolved[levelKey] = categoryItem?.name || categoryId;
      }
    });
    return resolved;
  };

  const topbar = <TopbarContainer />;

  if (showListingError && showListingError.status === 404) {
    // 404 listing not found
    return <NotFoundPage staticContext={props.staticContext} />;
  } else if (showListingError) {
    // Other error in fetching listing
    return <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} />;
  } else if (!currentListing.id) {
    // Still loading the listing
    return <LoadingPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} />;
  }

  // Memoize the recommended products SKUs to prevent infinite re-renders
  const recommendedProductSKUs = useMemo(() => {
    if (!publicData.recommendedProducts) return null;
    return typeof publicData.recommendedProducts === 'string'
      ? publicData.recommendedProducts.split(',').map(sku => sku.trim()).filter(Boolean)
      : Array.isArray(publicData.recommendedProducts)
      ? publicData.recommendedProducts
      : null;
  }, [publicData.recommendedProducts]);

  if (hasInvalidListingData) {
    // Listing should always contain listingType, transactionProcessAlias and unitType)
    return (
      <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} invalidListing />
    );
  }
  const unitType = publicData.unitType;
  const isNegotiation = processType === 'negotiation';

  const commonParams = { params, history, routes: routeConfiguration };
  const onContactUser = handleContactUser({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    setInitialValues, // from ListingPage.duck.js (set initial values for the listing page)
    location,
    setInquiryModalOpen,
  });
  // Note: this is for inquire transition to inquiry state in booking, purchase and negotiation processes.
  // Inquiry process is handled through handleSubmit.
  const onSubmitInquiry = handleSubmitInquiry({
    ...commonParams,
    getListing,
    onSendInquiry,
    setInquiryModalOpen,
  });

  const handleOrderSubmit = values => {
    const isCurrentlyClosed = currentListing.attributes.state === LISTING_STATE_CLOSED;
    if (isOwnListing || isCurrentlyClosed) {
      window.scrollTo(0, 0);
    } else if (isNegotiation && unitType === REQUEST) {
      // This is to navigate to MakeOfferPage when NegotiationForm is submitted
      const onNavigateToMakeOfferPage = handleNavigateToMakeOfferPage({
        ...commonParams,
        getListing,
      });
      onNavigateToMakeOfferPage(values);
    } else if (isNegotiation && unitType === OFFER) {
      const onNavigateToRequestQuotePage = handleNavigateToRequestQuotePage({
        ...commonParams,
        getListing,
      });
      onNavigateToRequestQuotePage(values);
    } else {
      const onSubmit = handleSubmit({
        ...commonParams,
        currentUser,
        callSetInitialValues,
        getListing,
        onInitializeCardPaymentData,
      });
      onSubmit(values);
    }
  };


  const handleShopNow = url => {
    if (shouldShowRedirectTrust()) {
      markRedirectTrustShown();
      setPendingRedirectUrl(url);
      setRedirectSheetOpen(true);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const marketplaceName = config.marketplaceName;
  const brandName = publicData.brand;
  const brandPart = brandName ? ` by ${brandName}` : '';
  const schemaTitle = `${title}${brandPart} - Authentic Indian Baby Products | ${marketplaceName}`;

  const generateSEODescription = (titleArg, brandNameArg, descriptionArg) => {
    const bPart = brandNameArg ? `${brandNameArg} ` : '';
    const truncatedDesc = descriptionArg ? descriptionArg.substring(0, 100) : '';
    return `Shop authentic ${bPart}${titleArg} for Indian diaspora families. ${truncatedDesc} Trusted Indian baby products delivered to USA. Cultural heritage meets modern parenting.`.substring(0, 160);
  };

  const seoDescription = publicData.metaDescription
    || generateSEODescription(title, brandName, description);

  const currentStock = currentListing.currentStock?.attributes?.quantity || 0;
  const schemaAvailability = !currentListing.currentStock
    ? 'https://schema.org/InStock'
    : currentStock > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';


  const handleViewPhotosClick = e => {
    // Stop event from bubbling up to prevent image click handler
    // trying to open the carousel as well.
    e.stopPropagation();
    setImageCarouselOpen(true);
  };

  const actionBarClassName = classNames(css.actionBarForHeroLayout, {
    [css.actionBarNoBorderRadiusOnMobile]: !showListingImage,
  });
  const actionBar = (
    <Notifications
      mounted={mounted}
      listing={currentListing}
      isOwnListing={isOwnListing}
      noPayoutDetailsSetWithOwnListing={noPayoutDetailsSetWithOwnListing}
      currentUser={currentUser}
      className={actionBarClassName}
      editParams={{
        id: listingId.uuid,
        slug: listingSlug,
        type: listingPathParamType,
        tab: listingTab,
      }}
    />
  );

  return (
    <Page
      title={schemaTitle} // SEO ONLY: Browser tab title, NOT visible on page
      scrollingDisabled={scrollingDisabled}
      author={authorDisplayName}
      description={seoDescription} // SEO ONLY: Meta description for search engines, NOT visible on page
      facebookImages={facebookImages}
      twitterImages={twitterImages}
      {...noIndexMaybe}
      schema={{
        // SEO ONLY: JSON-LD structured data for search engines (Google, Bing, etc.)
        // This is invisible to users but helps search engines understand the product
        // Appears as <script type="application/ld+json"> in page head
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title, // Product name for structured data
        description: seoDescription, // SEO description for structured data
        image: schemaImages, // Product images for rich snippets
        sku: publicData.sku, // Product SKU for identification
        material: publicData.material, // Material from itemAspects (consumer-friendly)
        countryOfOrigin: 'India', // Country of origin for cultural context
        brand: brandName ? {
          '@type': 'Brand',
          name: brandName // Helps Google show brand in search results
        } : undefined,
        category: publicData.categoryLevel1 || publicData.categoryLevel2 || publicData.categoryLevel3, // Product category for search engines

        // FIX #1 & #2: Enhanced offers section with shipping details and corrected seller
        offers: {
          '@type': 'Offer',
          url: productURL,
          ...priceForSchemaMaybe(price), // Price for Google Shopping/rich snippets
          availability: schemaAvailability, // Stock status for search engines (always required)

          // FIX #1: Add shipping details (calculated based on buyer's location)
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'US'
            }
          },

          // FIX #2: Seller is the brand, not the marketplace (Mela is the platform/facilitator)
          seller: {
            '@type': 'Organization',
            name: brandName || marketplaceName,
            description: `Authentic Indian baby products brand${brandName ? ' available on Mela marketplace' : ''}`
          }
        },

        // FIX #3: Fixed audience structure with audienceType and proper geographicArea
        audience: {
          '@type': 'Audience',
          audienceType: 'Parents',
          name: 'Indian Diaspora Parents in United States',
          geographicArea: {
            '@type': 'AdministrativeArea',
            name: 'United States'
          }
        },

        // Consumer search synonyms — machine-readable for AI answer engines (AEO)
        ...(publicData.searchSynonyms?.length > 0 && {
          keywords: publicData.searchSynonyms,
        }),

        // ENHANCEMENT: Parsed item aspects with benefits from itemAspectsParser
        additionalProperty: [
          // Parse benefit-enriched Item_Aspects from publicData
          ...(publicData.itemAspects ? getAspectsForSchema(publicData.itemAspects, true) : []),
          // Add cultural heritage properties
          {
            '@type': 'PropertyValue',
            name: 'Cultural Heritage',
            value: 'Authentic Indian Products'
          },
          {
            '@type': 'PropertyValue',
            name: 'Target Market',
            value: 'US Indian Diaspora Families'
          }
        ]
      }}
    >
      <LayoutSingleColumn className={css.pageRoot} topbar={topbar} footer={<FooterContainer />}>
        {showListingImage ? (
          <SectionHero
            title={title}
            listing={currentListing}
            isOwnListing={isOwnListing}
            imageCarouselOpen={imageCarouselOpen}
            onImageCarouselClose={() => setImageCarouselOpen(false)}
            handleViewPhotosClick={handleViewPhotosClick}
            onManageDisableScrolling={onManageDisableScrolling}
            actionBar={actionBar}
          />
        ) : (
          <div className={css.actionBarContainerForNoListingImage}>{actionBar}</div>
        )}
        <div className={css.contentWrapperForHeroLayout}>
          <div className={css.mainColumnForHeroLayout}>
            <div className={showListingImage ? css.mobileHeading : css.noListingImageHeadingHero}>
              {showListingImage ? (
                // add css logic here that applies larger margin on mobile view to push down title
                <H2 as="h1" className={css.orderPanelTitle}>
                  <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
                </H2>
              ) : (
                <H3
                  as="h1"
                  className={classNames(css.orderPanelTitle, {
                    [css.titleMarginForOwnListingNoImage]: isOwnListing,
                  })}
                >
                  <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
                </H3>
              )}
            </div>

            {/* Certification + occasion trust chips */}
            <ListingTrustChips
              certifications={publicData.certification}
              itemAspects={publicData.itemAspects}
            />

            {/* Brand / author section — placed early for affiliate trust */}
            <SectionAuthorMaybe
              title={title}
              listing={currentListing}
              authorDisplayName={authorDisplayName}
              onContactUser={onContactUser}
              isInquiryModalOpen={isAuthenticated && inquiryModalOpen}
              onCloseInquiryModal={() => setInquiryModalOpen(false)}
              sendInquiryError={sendInquiryError}
              sendInquiryInProgress={sendInquiryInProgress}
              onSubmitInquiry={onSubmitInquiry}
              currentUser={currentUser}
              onManageDisableScrolling={onManageDisableScrolling}
            />

            {/* Item Specifics Section */}
            <ItemSpecifics
              attributes={getItemSpecificsAttributes(publicData)}
              categoryBreadcrumb={
                (publicData.categoryLevel1 || publicData.categoryLevel2 || publicData.categoryLevel3) && (() => {
                  const categoryIds = {
                    level1: publicData.categoryLevel1,
                    level2: publicData.categoryLevel2,
                    level3: publicData.categoryLevel3
                  };

                  const categoryNames = resolveCategoryNames(categoryIds, config.categoryConfiguration?.categories);
                  return (
                    <CategoryBreadcrumb
                      category={categoryNames}
                      className={css.categoryBreadcrumbInline}
                    />
                  );
                })()
              }
            />

            <VariantDisplay variantsString={publicData.variantsString} />

            {showDescription && <SectionText text={description} showAsIngress />}

            <CustomListingFields
              publicData={publicData}
              metadata={metadata}
              listingFieldConfigs={listingConfig.listingFields}
              categoryConfiguration={config.categoryConfiguration}
              intl={intl}
            />

            {/* VISIBLE ON PAGE: Internal linking section for SEO and user navigation */}
            {/* This DOES appear on the visible product page as clickable links */}
            {/* Benefits: SEO link juice + user discovery of related products */}
            <div className={css.seoLinksContainer}>
              {(publicData.categoryLevel1 || publicData.categoryLevel2 || publicData.categoryLevel3) && (
                <div className={css.categoryLink}>
                  {/* Shows: "Shop more in [Category Name]" as clickable link */}
                  <FormattedMessage id="ListingPage.exploreCategory" />
                  <NamedLink
                    name="SearchPage"
                    to={{
                      search: [
                        publicData.categoryLevel1 && `pub_categoryLevel1=${encodeURIComponent(publicData.categoryLevel1)}`,
                        publicData.categoryLevel2 && `pub_categoryLevel2=${encodeURIComponent(publicData.categoryLevel2)}`,
                        publicData.categoryLevel3 && `pub_categoryLevel3=${encodeURIComponent(publicData.categoryLevel3)}`
                      ].filter(Boolean).join('&').replace(/^/, '?')
                    }}
                    className={css.internalLink}
                  >
                    {publicData.categoryLevel3 || publicData.categoryLevel2 || publicData.categoryLevel1}
                  </NamedLink>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <SectionReviews reviews={reviews} fetchReviewsError={fetchReviewsError} />
            )}
            {/* Recommended Products Section */}
            {recommendedProductSKUs && recommendedProductSKUs.length > 0 && (
              <RecommendedProducts
                recommendedProductSKUs={recommendedProductSKUs}
                brandName={brandName}
                onManageDisableScrolling={onManageDisableScrolling}
              />
            )}
          </div>
          <div className={css.orderColumnForHeroLayout}>
            <OrderPanel
              ref={orderPanelRef}
              className={css.orderPanel}
              listing={currentListing}
              isOwnListing={isOwnListing}
              onSubmit={handleOrderSubmit}
              authorLink={
                <NamedLink
                  className={css.authorNameLink}
                  name={isVariant ? 'ListingPageVariant' : 'ListingPage'}
                  params={params}
                  to={{ hash: '#author' }}
                >
                  {authorDisplayName}
                </NamedLink>
              }
              title={<FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />}
              titleDesktop={
                <H4 as="h1" className={css.orderPanelTitle}>
                  <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
                </H4>
              }
              payoutDetailsWarning={payoutDetailsWarning}
              author={ensuredAuthor}
              onManageDisableScrolling={onManageDisableScrolling}
              onContactUser={onContactUser}
              {...restOfProps}
              validListingTypes={config.listing.listingTypes}
              marketplaceCurrency={config.currency}
              dayCountAvailableForBooking={config.stripe.dayCountAvailableForBooking}
              marketplaceName={config.marketplaceName}
              showListingImage={showListingImage}
              onShopNow={handleShopNow}
            />
          </div>
        </div>

        {/* Category Products Sections - Outside main column for full width */}
        {publicData.categoryLevel3 && (
          <CategoryProducts
            categoryLevel="categoryLevel3"
            categoryName={publicData.categoryLevel3}
            currentListingId={currentListing?.id?.uuid}
          />
        )}
        {publicData.categoryLevel2 && publicData.categoryLevel2 !== publicData.categoryLevel3 && (
          <CategoryProducts
            categoryLevel="categoryLevel2"
            categoryName={publicData.categoryLevel2}
            currentListingId={currentListing?.id?.uuid}
          />
        )}
        {publicData.categoryLevel1 && publicData.categoryLevel1 !== publicData.categoryLevel2 && publicData.categoryLevel1 !== publicData.categoryLevel3 && (
          <CategoryProducts
            categoryLevel="categoryLevel1"
            categoryName={publicData.categoryLevel1}
            currentListingId={currentListing?.id?.uuid}
          />
        )}

      </LayoutSingleColumn>

      {/* Pre-redirect trust sheet — shown first CTA click per session */}
      {redirectSheetOpen && pendingRedirectUrl && (
        <RedirectTrustSheet
          isOpen={redirectSheetOpen}
          brandName={brandName || authorDisplayName}
          productUrl={pendingRedirectUrl}
          isVerified={isMelaVerified(publicData)}
          onContinue={url => window.open(url, '_blank', 'noopener,noreferrer')}
          onClose={() => setRedirectSheetOpen(false)}
        />
      )}
    </Page>
  );
};

/**
 * The ListingPage component with cover photo layout
 *
 * @component
 * @param {Object} props
 * @param {Object} props.params - The path params object
 * @param {string} props.params.id - The listing id
 * @param {string} props.params.slug - The listing slug
 * @param {LISTING_PAGE_DRAFT_VARIANT | LISTING_PAGE_PENDING_APPROVAL_VARIANT} props.params.variant - The listing variant
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {Object} props.currentUser - The current user
 * @param {Function} props.getListing - The get listing function
 * @param {Function} props.getOwnListing - The get own listing function
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {boolean} props.scrollingDisabled - Whether scrolling is disabled
 * @param {string} props.inquiryModalOpenForListingId - The inquiry modal open for the specific listing id
 * @param {propTypes.error} props.showListingError - The show listing error
 * @param {Function} props.callSetInitialValues - The call page-specific setInitialValues function, which is given to this function as a parameter
 * @param {Array<propTypes.review>} props.reviews - The reviews
 * @param {propTypes.error} props.fetchReviewsError - The fetch reviews error
 * @param {Object<string, Object>} props.monthlyTimeSlots - The monthly time slots. E.g. { '2019-11': { timeSlots: [], fetchTimeSlotsInProgress: false, fetchTimeSlotsError: null } }
 * @param {Object<string, Object>} props.timeSlotsForDate - The time slots for date. E.g. { '2019-11-01': { timeSlots: [], fetchedAt: 1572566400000, fetchTimeSlotsError: null, fetchTimeSlotsInProgress: false } }
 * @param {boolean} props.sendInquiryInProgress - Whether the send inquiry is in progress
 * @param {propTypes.error} props.sendInquiryError - The send inquiry error
 * @param {Function} props.onSendInquiry - The on send inquiry function
 * @param {Function} props.onInitializeCardPaymentData - The on initialize card payment data function
 * @param {Function} props.onFetchTimeSlots - The on fetch time slots function
 * @param {Function} props.onFetchTransactionLineItems - The on fetch transaction line items function
 * @param {Array<propTypes.transactionLineItem>} props.lineItems - The line items
 * @param {boolean} props.fetchLineItemsInProgress - Whether the fetch line items is in progress
 * @param {propTypes.error} props.fetchLineItemsError - The fetch line items error

 * @returns {JSX.Element} listing page component
 */
const ListingPage = props => {
  const dispatch = useDispatch();
  const store = useStore();

  const { isAuthenticated } = useSelector(state => state.auth);
  const {
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    timeSlotsForDate,
    sendInquiryInProgress,
    sendInquiryError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    inquiryModalOpenForListingId,
  } = useSelector(state => state.ListingPage);
  const currentUser = useSelector(state => state.user?.currentUser);
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const getListing = useCallback(
    id => {
      const state = store.getState();
      const ref = { id, type: 'listing' };
      const listings = getMarketplaceEntities(state, [ref]);
      return listings.length === 1 ? listings[0] : null;
    },
    [store]
  );
  const getOwnListing = useCallback(
    id => {
      const state = store.getState();
      const ref = { id, type: 'ownListing' };
      const listings = getMarketplaceEntities(state, [ref]);
      return listings.length === 1 ? listings[0] : null;
    },
    [store]
  );

  const onManageDisableScrolling = useCallback(
    (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    [dispatch]
  );
  const callSetInitialValues = useCallback(
    (setInitialValuesFn, values, saveToSessionStorage) =>
      dispatch(setInitialValuesFn(values, saveToSessionStorage)),
    [dispatch]
  );
  const onFetchTransactionLineItems = useCallback(
    params => dispatch(fetchTransactionLineItems(params)),
    [dispatch]
  );
  const onSendInquiry = useCallback((listing, message) => dispatch(sendInquiry(listing, message)), [
    dispatch,
  ]);
  const onInitializeCardPaymentData = useCallback(() => dispatch(initializeCardPaymentData()), [
    dispatch,
  ]);
  const onFetchTimeSlots = useCallback(
    (listingId, start, end, timeZone, options) =>
      dispatch(fetchTimeSlots(listingId, start, end, timeZone, options)),
    [dispatch]
  );

  return (
    <ListingPageAccessWrapper
      {...props}
      PageComponent={ListingPageComponent}
      isAuthenticated={isAuthenticated}
      currentUser={currentUser}
      getListing={getListing}
      getOwnListing={getOwnListing}
      scrollingDisabled={scrollingDisabled}
      inquiryModalOpenForListingId={inquiryModalOpenForListingId}
      showListingError={showListingError}
      reviews={reviews}
      fetchReviewsError={fetchReviewsError}
      monthlyTimeSlots={monthlyTimeSlots}
      timeSlotsForDate={timeSlotsForDate}
      lineItems={lineItems}
      fetchLineItemsInProgress={fetchLineItemsInProgress}
      fetchLineItemsError={fetchLineItemsError}
      sendInquiryInProgress={sendInquiryInProgress}
      sendInquiryError={sendInquiryError}
      onManageDisableScrolling={onManageDisableScrolling}
      callSetInitialValues={callSetInitialValues}
      onFetchTransactionLineItems={onFetchTransactionLineItems}
      onSendInquiry={onSendInquiry}
      onInitializeCardPaymentData={onInitializeCardPaymentData}
      onFetchTimeSlots={onFetchTimeSlots}
    />
  );
};

export default ListingPage;
