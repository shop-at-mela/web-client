import React, { useState } from 'react';
import { H2, H3 } from '../../../../components';
import css from './MarketOpportunity.module.css';

const MarketOpportunity = () => {
  const [activeCard, setActiveCard] = useState(0);

  const opportunityCards = [
    {
      title: 'The Market Reality',
      icon: '📊',
      highlights: [
        '4.5M Indian Americans',
        '$126K median income',
        '200K+ babies annually',
        'Zero specialty retailers'
      ],
      details: [
        '4.5M Indian Americans seeking cultural connection',
        '$126K median household income (high purchasing power)',
        '200K+ Indian babies born in US annually',
        'Zero Indian baby clothing specialty retailers serving US market',
        'Parents willing to pay premium for quality + culture'
      ]
    },
    {
      title: 'Your Current Challenges',
      icon: '⚠️',
      highlights: [
        'High shipping costs',
        'No US market awareness',
        'Amazon commoditization',
        'Complex market entry'
      ],
      details: [
        '₹2,000-5,000 international shipping kills margins',
        'No awareness in US market despite quality products',
        'Amazon/Etsy commoditizes your brand story',
        'Individual marketing to US costly and inefficient',
        'Complex US market entry (payments, logistics, trust)'
      ]
    },
    {
      title: 'The Mela Solution',
      icon: '✅',
      highlights: [
        'Qualified traffic',
        'Premium positioning',
        'Performance-based',
        'Learn together'
      ],
      details: [
        'We drive qualified traffic to your existing website',
        'Category-focused SEO (not competing with millions)',
        'Curated positioning: premium, not price war',
        'You handle fulfillment using current systems',
        'Pay only commission on completed sales',
        'We learn and grow together in US market'
      ]
    }
  ];

  const nextCard = () => {
    setActiveCard((prev) => (prev + 1) % opportunityCards.length);
  };

  const prevCard = () => {
    setActiveCard((prev) => (prev - 1 + opportunityCards.length) % opportunityCards.length);
  };

  const goToCard = (index) => {
    setActiveCard(index);
  };


  return (
    <section className={css.section}>
      <div className={css.container}>
        <div className={css.header}>
          <H2 className={css.sectionTitle}>The US Indian Baby Clothing Market Opportunity</H2>
          <p className={css.sectionSubtitle}>
            A massive, underserved market waiting for authentic Indian brands
          </p>
        </div>

        {/* Mobile Preview Headers */}
        <div className={css.mobilePreviewContainer}>
          <div className={css.previewHeader}>
            <p className={css.previewText}>Navigate through: Market Reality → Your Challenges → Our Solution</p>
          </div>
          <div className={css.previewCards}>
            {opportunityCards.map((card, index) => (
              <div
                key={index}
                className={`${css.previewCard} ${index === activeCard ? css.previewCardActive : ''}`}
                onClick={() => goToCard(index)}
              >
                <span className={css.previewIcon}>{card.icon}</span>
                <span className={css.previewTitle}>{card.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Carousel + Desktop Grid */}
        <div className={css.carouselContainer}>
          {/* Mobile Carousel */}
          <div className={css.mobileCarousel}>
            <div className={css.carousel}>
              {/* Navigation Arrows */}
              <button
                className={css.navButton}
                onClick={prevCard}
                disabled={activeCard === 0}
                aria-label="Previous opportunity card"
              >
                ←
              </button>
              <button
                className={css.navButton}
                onClick={nextCard}
                disabled={activeCard === opportunityCards.length - 1}
                aria-label="Next opportunity card"
              >
                →
              </button>

              <div
                className={css.carouselTrack}
                style={{ transform: `translateX(-${activeCard * 100}%)` }}
              >
                {opportunityCards.map((card, index) => (
                  <div key={index} className={css.opportunityCard}>
                    <div className={css.cardIcon}>{card.icon}</div>
                    <H3 className={css.cardTitle}>{card.title}</H3>

                    <div className={css.highlightGrid}>
                      {card.highlights.map((highlight, i) => (
                        <div key={i} className={css.highlight}>
                          <span className={css.bullet}>✓</span>
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>

                    <div className={css.detailsList}>
                      {card.details.map((detail, i) => (
                        <div key={i} className={css.detail}>
                          <span className={css.detailBullet}>◆</span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Navigation */}
            <div className={css.indicators}>
              {opportunityCards.map((_, index) => (
                <button
                  key={index}
                  className={`${css.indicator} ${index === activeCard ? css.active : ''}`}
                  onClick={() => goToCard(index)}
                  aria-label={`Go to opportunity ${index + 1}`}
                />
              ))}
            </div>

          </div>

          {/* Desktop Grid */}
          <div className={css.desktopGrid}>
            {opportunityCards.map((card, index) => (
              <div key={index} className={css.desktopCard}>
                <div className={css.cardIcon}>{card.icon}</div>
                <H3 className={css.cardTitle}>{card.title}</H3>

                <div className={css.highlightGrid}>
                  {card.highlights.map((highlight, i) => (
                    <div key={i} className={css.highlight}>
                      <span className={css.bullet}>✓</span>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className={css.detailsList}>
                  {card.details.map((detail, i) => (
                    <div key={i} className={css.detail}>
                      <span className={css.detailBullet}>◆</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Stats Section */}
        <div className={css.statsSection}>
          <H3 className={css.statsTitle}>Market Size & Potential</H3>
          <div className={css.statsGrid}>
            <div className={css.statCard}>
              <div className={css.statNumber}>4.5M</div>
              <div className={css.statLabel}>Indian Americans</div>
            </div>
            <div className={css.statCard}>
              <div className={css.statNumber}>$126K</div>
              <div className={css.statLabel}>Median Income</div>
            </div>
            <div className={css.statCard}>
              <div className={css.statNumber}>200K+</div>
              <div className={css.statLabel}>Babies Annually</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketOpportunity;