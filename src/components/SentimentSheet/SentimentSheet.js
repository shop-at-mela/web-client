/**
 * SentimentSheet
 *
 * A two-state bottom sheet for collecting shopper sentiment.
 *
 * State machine: hidden → collapsed → expanded → submitted → dismissed
 *
 * - Appears automatically after SHOW_DELAY_MS on any page (one-per-session).
 * - Collapsed: small strip with thumbs up / thumbs down only.
 * - Expanded: slides up to reveal a free-text prompt + submit/skip.
 * - Submitted: brief thank-you strip, auto-dismisses after THANK_YOU_DURATION_MS.
 *
 * Usage:
 *   <SentimentSheet />
 *
 * Requires REACT_APP_SENTIMENT_WEBHOOK_URL in environment.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useIntl } from '../../util/reactIntl';
import { shouldShowSentiment, markSentimentShown, postSentiment } from '../../util/sentimentCapture';

import css from './SentimentSheet.module.css';

const SHOW_DELAY_MS = 15_000;
const THANK_YOU_DURATION_MS = 2_500;

// State enum
const S = {
  HIDDEN: 'hidden',
  COLLAPSED: 'collapsed',
  EXPANDED: 'expanded',
  SUBMITTED: 'submitted',
  DISMISSED: 'dismissed',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SentimentSheet = () => {
  const intl = useIntl();
  const [state, setState] = useState(S.HIDDEN);
  const [thumbs, setThumbs] = useState(null); // 'up' | 'down'
  const [freeText, setFreeText] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const textareaRef = useRef(null);

  // Trigger after delay
  useEffect(() => {
    if (!shouldShowSentiment()) return;
    const t = setTimeout(() => {
      setState(S.COLLAPSED);
      markSentimentShown();
    }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss after thank-you
  useEffect(() => {
    if (state !== S.SUBMITTED) return;
    const t = setTimeout(() => setState(S.DISMISSED), THANK_YOU_DURATION_MS);
    return () => clearTimeout(t);
  }, [state]);

  // Focus textarea when expanded
  useEffect(() => {
    if (state === S.EXPANDED && textareaRef.current) {
      // Small delay to let the CSS transition start first
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [state]);

  const handleThumbs = (value) => {
    setThumbs(value);
    setState(S.EXPANDED);
    // Record the thumbs response immediately — free text is a bonus
    postSentiment({ event: 'general_sentiment', response: value });
  };

  const handleSubmit = () => {
    // Validate email only if the user typed something
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setEmailError(true);
      return;
    }
    postSentiment({
      event: 'general_sentiment_text',
      response: thumbs,
      freeText: freeText.trim() || null,
      email: email.trim() || null,
    });
    setState(S.SUBMITTED);
  };

  const handleSkip = () => setState(S.SUBMITTED);

  const handleDismiss = () => setState(S.DISMISSED);

  if (state === S.HIDDEN || state === S.DISMISSED) return null;

  const isExpanded = state === S.EXPANDED;
  const isSubmitted = state === S.SUBMITTED;

  const textPrompt = thumbs === 'up'
    ? intl.formatMessage({ id: 'SentimentSheet.promptThumbsUp' })
    : intl.formatMessage({ id: 'SentimentSheet.promptThumbsDown' });

  return (
    <div
      className={[
        css.sheet,
        isExpanded ? css.expanded : '',
        isSubmitted ? css.submitted : '',
      ].filter(Boolean).join(' ')}
      role="dialog"
      aria-label={intl.formatMessage({ id: 'SentimentSheet.ariaLabel' })}
    >
      {isSubmitted ? (
        <div className={css.thankYou}>
          🙏 {intl.formatMessage({ id: 'SentimentSheet.thankYou' })}
        </div>
      ) : (
        <>
          {/* ── Collapsed strip ── */}
          <div className={css.collapsedRow}>
            <span className={css.collapsedPrompt}>
              {intl.formatMessage({ id: 'SentimentSheet.prompt' })}
            </span>
            <div className={css.thumbsRow}>
              <button
                className={[css.thumbBtn, thumbs === 'up' ? css.thumbSelected : ''].filter(Boolean).join(' ')}
                onClick={() => handleThumbs('up')}
                aria-label={intl.formatMessage({ id: 'SentimentSheet.thumbsUp' })}
                aria-pressed={thumbs === 'up'}
              >
                👍
              </button>
              <button
                className={[css.thumbBtn, thumbs === 'down' ? css.thumbSelected : ''].filter(Boolean).join(' ')}
                onClick={() => handleThumbs('down')}
                aria-label={intl.formatMessage({ id: 'SentimentSheet.thumbsDown' })}
                aria-pressed={thumbs === 'down'}
              >
                👎
              </button>
              <button
                className={css.dismissBtn}
                onClick={handleDismiss}
                aria-label={intl.formatMessage({ id: 'SentimentSheet.dismiss' })}
              >
                ×
              </button>
            </div>
          </div>

          {/* ── Expanded content ── */}
          {isExpanded && (
            <div className={css.expandedContent}>
              <p className={css.textPrompt}>{textPrompt}</p>
              <textarea
                ref={textareaRef}
                className={css.textarea}
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                placeholder={intl.formatMessage({ id: 'SentimentSheet.textareaPlaceholder' })}
                rows={3}
                maxLength={500}
              />
              <div className={css.emailField}>
                <label className={css.emailLabel} htmlFor="sentiment-email">
                  {intl.formatMessage({ id: 'SentimentSheet.emailLabel' })}
                </label>
                <input
                  id="sentiment-email"
                  type="email"
                  className={[css.emailInput, emailError ? css.emailInputError : ''].filter(Boolean).join(' ')}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(false); }}
                  placeholder={intl.formatMessage({ id: 'SentimentSheet.emailPlaceholder' })}
                  autoComplete="email"
                />
                {emailError && (
                  <span className={css.emailErrorMsg}>
                    {intl.formatMessage({ id: 'SentimentSheet.emailError' })}
                  </span>
                )}
              </div>
              <div className={css.actions}>
                <button className={css.submitBtn} onClick={handleSubmit}>
                  {intl.formatMessage({ id: 'SentimentSheet.submit' })}
                </button>
                <button className={css.skipBtn} onClick={handleSkip}>
                  {intl.formatMessage({ id: 'SentimentSheet.skip' })} →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SentimentSheet;
