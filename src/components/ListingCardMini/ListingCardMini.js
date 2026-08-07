import React from 'react';
import { string, bool, object } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { useDisplayPrice } from '../../util/liveInrRate';
import { ensureListing } from '../../util/data';
import { createSlug } from '../../util/urlHelpers';
import { NamedLink } from '../../components';
import { ListingImage } from '../ListingImage/ListingImage';
import SavedListingButton from '../SavedListingButton/SavedListingButton';

import css from './ListingCardMini.module.css';

/**
 * Compact listing card for brand showcase grids.
 * Reuses ListingImage primitive but with simplified layout optimized for 2x2 grids.
 *
 * @param {Object} props
 * @param {Object} props.listing - Listing entity
 * @param {boolean} props.showSave - Whether to show save button (default: true)
 * @param {boolean} props.showPrice - Whether to show the price row (default: false).
 *                                    Opt in explicitly where price chrome is wanted;
 *                                    these compact grids default to price-free.
 * @param {string} props.className - Additional CSS class
 */
export const ListingCardMini = props => {
  const { listing, showSave = true, showPrice = false, className = null } = props;

  const intl = useIntl();
  const currentListing = ensureListing(listing);
  const { id, attributes } = currentListing;
  const { title, price, publicData } = attributes;
  const slug = createSlug(title);

  const classes = classNames(css.root, className);

  // Format price
  const { displayPrice, formattedINRPrice } = useDisplayPrice(price, publicData, intl);
  const formattedPrice = displayPrice ? formatMoney(intl, displayPrice) : null;

  const firstImage = currentListing.images?.[0];
  const imageUrl = firstImage?.attributes?.variants?.['square-small']?.url || '';
  const listingData = { title, imageUrl };

  return (
    <div className={classes}>
      <NamedLink className={css.imageLink} name="ListingPage" params={{ id: id.uuid, slug }}>
        <div className={css.imageWrapper}>
          <ListingImage
            listing={currentListing}
            variant="square-small"
            sizes="145px"
            aspectWidth={1}
            aspectHeight={1}
            rootClassName={css.image}
          />
        </div>
        {showPrice && formattedPrice && (
          <div className={css.priceWrapper}>
            <span className={css.usdPrice}>{formattedPrice}</span>
            <span
              className={css.inrPrice}
              aria-hidden={!formattedINRPrice}
              style={formattedINRPrice ? undefined : { visibility: 'hidden' }}
            >
              {formattedINRPrice ? `~${formattedINRPrice}` : ' '}
            </span>
          </div>
        )}
      </NamedLink>
      {showSave && (
        <SavedListingButton
          listingId={id.uuid}
          listingData={listingData}
          variant="icon"
          className={css.saveButton}
        />
      )}
    </div>
  );
};

ListingCardMini.propTypes = {
  listing: object.isRequired,
  showSave: bool,
  showPrice: bool,
  className: string,
};

export default ListingCardMini;
