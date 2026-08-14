import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

import { FormattedMessage } from '../../util/reactIntl';
import { selectSavedItemsCount } from '../../ducks/savedListings.duck';
import { AUTO_DISMISS_MS } from '../SavedItemsBanner/SavedItemsBanner';
import NamedLink from '../NamedLink/NamedLink';

import css from './AddToCartConfirmation.module.css';

/**
 * AddToCartConfirmation
 *
 * Inline "✓ Added · View Saved (n) →" confirmation shown under the PDP's Add to Cart
 * CTA, for both authenticated and anonymous shoppers (add-to-cart-restoration-prd.md
 * §12 — before this fix, anon shoppers got zero feedback after clicking Add to Cart).
 *
 * Controlled by the parent via the `trigger` prop: bump it (e.g. an incrementing
 * counter) each time SavedListingButton's onAdded fires. Any change to `trigger` shows
 * the confirmation and (re)starts the auto-dismiss timer — same pattern as
 * SavedItemsBanner resetting its timer on each new save.
 *
 * @param {Object} props
 * @param {number} props.trigger bump this value to (re)show the confirmation
 * -- injected by connect --
 * @param {number} props.savedItemsCount
 */
const AddToCartConfirmationComponent = props => {
  const { trigger, savedItemsCount } = props;
  const [visible, setVisible] = useState(false);
  const prevTriggerRef = useRef(trigger);
  const timerRef = useRef(null);

  useEffect(() => {
    if (trigger !== prevTriggerRef.current) {
      prevTriggerRef.current = trigger;
      setVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trigger]);

  if (!visible) {
    return null;
  }

  return (
    <p className={css.root} role="status" aria-live="polite">
      <span className={css.checkmark} aria-hidden="true">
        ✓
      </span>{' '}
      <FormattedMessage id="AddToCartConfirmation.added" />
      {' · '}
      <NamedLink
        name="SavedPage"
        to={{ search: 'entry=add_to_cart_confirmation' }}
        className={css.link}
      >
        <FormattedMessage id="AddToCartConfirmation.viewSaved" values={{ count: savedItemsCount }} />
      </NamedLink>
    </p>
  );
};

const mapStateToProps = state => ({
  savedItemsCount: selectSavedItemsCount(state),
});

const AddToCartConfirmation = connect(mapStateToProps)(AddToCartConfirmationComponent);

export default AddToCartConfirmation;
