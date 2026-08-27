// ⚠️ If you modify the styling of this component and you're using the SectionListings component in your marketplace (featured listings)
// please reflect those changes in the calculateCarouselHeight function in SectionListing.js to avoid layout issues
import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  displayPrice,
  isPriceVariationsEnabled,
  requireListingImage,
} from '../../util/configHelpers';
import { formatMoney } from '../../util/currency';
import { useDisplayPrice } from '../../util/liveInrRate';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isMelaVerified } from '../../util/certificationHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';
import { getOccasionLabel } from '../../util/occasionLabels';

import {
  NamedLink,
  ListingCardThumbnail,
  ListingImage,
  SavedListingButton,
} from '../../components';

import { getListingCardTranslations } from './ListingCard.helpers';

import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

/**
 * TrustBadges
 * Component to render trust-building certification badges overlaid on the product image.
 * Purpose: Build credibility and reassure customers about safety and quality.
 * @param {Object} props
 * @param {Array<string>} props.certifications array of certification keys from publicData
 */
const TrustBadges = props => {
  const { certifications = [] } = props;

  if (!certifications || certifications.length === 0) {
    return null;
  }

  // Map certification values to display labels
  const certificationLabels = {
    gots_certified: 'GOTS',
    non_toxic_dyes: 'Non-toxic',
    bpa_free: 'BPA Free',
    ce_certified: 'CE',
    bis_approved: 'BIS',
  };

  // Show up to 2 most important certifications
  const topCertifications = certifications.slice(0, 2);

  return (
    <div className={css.trustBadges}>
      {topCertifications.map(cert => {
        const label = certificationLabels[cert] || cert;
        return (
          <span key={cert} className={css.badge}>
            {label}
          </span>
        );
      })}
    </div>
  );
};

/**
 * OccasionChips
 * Component to render occasion tags overlaid on the product image (gifting merchandising —
 * gifting-festival-traffic-prd.md Day 2 Phase 1). Opt-in via showOccasionChips: most search
 * surfaces don't want occasion tags cluttering the card, but GiftingPage/occasion pages do.
 * @param {Object} props
 * @param {string|Array<string>} props.occasion raw publicData.occasion — a listing tagged
 *   before the multi-enum search schema was set up stores this as a bare string rather than
 *   an array (see the same string-or-array handling in OccasionStrip, CategoryShowcase.js)
 */
const OccasionChips = props => {
  const { occasion } = props;
  const occasions = Array.isArray(occasion) ? occasion : occasion ? [occasion] : [];

  if (occasions.length === 0) {
    return null;
  }

  // Up to 2 chips — matches TrustBadges' cap, keeps the image overlay uncluttered.
  const topOccasions = occasions.slice(0, 2);

  return (
    <div className={css.occasionChips}>
      {topOccasions.map(slug => (
        <span key={slug} className={css.occasionChip}>
          {getOccasionLabel(slug)}
        </span>
      ))}
    </div>
  );
};

/**
 * ConversionBadges
 * Component to render conversion-focused badges that drive purchase decisions.
 * Purpose: Create urgency and social proof to increase conversions.
 * Displays one badge based on priority: bestseller > low stock > new arrival
 * @param {Object} props
 * @param {boolean} props.isBestseller whether product is a bestseller
 * @param {number} props.stockCount remaining stock count for urgency
 * @param {boolean} props.isNew whether product is newly listed
 */
const ConversionBadges = props => {
  const { isBestseller = false, stockCount = null, isNew = false } = props;

  // Priority order: bestseller > low stock > new arrival
  let badgeContent = null;
  let badgeClass = css.conversionBadge;

  if (isBestseller) {
    badgeContent = <FormattedMessage id="ListingCard.bestseller" />;
  } else if (stockCount !== null && stockCount <= 5 && stockCount > 0) {
    badgeContent = <FormattedMessage id="ListingCard.lowStock" values={{ count: stockCount }} />;
    badgeClass = classNames(css.conversionBadge, css.urgencyBadge);
  } else if (isNew) {
    badgeContent = <FormattedMessage id="ListingCard.newArrival" />;
  }

  if (!badgeContent) {
    return null;
  }

  return <div className={badgeClass}>{badgeContent}</div>;
};

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

const PriceMaybe = props => {
  const { price, publicData, config, intl, listingTypeConfig, showInrPrice = true } = props;
  // Hook must run unconditionally (before the early return below) per Rules of Hooks.
  // Renamed on destructure — `displayPrice` (imported from configHelpers, called below) would
  // otherwise be shadowed by the Money value this hook returns.
  const { displayPrice: computedDisplayPrice, formattedINRPrice: inrPriceForDisplay } = useDisplayPrice(
    price,
    publicData,
    intl
  );

  const showPrice = displayPrice(listingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;

  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(computedDisplayPrice, config.currency, intl);

  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? (
    <span className={css.perUnit}>
      <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
    </span>
  ) : (
    ''
  );

  const formattedINRPrice = formattedPrice && showInrPrice ? inrPriceForDisplay : null;

  return (
    <div className={css.price} title={priceTitle}>
      {hasMultiplePriceVariants ? (
        <FormattedMessage
          id="ListingCard.priceStartingFrom"
          values={{ priceValue, pricePerUnit }}
        />
      ) : (
        <FormattedMessage id="ListingCard.price" values={{ priceValue, pricePerUnit }} />
      )}
      {formattedINRPrice && (
        <span className={css.inrPrice}>
          <FormattedMessage id="ListingCard.inrEquivalent" values={{ inrPrice: formattedINRPrice }} />
        </span>
      )}
    </div>
  );
};

/**
 * Generate SEO-optimized alt text for listing images
 * Includes product title, age group, certifications for better search indexing
 * @param {string} title - Listing title
 * @param {Object} publicData - Listing publicData
 * @param {string} listingId - Listing UUID for debugging
 * @returns {string} SEO-optimized alt text
 */
const generateListingAltText = (title, publicData, listingId) => {
  const ageGroup = publicData.age_group || '';
  const certifications = publicData.certification || [];
  const hasGOTS = certifications.includes('gots_certified');

  const altTextParts = [title];
  if (ageGroup) {
    if (typeof ageGroup === 'string') {
      const ageLabel = ageGroup.replace(/_/g, '-');
      altTextParts.push(`for ${ageLabel}`);
    } else {
      console.warn('ListingCard: ageGroup is not a string', {
        listingId,
        ageGroup,
        ageGroupType: typeof ageGroup,
        publicData,
      });
    }
  }
  if (hasGOTS) {
    altTextParts.push('GOTS certified');
  }
  altTextParts.push('organic baby clothing');
  return altTextParts.join(' - ');
};

/**
 * ListingCardImage
 * Component responsible for rendering the image part of the listing card.
 * Uses shared ListingImage component with SEO-optimized alt text.
 * Falls back to ListingCardThumbnail if images are disabled for the listing type.
 * @component
 * @param {Object} props
 * @param {Object} props.listing listing entity with image data
 * @param {Function?} props.setActivePropsMaybe mouse enter/leave handlers for map highlighting
 * @param {string} props.title listing title for alt text
 * @param {string} props.renderSizes img/srcset size rules
 * @param {number} props.aspectWidth aspect ratio width
 * @param {number} props.aspectHeight aspect ratio height
 * @param {string} props.variantPrefix image variant prefix (e.g. "listing-card")
 * @param {boolean} props.showListingImage whether to show actual listing image or not
 * @param {Object?} props.style the background color for the listing card with no image
 * @returns {JSX.Element} listing image with fixed aspect ratio or fallback preview
 */
const ListingCardImage = props => {
  const {
    listing,
    setActivePropsMaybe,
    title,
    renderSizes,
    aspectWidth,
    aspectHeight,
    variantPrefix,
    aspectRatioClassName,
    lazyLoadImage,
  } = props;

  // Generate SEO-optimized alt text
  const publicData = listing.attributes?.publicData || {};
  const altText = generateListingAltText(title, publicData, listing.id?.uuid);

  // Render the listing image only if listing images are enabled in the listing type
  return (
    <ListingImage
      listing={listing}
      variant={variantPrefix}
      sizes={renderSizes}
      aspectWidth={aspectWidth}
      aspectHeight={aspectHeight}
      className={css.aspectRatioWrapper}
      rootClassName={css.rootForImage}
      alt={altText}
      onMouseEnter={setActivePropsMaybe?.onMouseEnter}
      onMouseLeave={setActivePropsMaybe?.onMouseLeave}
    />
  );
};

/**
 * ListingCard
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.aspectRatioClassName custom className for AspectRatioWrapper component
 * @param {Object} props.listing API entity: listing or ownListing
 * @param {string?} props.renderSizes for img/srcset
 * @param {Function?} props.setActiveListing
 * @param {boolean?} props.showAuthorInfo whether to display author name (default: true)
 * @param {boolean?} props.showTrustBadges whether to display certification badges (default: false)
 * @param {boolean?} props.showConversionBadges whether to display conversion badges (default: false)
 * @param {boolean?} props.showOccasionChips whether to display occasion tags (default: false)
 * @param {boolean?} props.isBestseller whether product is a bestseller (default: false)
 * @param {number?} props.stockCount remaining stock for urgency display (default: null)
 * @param {boolean?} props.isNew whether product is newly listed (default: false)
 * @param {boolean?} props.showInrPrice whether to show the "~₹" INR equivalent under the price (default: true)
 * @param {Function?} props.onShopNow when provided, renders a stock-aware "Shop on {brand} →" /
 *   "View on {brand} →" CTA for listings with brand + productUrl (used on SavedPage — see
 *   add-to-cart-restoration-prd.md §6). Called with { url, brandName, isVerified, isOutOfStock, trackingParams }.
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const ListingCard = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();

  const {
    className,
    rootClassName,
    aspectRatioClassName,
    darkMode,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo = true,
    showTrustBadges = false,
    showConversionBadges = false,
    showOccasionChips = false,
    isBestseller = false,
    stockCount = null,
    isNew = false,
    lazyLoadImage = true,
    showInrPrice = true,
    onShopNow,
  } = props;

  const translations = getListingCardTranslations(listing, config, intl);
  const {
    titlePlain,
    titleFormatted,
    cardAriaLabel,
    showPrice,
    priceTooltip,
    priceMessage,
    authorName,
  } = translations;

  const classes = classNames(rootClassName || css.root, className);

  const id = listing?.id?.uuid;
  const { title = '', price, publicData } = listing?.attributes || {};

  // P0.2: $0 promo SKUs (e.g. "Limited Edition FREE Bag") are excluded from every
  // public grid. A missing price (inquiry/negotiation listings) is a different,
  // legitimate case and is left alone — only an explicit $0 amount is hidden.
  if (price && price.amount === 0) {
    return null;
  }

  const slug = createSlug(title);

  const currentListing = ensureListing(listing);
  const author = ensureUser(listing.author);

  // Extract brand and certifications from publicData
  const brand = publicData?.brand || null;
  const productUrl = publicData?.productUrl || null;
  const certifications = publicData?.certification || [];

  // Stock-aware Shop CTA (SavedPage only — gated on onShopNow being passed).
  // Undefined/null currentStock means stock has never been set, treated as in-stock
  // (matches ProductOrderForm's hasNoStockLeft logic).
  const currentStockQty = currentListing.currentStock?.attributes?.quantity;
  const isOutOfStock = currentStockQty === 0;
  const showShopCta = !!onShopNow && !!brand && !!productUrl;

  const handleShopClick = e => {
    e.preventDefault();
    e.stopPropagation();
    onShopNow({
      url: productUrl,
      brandName: brand,
      isVerified: isMelaVerified(publicData),
      isOutOfStock,
      // Lets the caller (SavedPage) return keyboard focus to this exact button when
      // RedirectTrustSheet closes — see ListingCard.viewListingFallback docs and
      // add-to-cart-restoration-prd.md §13.1 fix #7 (WCAG 2.4.3).
      triggerElement: e.currentTarget,
      trackingParams: {
        brandName: brand,
        brandId: author?.id?.uuid,
        category: publicData.categoryLevel3 || publicData.categoryLevel2 || publicData.categoryLevel1,
        productId: id,
        // onShopNow is only ever wired up from SavedPage's per-card CTA — the group-level
        // CTA (SavedBrandGroup) tags 'saved_brand_group' itself. See §14 of
        // insights/crossshop-tracking-prd.md.
        savedSurface: 'saved_item_card',
      },
    });
  };

  const { listingType, cardStyle } = publicData || {};
  const validListingTypes = config.listing.listingTypes || [];
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  // Render the listing image only if listing images are enabled in the listing type
  const showListingImage = requireListingImage(foundListingTypeConfig);

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;

  // Sets the listing as active in the search map when hovered (if the search map is enabled)
  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(listing?.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  // Extract the first image URL for anon localStorage saves
  const firstImage = currentListing.images?.[0];
  const imageUrl = firstImage?.attributes?.variants?.['listing-card']?.url || '';
  const listingData = { title, imageUrl };

  return (
    <div className={classes}>
      {/* imageWrapper gives the save button a shared positioning parent with the image */}
      <div className={css.imageWrapper}>
        <NamedLink className={css.imageLink} name="ListingPage" params={{ id, slug }}>
          <div className={css.imageContainer}>
            {showListingImage ? (
              <ListingCardImage
                renderSizes={renderSizes}
                title={title}
                listing={listing}
                setActivePropsMaybe={setActivePropsMaybe}
                aspectWidth={aspectWidth}
                aspectHeight={aspectHeight}
                variantPrefix={variantPrefix}
                lazyLoadImage={lazyLoadImage}
              />
            ) : (
              <ListingCardThumbnail
                style={cardStyle}
                listingTitle={title}
                className={css.aspectRatioWrapper}
                width={aspectWidth}
                height={aspectHeight}
                setActivePropsMaybe={setActivePropsMaybe}
              />
            )}
            {showTrustBadges && <TrustBadges certifications={certifications} />}
            {showConversionBadges && (
              <ConversionBadges isBestseller={isBestseller} stockCount={stockCount} isNew={isNew} />
            )}
            {showOccasionChips && <OccasionChips occasion={publicData?.occasion} />}
          </div>
        </NamedLink>
        <SavedListingButton
          listingId={id}
          listingData={listingData}
          variant="icon"
          className={css.saveButton}
        />
      </div>
      <NamedLink className={css.infoLink} name="ListingPage" params={{ id, slug }}>
        <div className={css.info}>
          <PriceMaybe
            price={price}
            publicData={publicData}
            config={config}
            intl={intl}
            listingTypeConfig={foundListingTypeConfig}
            showInrPrice={showInrPrice}
          />
          <div className={css.mainInfo}>
            {showListingImage && (
              <div className={css.title}>
                {richText(title, {
                  longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                  longWordClass: css.longWord,
                })}
              </div>
            )}
            {publicData?.variantCount > 1 && (
              <div className={css.variantPill}>
                {publicData.variantCount} variants
              </div>
            )}
            {showAuthorInfo ? (
              <div className={css.authorInfo}>
                {brand && (
                  <div className={css.brandName}>
                    <FormattedMessage id="ListingCard.brand" values={{ brandName: brand }} />
                  </div>
                )}
                <div className={css.author}>
                  <FormattedMessage id="ListingCard.author" values={{ authorName }} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </NamedLink>
      {showShopCta ? (
        <button type="button" className={css.shopCta} onClick={handleShopClick}>
          <FormattedMessage
            id={isOutOfStock ? 'ListingCard.viewOnBrand' : 'ListingCard.shopOnBrand'}
            values={{ brand }}
          />
        </button>
      ) : onShopNow ? (
        // Card is rendered in a Shop-CTA context (SavedPage) but has no brand/productUrl
        // to route through — a defined fallback instead of an unexplained gap next to
        // cards that do have a Shop CTA (add-to-cart-restoration-prd.md §13.1 fix #9, P2).
        <NamedLink
          className={css.shopCtaFallback}
          name="ListingPage"
          params={{ id, slug }}
        >
          <FormattedMessage id="ListingCard.viewListingFallback" />
        </NamedLink>
      ) : null}
    </div>
  );
};

export default ListingCard;
