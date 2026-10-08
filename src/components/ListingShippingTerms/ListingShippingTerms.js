/**
 * ListingShippingTerms
 *
 * The grey lines under the price on a product page (PRD international-shipping-transparency
 * P1.2). One component for both places it renders, so desktop and mobile cannot drift:
 *   - desktop: inside OrderPanel's price block (variant "desktop")
 *   - mobile: a new in-page block under the H1 in ListingPageCarousel (variant "mobile")
 *
 * Order: price (rendered by the host), shipping and duties line, estimate line. At most two
 * logical lines. Every sentence is built from the brand's own structured data in
 * util/brandShipping.js. Renders nothing while the author profile has no publicData (still
 * loading), so the neutral "no data" copy never flashes before the data arrives.
 *
 * A DDP brand whose duties are in its prices shows a "Duties included" chip in
 * ListingTrustChips. On mobile that chip sits right above this block, so only the desktop
 * variant also ends its line with "Duties included." (the chip is far from the price there).
 *
 * Usage:
 *   <ListingShippingTerms
 *     loaded={!!author?.attributes?.profile?.publicData}
 *     usShipping={getBrandUsShipping(author)}
 *     brand="Nicobar"
 *     inrPrice="₹3,600"
 *     variant="desktop"
 *   />
 */

import React from 'react';
import { oneOf, object, string, bool } from 'prop-types';
import { useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { useDisplayPrice } from '../../util/liveInrRate';
import { getDutiesTooltip, getShippingTerms } from '../../util/brandShipping';

import InfoTooltip from '../InfoTooltip/InfoTooltip';

import css from './ListingShippingTerms.module.css';

const formatPrice = (price, intl) => {
  try {
    return formatMoney(intl, price);
  } catch (e) {
    return `(${price.currency})`;
  }
};

const ListingShippingTerms = props => {
  const { loaded, usShipping, brand, inrPrice, variant = 'mobile', className } = props;
  const intl = useIntl();

  if (!loaded) return null;

  const brandName = brand || intl.formatMessage({ id: 'BrandShipping.brandFallback' });
  const terms = getShippingTerms(usShipping, brandName, intl);
  const showDutiesIncludedText = variant === 'desktop' && terms.dutiesState === 'ddp_in_price';
  const dutiesTooltip = getDutiesTooltip(terms.dutiesState, brandName, intl);
  // Tooltips: the DDU sentence and the desktop "Duties included." both explain duties.
  const showDutiesTooltip =
    !!dutiesTooltip && (terms.dutiesState === 'ddu' || showDutiesIncludedText);

  return (
    <div className={[css.root, className].filter(Boolean).join(' ')}>
      <p className={css.line}>
        {terms.text}
        {showDutiesIncludedText ? (
          <> {intl.formatMessage({ id: 'BrandShipping.dutiesIncluded' })}</>
        ) : null}
        {showDutiesTooltip ? (
          <>
            {' '}
            <InfoTooltip label={intl.formatMessage({ id: 'BrandShipping.tooltipLabelDuties' })}>
              {dutiesTooltip}
            </InfoTooltip>
          </>
        ) : null}
      </p>
      {inrPrice ? (
        <p className={css.line}>
          {intl.formatMessage({ id: 'BrandShipping.estimateLine' }, { inrPrice })}{' '}
          <InfoTooltip label={intl.formatMessage({ id: 'BrandShipping.tooltipLabelEstimate' })}>
            {intl.formatMessage({ id: 'BrandShipping.tooltipEstimate' }, { brand: brandName })}
          </InfoTooltip>
        </p>
      ) : null}
    </div>
  );
};

ListingShippingTerms.propTypes = {
  loaded: bool.isRequired,
  usShipping: object,
  brand: string,
  inrPrice: string,
  variant: oneOf(['desktop', 'mobile']),
  className: string,
};

/**
 * Mobile block under the H1: the USD price, then the shared shipping lines.
 * The price is the same converted display price OrderPanel shows on desktop.
 */
export const ListingPriceAndShippingTerms = props => {
  const { price, publicData, loaded, usShipping, brand, className } = props;
  const intl = useIntl();
  const { displayPrice, formattedINRPrice } = useDisplayPrice(price, publicData, intl);

  if (!loaded) return null;

  return (
    <div className={[css.mobileBlock, className].filter(Boolean).join(' ')}>
      {displayPrice ? <p className={css.price}>{formatPrice(displayPrice, intl)}</p> : null}
      <ListingShippingTerms
        loaded={loaded}
        usShipping={usShipping}
        brand={brand}
        inrPrice={formattedINRPrice}
        variant="mobile"
      />
    </div>
  );
};

ListingPriceAndShippingTerms.propTypes = {
  price: object,
  publicData: object,
  loaded: bool.isRequired,
  usShipping: object,
  brand: string,
  className: string,
};

export default ListingShippingTerms;
