import React from 'react';
import { string, func, bool } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { ensureListing } from '../../util/data';
import { createSlug } from '../../util/urlHelpers';
import { NamedLink } from '../../components';
import { ListingImage } from '../ListingImage/ListingImage';

import css from './ListingCardMini.module.css';

/**
 * Compact listing card for brand showcase grids
 * Reuses ListingImage primitive but with simplified layout optimized for 2x2 grids
 *
 * @param {Object} props
 * @param {Object} props.listing - Listing entity
 * @param {Function} props.onFavorite - Callback when favorite button clicked
 * @param {boolean} props.showFavorite - Whether to show favorite button (default: true)
 * @param {string} props.className - Additional CSS class
 */
export const ListingCardMini = props => {
  const { listing, onFavorite, showFavorite = true, className = null } = props;

  const intl = useIntl();
  const currentListing = ensureListing(listing);
  const { id, attributes } = currentListing;
  const { title, price } = attributes;
  const slug = createSlug(title);

  const classes = classNames(css.root, className);

  const handleFavoriteClick = e => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(id.uuid);
    }
  };

  // Format price
  const formattedPrice = price ? formatMoney(intl, price) : null;

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id: id.uuid, slug }}>
      <div className={css.imageWrapper}>
        <ListingImage
          listing={currentListing}
          variant="square-small"
          sizes="145px"
          aspectWidth={1}
          aspectHeight={1}
          className={css.image}
        />
        {showFavorite && (
          <button
            className={css.favoriteButton}
            onClick={handleFavoriteClick}
            aria-label="Add to favorites"
            type="button"
          >
            ♡
          </button>
        )}
      </div>

      {formattedPrice && <div className={css.priceWrapper}>{formattedPrice}</div>}
    </NamedLink>
  );
};

ListingCardMini.propTypes = {
  listing: func.isRequired,
  onFavorite: func,
  showFavorite: bool,
  className: string,
};

export default ListingCardMini;
