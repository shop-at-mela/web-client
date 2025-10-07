import React, { Suspense, lazy, useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { initPerformanceMonitoring } from './utils/performanceMonitoring';

import {
  Page,
  LayoutSingleColumn,
  H2,
  Button,
  ExternalLink,
  NamedLink,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

// Import above-the-fold sections immediately
import Hero from './sections/Hero/Hero';
import MarketOpportunity from './sections/MarketOpportunity/MarketOpportunity';

// Lazy load below-the-fold sections for better performance
const WhyClothing = lazy(() => import('./sections/WhyClothing/WhyClothing'));
const Benefits = lazy(() => import('./sections/Benefits/Benefits'));
const Process = lazy(() => import('./sections/Process/Process'));
const MarketTiming = lazy(() => import('./sections/MarketTiming/MarketTiming'));
const PartnershipPhilosophy = lazy(() => import('./sections/PartnershipPhilosophy/PartnershipPhilosophy'));
const SuccessStories = lazy(() => import('./sections/SuccessStories/SuccessStories'));
const FAQ = lazy(() => import('./sections/FAQ/FAQ'));

import css from './BrandPartnershipPage.module.css';

// Loading fallback component for better UX
const SectionLoader = () => (
  <div style={{
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite'
  }}>
    <style>{`
      @keyframes shimmer {
        0% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}</style>
    Loading...
  </div>
);

const BrandPartnershipPageComponent = () => {
  const intl = useIntl();
  const config = useConfiguration();

  // Initialize performance monitoring
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  // Form URLs - these can be configured externally
  const clothingFormUrl = config.brandPartnership?.clothingFormUrl || 'https://forms.google.com/clothing-partnership';
  const waitlistFormUrl = config.brandPartnership?.waitlistFormUrl || 'https://forms.google.com/category-waitlist';

  const handleFormClick = (formUrl, formType) => {
    // Track analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'form_click', {
        event_category: 'Brand Partnership',
        event_label: formType,
        value: 1
      });
    }

    // Open form in new tab
    window.open(formUrl, '_blank', 'noopener,noreferrer');
  };

  const schemaTitle = 'Partner with Mela: Build US Export Marketplace for Indian Baby Brands';
  const schemaDescription = 'Join Mela as a founding partner. Build the US export marketplace together. Zero listing fees, performance-based partnership. Baby clothing & accessories brands apply now.';

  // SEO Keywords for Indian baby clothing export market (updated with tariff resilience)
  const keywords = 'Indian baby clothing export, US marketplace partnership, baby clothing brands, Indian clothing export, diaspora market, baby accessories export, performance-based partnership, zero listing fees, Indian clothing USA, baby clothing wholesale, export partnership program, tariff resilient marketplace, global expansion platform, regulatory uncertainty partnership';

  return (
    <Page
      title={schemaTitle}
      description={schemaDescription}
      keywords={keywords}
      robots="index, follow, max-image-preview:large"
      openGraphType="website"
      schema={[
        {
          '@context': 'http://schema.org',
          '@type': 'WebPage',
          name: schemaTitle,
          description: schemaDescription,
          keywords: keywords,
          mainEntity: {
            '@type': 'Organization',
            name: 'Mela',
            description: 'Premium marketplace for authentic Indian baby clothing in the USA'
          }
        },
        {
          '@context': 'http://schema.org',
          '@type': 'Service',
          name: 'Mela Brand Partnership Program',
          description: 'Export partnership program for Indian baby clothing brands to reach US diaspora families',
          provider: {
            '@type': 'Organization',
            name: 'Mela'
          },
          areaServed: 'United States',
          serviceType: 'Export Marketplace Partnership',
          offers: {
            '@type': 'Offer',
            name: 'Zero Listing Fees Partnership',
            description: 'Performance-based partnership with no upfront costs',
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: '0',
              priceCurrency: 'USD',
              description: 'No listing fees - performance based only'
            }
          }
        },
        {
          '@context': 'http://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What are the requirements to partner with Mela?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'We partner with established Indian baby clothing brands that have quality products, manufacturing capabilities, and commitment to authentic Indian designs.'
              }
            },
            {
              '@type': 'Question',
              name: 'Are there any upfront fees?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No, Mela operates on a performance-based model with zero listing fees. We only succeed when our partners succeed.'
              }
            },
            {
              '@type': 'Question',
              name: 'What categories does Mela currently accept?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'We are currently accepting baby clothing and accessories brands. Other categories will be available through our waitlist program.'
              }
            }
          ]
        }
      ]}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
        className={css.pageRoot}
      >
        {/* Hero Section */}
        <Hero onFormClick={handleFormClick} clothingFormUrl={clothingFormUrl} waitlistFormUrl={waitlistFormUrl} />

        {/* Market Opportunity Overview */}
        <MarketOpportunity />

        {/* Below-the-fold sections with lazy loading */}
        <Suspense fallback={<SectionLoader />}>
          {/* Benefits Overview */}
          <Benefits />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Why Baby Clothing Focus */}
          <WhyClothing />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Market Timing Advantage */}
          <MarketTiming />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Partnership Philosophy */}
          <PartnershipPhilosophy />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Success Stories */}
          <SuccessStories />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* FAQ */}
          <FAQ />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          {/* Partnership Process - Moved to bottom */}
          <Process />
        </Suspense>

        {/* Final CTA */}
        <section className={css.finalCta}>
          <div className={css.container}>
            <H2 className={css.ctaTitle}>Ready to Reach Millions of US Families?</H2>
            <p className={css.ctaDescription}>
              Join our founding partnership program and start growing your brand in the US market with zero risk.
            </p>
            <div className={css.ctaButtons}>
              <NamedLink
                name="SignupForUserTypePage"
                params={{ userType: 'provider' }}
                className={css.primaryCtaButton}
              >
                Sign Up to Export Baby Clothing
              </NamedLink>
              <NamedLink
                name="SignupForUserTypePage"
                params={{ userType: 'provider' }}
                className={css.secondaryCtaButton}
              >
                Join Waitlist (Other Categories)
              </NamedLink>
            </div>
          </div>
        </section>
      </LayoutSingleColumn>
    </Page>
  );
};

const BrandPartnershipPage = compose(
  connect(
    null,
    null
  )
)(BrandPartnershipPageComponent);

export default BrandPartnershipPage;