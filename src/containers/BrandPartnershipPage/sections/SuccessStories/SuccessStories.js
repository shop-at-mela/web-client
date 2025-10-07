import React from 'react';
import { H2 } from '../../../../components';
import css from './SuccessStories.module.css';

const SuccessStories = () => {
  return (
    <section className={css.section}>
      <div className={css.container}>
        <div className={css.header}>
          <H2 className={css.sectionTitle}>Partner Success Stories</H2>
          <p className={css.sectionSubtitle}>
            Building success together with our founding brand partners
          </p>
        </div>

        <div className={css.storyCard}>
          <div className={css.storyIcon}>🚀</div>
          <div className={css.storyContent}>
            <h3 className={css.storyTitle}>Founding Partners Program</h3>
            <p className={css.storyDescription}>
              We're in the early stages of building Mela with our founding brand partners.
              Your success stories will be featured here as we grow together.
            </p>
            <div className={css.commitment}>
              <div className={css.commitmentIcon}>🤝</div>
              <div className={css.commitmentText}>
                <strong>Our Commitment:</strong> Every founding partner becomes a case study
                of success we'll celebrate and share with the community.
              </div>
            </div>
          </div>
        </div>

        <div className={css.benefitsGrid}>
          <div className={css.benefitCard}>
            <div className={css.benefitIcon}>📈</div>
            <div className={css.benefitTitle}>First to Market</div>
            <div className={css.benefitDescription}>
              Establish your brand before competition increases
            </div>
          </div>
          <div className={css.benefitCard}>
            <div className={css.benefitIcon}>🎯</div>
            <div className={css.benefitTitle}>Direct Impact</div>
            <div className={css.benefitDescription}>
              Shape platform decisions and feature development
            </div>
          </div>
          <div className={css.benefitCard}>
            <div className={css.benefitIcon}>🌟</div>
            <div className={css.benefitTitle}>Brand Recognition</div>
            <div className={css.benefitDescription}>
              Featured prominently as founding partner
            </div>
          </div>
        </div>

        <div className={css.ctaSection}>
          <div className={css.ctaIcon}>🎯</div>
          <h3 className={css.ctaTitle}>Become a Founding Partner Success Story</h3>
          <p className={css.ctaDescription}>
            Shape the platform, capture first-mover advantage, and build lasting brand presence
            in the lucrative US Indian diaspora market.
          </p>
          <div className={css.ctaBenefits}>
            <div className={css.ctaBenefit}>
              <span className={css.benefitIcon}>🥇</span>
              <span>First-mover advantage</span>
            </div>
            <div className={css.ctaBenefit}>
              <span className={css.benefitIcon}>📈</span>
              <span>Platform influence</span>
            </div>
            <div className={css.ctaBenefit}>
              <span className={css.benefitIcon}>⭐</span>
              <span>Featured prominence</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;