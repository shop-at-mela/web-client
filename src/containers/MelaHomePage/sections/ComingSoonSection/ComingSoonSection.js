import React from 'react';

import css from './ComingSoonSection.module.css';

const COMING_SOON_FEATURES = [
  // COMMENTED OUT: marketplace features incompatible with directory positioning
  // {
  //   icon: '🛒',
  //   title: 'Unified Checkout',
  //   description: 'Shop from multiple Indian brands in one seamless checkout. No more brand-hopping.',
  // },
  // {
  //   icon: '⭐',
  //   title: 'Community Reviews',
  //   description: 'Verified reviews from Indian diaspora parents who\'ve bought and loved these products.',
  // },
  // {
  //   icon: '📦',
  //   title: 'Order Tracking',
  //   description: 'End-to-end tracking across all your Indian brand orders, in one place.',
  // },
  {
    icon: '🎁',
    title: 'Wishlists & Gift Registry',
    description: 'Curate lists for baby showers, Diwali gifting, and every milestone.',
  },
];

const ComingSoonSection = () => {
  return (
    <div className={css.root}>
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>More Coming to Mela</h2>
          <p className={css.subtitle}>
            We're adding more quality Indian brands, one at a time.
          </p>
        </div>

        <div className={css.featuresGrid}>
          {COMING_SOON_FEATURES.map((feature, index) => (
            <div key={index} className={css.featureCard}>
              <div className={css.featureIcon}>{feature.icon}</div>
              <h3 className={css.featureTitle}>{feature.title}</h3>
              <p className={css.featureDescription}>{feature.description}</p>
              <span className={css.comingSoonBadge}>Coming Soon</span>
            </div>
          ))}
        </div>

        <p className={css.currentNote}>
          Checkout happens directly on each brand's Shopify store — we link you there securely.
        </p>
      </div>
    </div>
  );
};

export default ComingSoonSection;
