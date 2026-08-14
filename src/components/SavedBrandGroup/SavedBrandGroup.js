import React from 'react';
import Decimal from 'decimal.js';
import { string, func, arrayOf, object } from 'prop-types';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { ensureListing } from '../../util/data';
import { isMelaVerified } from '../../util/certificationHelpers';
import { types as sdkTypes } from '../../util/sdkLoader';
import { ListingCard } from '../../components';

import css from './SavedBrandGroup.module.css';

const { Money } = sdkTypes;

/**
 * SavedBrandGroup — one brand's section within the /saved multi-brand cart
 * (add-to-cart-restoration-prd.md §14). `brandName` is null for the trailing
 * "More saved" group (listings with no publicData.brand).
 *
 * The group's own "Shop {brand} →" CTA reuses the same onShopNow → RedirectTrustSheet →
 * openBrandStorefront pipeline as each card's own CTA — SavedPage owns that state
 * machine, this component just calls it with group-level tracking params
 * (saved_surface: 'saved_brand_group', see insights/crossshop-tracking-prd.md §14).
 */

const isOutOfStock = listing => {
  const currentStockQty = ensureListing(listing).currentStock?.attributes?.quantity;
  return currentStockQty === 0;
};

// A group's subtotal is only ever shown when it's unambiguous — every item priced,
// all in the same currency. Mixed or missing prices fall back to count-only (no invented total).
const computeSubtotal = listings => {
  const prices = listings.map(listing => listing.attributes?.price).filter(Boolean);
  if (prices.length === 0 || prices.length !== listings.length) return null;

  const currency = prices[0].currency;
  const sameCurrency = prices.every(price => price.currency === currency);
  if (!sameCurrency) return null;

  const amount = prices.reduce((total, price) => total.plus(price.amount), new Decimal(0));
  return new Money(amount, currency);
};

// First in-stock item with brand + productUrl — the group CTA's redirect target.
// There is no brand-storefront root URL in publicData, only per-product productUrl
// (see ListingCard.js), so the group CTA lands on a representative product.
const firstShoppableListing = listings =>
  listings.find(listing => {
    const publicData = listing.attributes?.publicData || {};
    return !!publicData.brand && !!publicData.productUrl && !isOutOfStock(listing);
  });

const SavedBrandGroup = ({ brandName, listings, onShopNow, renderSizes }) => {
  const intl = useIntl();

  const subtotal = computeSubtotal(listings);
  const shoppableListing = brandName ? firstShoppableListing(listings) : null;

  const handleGroupShopClick = e => {
    if (!shoppableListing) return;
    const publicData = shoppableListing.attributes?.publicData || {};
    onShopNow({
      url: publicData.productUrl,
      brandName,
      isVerified: isMelaVerified(publicData),
      isOutOfStock: false,
      triggerElement: e.currentTarget,
      trackingParams: {
        brandName,
        brandId: shoppableListing.author?.id?.uuid,
        category:
          publicData.categoryLevel3 || publicData.categoryLevel2 || publicData.categoryLevel1,
        productId: shoppableListing.id.uuid,
        savedSurface: 'saved_brand_group',
      },
    });
  };

  const headingText = brandName || intl.formatMessage({ id: 'SavedBrandGroup.moreSaved' });

  return (
    <section className={css.root} aria-label={headingText}>
      <div className={css.header}>
        <div className={css.headingRow}>
          <h2 className={css.heading}>{headingText}</h2>
          <span className={css.count}>
            <FormattedMessage id="SavedBrandGroup.itemCount" values={{ count: listings.length }} />
          </span>
          {subtotal && <span className={css.subtotal}>{formatMoney(intl, subtotal)}</span>}
        </div>
        {shoppableListing && (
          <button
            type="button"
            className={css.shopCta}
            data-testid="saved-brand-group-shop-cta"
            onClick={handleGroupShopClick}
          >
            <FormattedMessage id="SavedBrandGroup.shopBrandCta" values={{ brandName }} />
          </button>
        )}
      </div>
      <div className={css.grid}>
        {listings.map(listing => (
          <ListingCard
            key={listing.id.uuid}
            listing={listing}
            renderSizes={renderSizes}
            showAuthorInfo
            showTrustBadges
            onShopNow={onShopNow}
          />
        ))}
      </div>
    </section>
  );
};

SavedBrandGroup.propTypes = {
  brandName: string,
  listings: arrayOf(object).isRequired,
  onShopNow: func.isRequired,
  renderSizes: string,
};

export default SavedBrandGroup;
