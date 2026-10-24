import { displayPrice, isPriceVariationsEnabled } from '../../util/configHelpers';
import { formatMoney } from '../../util/currency';
import { richText } from '../../util/richText';
import { isBookingProcessAlias } from '../../transactions/transaction';

import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTooltip: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTooltip: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

/**
 * Returns all translated and formatted strings for ListingCard so the
 * presentational component can stay simple and aria-labels use the same copy.
 *
 * @param {Object} listing - API entity: listing or ownListing
 * @param {Object} config - app configuration (e.g. from useConfiguration())
 * @param {Object} intl - React Intl instance (e.g. from useIntl())
 * @returns {Object} translations and derived values:
 *   - titlePlain: raw title string (for aria/alt)
 *   - titleFormatted: React nodes from richText(title) for display
 *   - showPrice: whether to show the price block
 *   - priceTooltip: string for the price element's title attribute (tooltip on hover)
 *   - priceMessage: string or null for the price block content (same translation as used in cardAriaLabel when shown)
 *   - cardAriaLabel: ready-to-use aria-label for the card link (listing title + price line when shown)
 *   - authorName: "ListingCard.author" string containing author's display name
 */
export const getListingCardTranslations = (listing, config, intl) => {
  const { title = '', price, publicData } = listing?.attributes || {};

  const authorDisplayName = listing?.author?.attributes?.profile?.displayName;
  const authorName = intl.formatMessage(
    { id: 'ListingCard.author' },
    { authorName: authorDisplayName }
  );

  const validListingTypes = config.listing.listingTypes || [];
  const { listingType } = publicData || {};
  const listingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);

  const showPrice = displayPrice(listingTypeConfig);
  const { formattedPrice, priceTooltip } = priceData(price, config.currency, intl);

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;
  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);

  const priceMessageId = hasMultiplePriceVariants
    ? 'ListingCard.priceStartingFrom'
    : 'ListingCard.price';

  const perUnitString = isBookable
    ? intl.formatMessage({ id: 'ListingCard.perUnit' }, { unitType: publicData?.unitType })
    : '';

  // Single formatted price line (amount + per-unit if applicable); used for both card aria and price block
  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? <span className={css.perUnit}>{perUnitString}</span> : '';
  const priceMessage =
    showPrice && formattedPrice != null
      ? intl.formatMessage({ id: priceMessageId }, { priceValue, pricePerUnit })
      : '';

  const cardAriaLabel =
    priceMessage.length > 0
      ? intl.formatMessage(
          { id: 'ListingCard.screenreader.label' },
          { listingTitle: title, formattedPrice: priceMessage }
        )
      : title;

  return {
    titlePlain: title,
    titleFormatted: richText(title, {
      longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
      longWordClass: css.longWord,
    }),
    authorName,
    showPrice,
    priceTooltip,
    priceMessage,
    cardAriaLabel,
  };
};

const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Words a brand name often carries in one place and drops in the other
// ("Banjaaran" vs "Banjaaran Studio", "Vilvah" vs "Vilvah Store").
const GENERIC_BRAND_SUFFIXES = ['studio', 'store', 'official', 'india'];

const brandNameVariants = brand => {
  const base = brand.trim().replace(/\s+/g, ' ');
  const variants = new Set([base]);
  const withoutThe = base.replace(/^the\s+/i, '');
  if (withoutThe) variants.add(withoutThe);
  [base, withoutThe].forEach(name => {
    const words = name.split(' ');
    const last = words[words.length - 1].toLowerCase();
    if (words.length > 1 && GENERIC_BRAND_SUFFIXES.includes(last)) {
      variants.add(words.slice(0, -1).join(' '));
    } else {
      GENERIC_BRAND_SUFFIXES.forEach(suffix => variants.add(`${name} ${suffix}`));
    }
  });
  // Longest first, so "Banjaaran Studio" is stripped whole rather than leaving "Banjaaran"
  return [...variants].sort((a, b) => b.length - a.length);
};

/**
 * Display-only: drops the brand name that ingested listing titles end with
 * ("Cotton Kurta in Yellow Ankid" -> "Cotton Kurta in Yellow"), since the card already
 * shows the brand. Case-insensitive, tolerates a leading "by" and partial names
 * ("Banjaaran" vs "Banjaaran Studio"). Returns the title unchanged when nothing matches
 * or when stripping would leave nothing.
 *
 * @param {string} title listing title
 * @param {string?} brand brand name (publicData.brand)
 * @returns {string}
 */
export const stripTrailingBrand = (title, brand) => {
  if (typeof title !== 'string' || typeof brand !== 'string' || !brand.trim()) return title;
  for (const variant of brandNameVariants(brand)) {
    const pattern = new RegExp(`[\\s,|·–—-]+(?:by\\s+)?${escapeRegExp(variant)}\\s*$`, 'i');
    if (pattern.test(title)) {
      const stripped = title.replace(pattern, '').trim();
      return stripped || title;
    }
  }
  return title;
};

const normalizeBrandName = name =>
  (name || '')
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]/g, '');

/**
 * True when two names refer to the same brand: equal ignoring case, spacing,
 * punctuation and a leading "The", or one is the start of the other
 * ("Banjaaran" / "Banjaaran Studio").
 */
export const isSameBrandName = (a, b) => {
  const na = normalizeBrandName(a);
  const nb = normalizeBrandName(b);
  if (!na || !nb) return false;
  return na === nb || na.startsWith(nb) || nb.startsWith(na);
};
