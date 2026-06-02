/**
 * RedirectTrustSheet
 *
 * Combined pre-redirect trust context + sentiment collection.
 * Shown the first time per session when a shopper clicks the "Shop on [Brand]" CTA.
 *
 * State machine: hidden → open → expanded (on thumbs) → submitted
 * "Continue to [Brand] →" button is always visible throughout all states.
 *
 * Usage:
 *   <RedirectTrustSheet
 *     isOpen={redirectSheetOpen}
 *     brandName="Aagghhoo"
 *     productUrl="https://..."
 *     isVerified={true}
 *     onContinue={url => window.open(url, '_blank', 'noopener,noreferrer')}
 *     onClose={() => setRedirectSheetOpen(false)}
 *   />
 */

import React, { useState, useEffect, useRef } from 'react';
import { bool, func, string } from 'prop-types';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { postSentiment } from '../../util/sentimentCapture';

import css from './RedirectTrustSheet.module.css';

const S = {
  OPEN: 'open',
  EXPANDED: 'expanded',
  SUBMITTED: 'submitted',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RedirectTrustSheet = ({ isOpen, brandName, productUrl, isVerified, onContinue, onClose }) => {
  const intl = useIntl();
  const [state, setState] = useState(S.OPEN);
  const [thumbs, setThumbs] = useState(null);
  const [freeText, setFreeText] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const textareaRef = useRef(null);

  // Reset internal state each time the sheet opens
  useEffect(() => {
    if (isOpen) {
      setState(S.OPEN);
      setThumbs(null);
      setFreeText('');
      setEmail('');
      setEmailError(false);
    }
  }, [isOpen]);

  // Focus textarea when expanded
  useEffect(() => {
    if (state === S.EXPANDED && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [state]);

  if (!isOpen) return null;

  const isExpanded = state === S.EXPANDED;
  const isSubmitted = state === S.SUBMITTED;

  const handleThumbs = value => {
    setThumbs(value);
    setState(S.EXPANDED);
    postSentiment({ event: 'pre_shopify_redirect', response: value, brand: brandName, productUrl });
  };

  const handleSubmitSentiment = () => {
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setEmailError(true);
      return;
    }
    postSentiment({
      event: 'pre_shopify_redirect_text',
      response: thumbs,
      freeText: freeText.trim() || null,
      email: email.trim() || null,
      brand: brandName,
      productUrl,
    });
    setState(S.SUBMITTED);
  };

  const handleSkipSentiment = () => setState(S.SUBMITTED);

  const handleContinue = () => {
    onContinue(productUrl);
    onClose();
  };

  const textPrompt =
    thumbs === 'up'
      ? intl.formatMessage({ id: 'RedirectTrustSheet.promptThumbsUp' })
      : intl.formatMessage({ id: 'RedirectTrustSheet.promptThumbsDown' });

  return (
    <>
      <div className={css.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={[css.sheet, isExpanded ? css.expanded : ''].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={intl.formatMessage({ id: 'RedirectTrustSheet.ariaLabel' })}
      >
        <div className={css.handle} />

        {/* ── Trust context ── */}
        <div className={css.trustSection}>
          <div className={css.trustHeading}>
            {isVerified ? '✅' : '🛍️'}{' '}
            <FormattedMessage
              id="RedirectTrustSheet.heading"
              values={{ brand: <strong>{brandName}</strong> }}
            />
          </div>
          <ul className={css.trustList}>
            <li>🔒 {intl.formatMessage({ id: 'RedirectTrustSheet.trustCheckout' })}</li>
            <li>🇺🇸 {intl.formatMessage({ id: 'RedirectTrustSheet.trustShipping' })}</li>
            <li>↩️ {intl.formatMessage({ id: 'RedirectTrustSheet.trustReturns' }, { brand: brandName })}</li>
          </ul>
        </div>

        <div className={css.divider} />

        {/* ── Sentiment ── */}
        {!isSubmitted ? (
          <>
            <div className={css.sentimentRow}>
              <span className={css.sentimentPrompt}>
                {intl.formatMessage({ id: 'RedirectTrustSheet.sentimentPrompt' })}
              </span>
              <div className={css.thumbsRow}>
                <button
                  className={[css.thumbBtn, thumbs === 'up' ? css.thumbSelected : ''].filter(Boolean).join(' ')}
                  onClick={() => handleThumbs('up')}
                  aria-label={intl.formatMessage({ id: 'RedirectTrustSheet.thumbsUp' })}
                  aria-pressed={thumbs === 'up'}
                >
                  👍
                </button>
                <button
                  className={[css.thumbBtn, thumbs === 'down' ? css.thumbSelected : ''].filter(Boolean).join(' ')}
                  onClick={() => handleThumbs('down')}
                  aria-label={intl.formatMessage({ id: 'RedirectTrustSheet.thumbsDown' })}
                  aria-pressed={thumbs === 'down'}
                >
                  👎
                </button>
              </div>
            </div>

            {/* ── Expanded: free-text ── */}
            {isExpanded && (
              <div className={css.expandedContent}>
                <p className={css.textPrompt}>{textPrompt}</p>
                <textarea
                  ref={textareaRef}
                  className={css.textarea}
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder={intl.formatMessage({ id: 'RedirectTrustSheet.textareaPlaceholder' })}
                  rows={3}
                  maxLength={500}
                />
                <div className={css.emailField}>
                  <label className={css.emailLabel} htmlFor="redirect-trust-email">
                    {intl.formatMessage({ id: 'RedirectTrustSheet.emailLabel' })}
                  </label>
                  <input
                    id="redirect-trust-email"
                    type="email"
                    className={[css.emailInput, emailError ? css.emailInputError : ''].filter(Boolean).join(' ')}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(false); }}
                    placeholder={intl.formatMessage({ id: 'RedirectTrustSheet.emailPlaceholder' })}
                    autoComplete="email"
                  />
                  {emailError && (
                    <span className={css.emailErrorMsg}>
                      {intl.formatMessage({ id: 'RedirectTrustSheet.emailError' })}
                    </span>
                  )}
                </div>
                <div className={css.sentimentActions}>
                  <button className={css.submitBtn} onClick={handleSubmitSentiment}>
                    {intl.formatMessage({ id: 'RedirectTrustSheet.submit' })}
                  </button>
                  <button className={css.skipBtn} onClick={handleSkipSentiment}>
                    {intl.formatMessage({ id: 'RedirectTrustSheet.skip' })} →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={css.thankYou}>
            🙏 {intl.formatMessage({ id: 'RedirectTrustSheet.thankYou' })}
          </div>
        )}

        <div className={css.divider} />

        {/* ── Continue button — always visible ── */}
        <div className={css.ctaRow}>
          <button className={css.continueBtn} onClick={handleContinue}>
            {intl.formatMessage({ id: 'RedirectTrustSheet.continue' }, { brand: brandName })}
          </button>
          <button className={css.dismissBtn} onClick={onClose} aria-label={intl.formatMessage({ id: isExpanded ? 'RedirectTrustSheet.dismissLabelExpanded' : 'RedirectTrustSheet.dismissLabel' })}>
            {intl.formatMessage({ id: isExpanded ? 'RedirectTrustSheet.dismissLabelExpanded' : 'RedirectTrustSheet.dismissLabel' })}
          </button>
        </div>
      </div>
    </>
  );
};

RedirectTrustSheet.propTypes = {
  isOpen: bool.isRequired,
  brandName: string.isRequired,
  productUrl: string.isRequired,
  isVerified: bool,
  onContinue: func.isRequired,
  onClose: func.isRequired,
};

export default RedirectTrustSheet;
