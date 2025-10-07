import React, { useState } from 'react';
import { H1, H3, Button, NamedLink } from '../../../../components';
import css from './Hero.module.css';

const Hero = ({ onFormClick, clothingFormUrl, waitlistFormUrl }) => {
  const [showWaitlist, setShowWaitlist] = useState(false);

  const handleFormClick = (formUrl, formType) => {
    if (onFormClick) {
      onFormClick(formUrl, formType);
    }
  };

  return (
    <section className={css.hero}>
      <div className={css.container}>
        {/* Mobile-first badge */}
        <div className={css.badge}>
          🚀 Founding Partners Program
        </div>

        {/* Clear, mobile-friendly headline */}
        <H1 className={css.headline}>
          Sell Your Indian Baby Products in the USA
        </H1>

        {/* Simple value proposition */}
        <div className={css.valueProps}>
          <div className={css.valueProp}>
            <span className={css.icon}>✨</span>
            <span>Zero listing fees</span>
          </div>
          <div className={css.valueProp}>
            <span className={css.icon}>🎯</span>
            <span>Ready US customers</span>
          </div>
          <div className={css.valueProp}>
            <span className={css.icon}>📈</span>
            <span>Performance-based</span>
          </div>
        </div>

        {/* Mobile-optimized description */}
        <p className={css.description}>
          Join Mela's founding partnership program. We connect Indian baby clothing brands
          with diaspora families in the USA. No upfront costs, only success fees.
        </p>

        {/* Progressive disclosure for CTAs */}
        <div className={css.ctaSection}>
          {!showWaitlist ? (
            <>
              <NamedLink
                name="SignupForUserTypePage"
                params={{ userType: 'provider' }}
                className={css.primaryCta}
              >
                Apply for Baby Clothing
              </NamedLink>
              <button
                className={css.secondaryLink}
                onClick={() => setShowWaitlist(true)}
              >
                Other categories →
              </button>
            </>
          ) : (
            <>
              <NamedLink
                name="SignupForUserTypePage"
                params={{ userType: 'provider' }}
                className={css.waitlistCta}
              >
                Join Waitlist (Other Categories)
              </NamedLink>
              <button
                className={css.backLink}
                onClick={() => setShowWaitlist(false)}
              >
                ← Back to baby clothing
              </button>
            </>
          )}
        </div>

        {/* Market indicators */}
        <div className={css.trustIndicators}>
          <div className={css.indicator}>
            <strong>4.5M</strong>
            <span>Indian Americans</span>
          </div>
          <div className={css.indicator}>
            <strong>$126K</strong>
            <span>Median income</span>
          </div>
          <div className={css.indicator}>
            <strong>200K+</strong>
            <span>Babies annually</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;