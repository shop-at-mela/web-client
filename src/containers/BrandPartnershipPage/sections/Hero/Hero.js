import React from 'react';
import { H1, H3 } from '../../../../components';
import css from './Hero.module.css';

const Hero = () => {
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

        {/* CTA */}
        <div className={css.ctaSection}>
          <a href="mailto:shopatmela@gmail.com" className={css.primaryCta}>
            Contact Us to Partner
          </a>
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