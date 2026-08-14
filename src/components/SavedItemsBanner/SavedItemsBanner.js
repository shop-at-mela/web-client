import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import { FormattedMessage } from '../../util/reactIntl';
import { selectAnonSavedItems, selectLastToggleSource } from '../../ducks/savedListings.duck';
import NamedLink from '../NamedLink/NamedLink';

import css from './SavedItemsBanner.module.css';

// Exported so AddToCartConfirmation can reuse the same auto-dismiss timing rather than
// hand-rolling its own value (add-to-cart-restoration-prd.md §12.3 build note).
export const AUTO_DISMISS_MS = 4000;

/**
 * SavedItemsBanner
 *
 * Fixed-position bottom toast for unauthenticated users who save items.
 * Appears immediately in the current viewport when the first item is saved —
 * no scrolling required. Auto-dismisses after 4s. Resets timer on each new save.
 * Can be manually dismissed.
 *
 * Stays hidden for authenticated users (they have full save functionality).
 *
 * Also stays hidden when the triggering save came from the PDP's Add-to-Cart button —
 * that flow already routes the shopper through /saved, so a second sign-up nudge in
 * the same moment would feel naggy (add-to-cart-restoration-prd.md §6 edge cases).
 */
const SavedItemsBannerComponent = props => {
  const { isAuthenticated, anonSavedItems, lastToggleSource } = props;
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef(null);
  const prevCountRef = useRef(0);

  const count = anonSavedItems.length;

  useEffect(() => {
    // Show toast whenever the count increases (new item saved), unless this save
    // came from the Add-to-Cart button.
    if (
      !isAuthenticated &&
      !dismissed &&
      count > prevCountRef.current &&
      lastToggleSource !== 'add_to_cart_button'
    ) {
      setVisible(true);

      // Reset auto-dismiss timer on each new save
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, AUTO_DISMISS_MS);
    }
    prevCountRef.current = count;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [count, isAuthenticated, dismissed, lastToggleSource]);

  if (isAuthenticated || dismissed || count === 0 || !visible) {
    return null;
  }

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className={css.root} role="status" aria-live="polite">
      <span className={css.heart} aria-hidden="true">❤</span>
      <p className={css.message}>
        <FormattedMessage
          id="SavedItemsBanner.message"
          values={{
            count,
            signUpLink: (
              <NamedLink name="SignupPage" className={css.signUpLink}>
                <FormattedMessage id="SavedItemsBanner.signUpLink" />
              </NamedLink>
            ),
          }}
        />
      </p>
      <button
        type="button"
        className={css.dismissButton}
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  anonSavedItems: selectAnonSavedItems(state),
  lastToggleSource: selectLastToggleSource(state),
});

const SavedItemsBanner = connect(mapStateToProps)(SavedItemsBannerComponent);

export default SavedItemsBanner;
