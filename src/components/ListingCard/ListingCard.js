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
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import {
  NamedLink,
  ListingCardThumbnail,
  ListingImage,
} from '../../components';

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
  const { price, publicData, config, intl, listingTypeConfig } = props;
  const showPrice = displayPrice(listingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;

  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);

  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? (
    <span className={css.perUnit}>
      <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
    </span>
  ) : (
    ''
  );

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
 * @param {Object} props.currentListing listing entity with image data
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
    currentListing,
    setActivePropsMaybe,
    title,
    renderSizes,
    aspectWidth,
    aspectHeight,
    variantPrefix,
    showListingImage,
    style,
  } = props;

  // Generate SEO-optimized alt text
  const publicData = currentListing.attributes?.publicData || {};
  const altText = generateListingAltText(title, publicData, currentListing.id?.uuid);

  // Render the listing image only if listing images are enabled in the listing type
  return showListingImage ? (
    <ListingImage
      listing={currentListing}
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
  ) : (
    <ListingCardThumbnail
      style={style}
      listingTitle={title}
      className={css.aspectRatioWrapper}
      width={aspectWidth}
      height={aspectHeight}
      setActivePropsMaybe={setActivePropsMaybe}
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
 * @param {Object} props.listing API entity: listing or ownListing
 * @param {string?} props.renderSizes for img/srcset
 * @param {Function?} props.setActiveListing
 * @param {boolean?} props.showAuthorInfo whether to display author name (default: true)
 * @param {boolean?} props.showTrustBadges whether to display certification badges (default: false)
 * @param {boolean?} props.showConversionBadges whether to display conversion badges (default: false)
 * @param {boolean?} props.isBestseller whether product is a bestseller (default: false)
 * @param {number?} props.stockCount remaining stock for urgency display (default: null)
 * @param {boolean?} props.isNew whether product is newly listed (default: false)
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const ListingCard = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();

  const {
    className,
    rootClassName,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo = true,
    showTrustBadges = false,
    showConversionBadges = false,
    isBestseller = false,
    stockCount = null,
    isNew = false,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price, publicData } = currentListing.attributes;
  const slug = createSlug(title);

  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;

  // Extract brand and certifications from publicData
  const brand = publicData?.brand || null;
  const certifications = publicData?.certification || [];

  const { listingType, cardStyle } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showListingImage = requireListingImage(foundListingTypeConfig);

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;

  // Sets the listing as active in the search map when hovered (if the search map is enabled)
  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      <div className={css.imageContainer}>
        <ListingCardImage
          renderSizes={renderSizes}
          title={title}
          currentListing={currentListing}
          config={config}
          setActivePropsMaybe={setActivePropsMaybe}
          aspectWidth={aspectWidth}
          aspectHeight={aspectHeight}
          variantPrefix={variantPrefix}
          style={cardStyle}
          showListingImage={showListingImage}
        />
        {showTrustBadges && <TrustBadges certifications={certifications} />}
        {showConversionBadges && (
          <ConversionBadges isBestseller={isBestseller} stockCount={stockCount} isNew={isNew} />
        )}
      </div>
      <div className={css.info}>
        <PriceMaybe
          price={price}
          publicData={publicData}
          config={config}
          intl={intl}
          listingTypeConfig={foundListingTypeConfig}
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
  );
};

export default ListingCard;
