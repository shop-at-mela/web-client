import React from 'react';

import css from './ComingSoonSection.module.css';

const COMING_SOON_FEATURES = [
  {
    icon: '🎁',
    title: 'Wishlists & Gift Registry',
  },
];

const ComingSoonSection = () => {
  return (
    <div className={css.root}>
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>More Coming to Mela</h2>
        </div>

        <div className={css.featuresGrid}>
          {COMING_SOON_FEATURES.map((feature, index) => (
            <div key={index} className={css.featureCard}>
              <div className={css.featureIcon}>{feature.icon}</div>
              <h3 className={css.featureTitle}>{feature.title}</h3>
              <span className={css.comingSoonBadge}>Coming Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComingSoonSection;
