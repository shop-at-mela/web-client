import React, { useState } from 'react';
import { H2, H3 } from '../../../../components';
import css from './MarketTiming.module.css';

const MarketTiming = () => {
  const [activeAdvantage, setActiveAdvantage] = useState(0);

  const advantagePoints = [
    {
      title: 'First-Mover Advantage',
      icon: '🎯',
      description: 'While competitors hesitate, early partners capture mindshare and customer loyalty in the US diaspora market.',
      benefit: 'Establish brand recognition before competition increases'
    },
    {
      title: 'Warren Buffett Wisdom',
      icon: '💡',
      description: '"Be fearful when others are greedy, and greedy when others are fearful." This is your moment to be bold.',
      benefit: 'Historical proof that uncertainty creates the best opportunities'
    },
    {
      title: 'Building Through Cycles',
      icon: '🏗️',
      description: 'Regulatory changes are temporary. Brand presence and customer relationships built now last decades.',
      benefit: 'Long-term brand building while others focus on short-term concerns'
    },
    {
      title: 'Performance-Based Protection',
      icon: '🛡️',
      description: 'Zero upfront investment means you adapt with market conditions. No fixed costs, only shared success.',
      benefit: 'Complete risk protection with unlimited upside potential'
    }
  ];

  const timeline = [
    {
      period: 'NOW',
      status: 'Opportunity Window',
      description: 'Limited competition, maximum attention from US diaspora families',
      highlight: true,
      badge: '⚡ OPTIMAL TIMING'
    },
    {
      period: '6-12 MONTHS',
      status: 'Market Stabilization',
      description: 'Policies clarify, more brands enter, competition increases',
      highlight: false,
      badge: null
    },
    {
      period: '1-2 YEARS',
      status: 'Saturated Market',
      description: 'Established players dominate, harder to break through',
      highlight: false,
      badge: null
    }
  ];

  const nextAdvantage = () => {
    setActiveAdvantage((prev) => (prev + 1) % advantagePoints.length);
  };

  const prevAdvantage = () => {
    setActiveAdvantage((prev) => (prev - 1 + advantagePoints.length) % advantagePoints.length);
  };

  return (
    <section className={css.section}>
      <div className={css.container}>
        <div className={css.header}>
          <H2 className={css.sectionTitle}>
            Why Now? Turning Uncertainty Into Your Competitive Advantage
          </H2>
          <p className={css.sectionSubtitle}>
            While others wait for "perfect" conditions, forward-thinking brands are building lasting market presence.
            Geopolitical uncertainty is temporary—brand loyalty is permanent.
          </p>
        </div>

        {/* Advantage Carousel */}
        <div className={css.advantageSection}>
          <H3 className={css.advantageTitle}>Strategic Advantages of Starting Now</H3>

          {/* Mobile Carousel */}
          <div className={css.mobileCarousel}>
            <div className={css.carouselContainer}>
              {/* Navigation Arrows */}
              <button
                className={css.navButton}
                onClick={prevAdvantage}
                aria-label="Previous advantage"
              >
                ←
              </button>
              <button
                className={css.navButton}
                onClick={nextAdvantage}
                aria-label="Next advantage"
              >
                →
              </button>

              <div
                className={css.carouselTrack}
                style={{ transform: `translateX(-${activeAdvantage * 100}%)` }}
              >
                {advantagePoints.map((advantage, index) => (
                  <div key={index} className={css.advantageCard}>
                    <div className={css.advantageIcon}>
                      {advantage.icon}
                    </div>
                    <H3 className={css.cardTitle}>
                      {advantage.title}
                    </H3>
                    <p className={css.cardDescription}>
                      {advantage.description}
                    </p>
                    <div className={css.benefit}>
                      <span className={css.benefitLabel}>Key Benefit:</span>
                      <span className={css.benefitText}>
                        {advantage.benefit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Navigation - Mobile Only */}
            <div className={css.advantageIndicators}>
              {advantagePoints.map((_, index) => (
                <button
                  key={index}
                  className={`${css.indicator} ${index === activeAdvantage ? css.active : ''}`}
                  onClick={() => setActiveAdvantage(index)}
                  aria-label={`Go to advantage ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Grid - 2x2 for 4 advantage cards */}
          <div className={css.desktopGrid}>
            {advantagePoints.map((advantage, index) => (
              <div key={index} className={css.desktopCard}>
                <div className={css.advantageIcon}>
                  {advantage.icon}
                </div>
                <H3 className={css.cardTitle}>
                  {advantage.title}
                </H3>
                <p className={css.cardDescription}>
                  {advantage.description}
                </p>
                <div className={css.benefit}>
                  <span className={css.benefitLabel}>Key Benefit:</span>
                  <span className={css.benefitText}>
                    {advantage.benefit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className={css.timelineSection}>
          <H3 className={css.timelineTitle}>Market Entry Timeline: The Window is Now</H3>
          <div className={css.timeline}>
            {timeline.map((phase, index) => (
              <div
                key={index}
                className={`${css.timelineItem} ${phase.highlight ? css.highlighted : ''}`}
              >
                <div className={css.timelinePeriod}>{phase.period}</div>
                <div className={css.timelineStatus}>{phase.status}</div>
                <div className={css.timelineDescription}>{phase.description}</div>
                {phase.badge && (
                  <div className={css.opportunityBadge}>
                    {phase.badge}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resilience CTA */}
        <div className={css.resilienceSection}>
          <div className={css.resilienceIcon}>🌍</div>
          <H3 className={css.resilienceTitle}>
            Built for Global Resilience, Not Just US Markets
          </H3>
          <p className={css.resilienceDescription}>
            Mela isn't just a US marketplace—we're building a global platform. Starting with the US to prove our model,
            then expanding to Europe, Middle East, and Australia. Partner with us now and be ready for every market we enter.
          </p>
          <div className={css.globalMarkets}>
            <span className={css.marketBadge}>🇺🇸 USA (NOW)</span>
            <span className={css.marketBadge}>🇪🇺 Europe (2026)</span>
            <span className={css.marketBadge}>🇦🇪 Middle East (2026)</span>
            <span className={css.marketBadge}>🇦🇺 Australia (2026)</span>
          </div>
        </div>

        {/* Quote Section */}
        <div className={css.quoteSection}>
          <div className={css.quoteIcon}>"</div>
          <blockquote className={css.quote}>
            Be fearful when others are greedy, and greedy when others are fearful.
          </blockquote>
          <div className={css.quoteAuthor}>— Warren Buffett</div>
          <div className={css.quoteContext}>
            Now is the time to be greedy for opportunity while others are fearful of uncertainty.
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketTiming;